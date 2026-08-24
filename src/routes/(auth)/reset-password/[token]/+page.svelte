<script lang="ts">
	import { Key, Shield } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import { deriveKeysFromPassword, recoverMasterKeyFromPhrase, wrapMasterKey } from '$lib/client/crypto';

	let { form, data } = $props<{ form: any; data: any }>();
	let isLoading = $state(false);

	let recoveryPhrase = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let localError = $state('');
	
	let authHash = $state('');
	let encryptedVaultKey = $state('');
	
	// Ref to the form to submit it programmatically
	let formElement: HTMLFormElement | null = $state(null);

	async function handleFormSubmit() {
		localError = '';
		if (newPassword !== confirmPassword) {
			localError = data.hasGoogleId ? 'PINs do not match.' : 'Passwords do not match.';
			return;
		}
		if (data.hasGoogleId) {
			if (newPassword.length !== 6 || !/^\d+$/.test(newPassword)) {
				localError = 'PIN must be exactly 6 digits.';
				return;
			}
		} else {
			if (newPassword.length < 8) {
				localError = 'Password must be at least 8 characters.';
				return;
			}
		}
		if (recoveryPhrase.trim().split(/\s+/).length !== 12) {
			localError = 'Recovery phrase must be exactly 12 words.';
			return;
		}

		isLoading = true;
		try {
			// 1. Recover DEK from 12 words
			const dek = recoverMasterKeyFromPhrase(recoveryPhrase.trim());
			
			// 2. Derive KEK and AuthHash from new password
			const keys = await deriveKeysFromPassword(newPassword, data.email);
			authHash = keys.authHash;

			// 3. Wrap the DEK with the new KEK
			encryptedVaultKey = await wrapMasterKey(dek, keys.kek);

			// 4. Submit form
			setTimeout(() => {
				if (formElement) formElement.submit();
			}, 100);
		} catch (err: any) {
			console.error('Crypto error during recovery', err);
			localError = 'Invalid recovery phrase. Check your 12 words.';
			isLoading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-[#0B0E14] p-6 text-white">
	<div class="w-full max-w-[400px] rounded-2xl border border-[#2A3241] bg-[#151921] p-6 shadow-lg">
		<h1 class="mb-2 text-2xl font-bold">Reset Password & Vault</h1>
		<p class="mb-6 text-sm text-gray-400">Enter your 12-Word Recovery Phrase and a new password.</p>

		{#if data.error}
			<div class="mb-6 rounded-lg bg-[#93000a] p-4 text-[#ffdad6]">
				{data.error}
			</div>
			<a
				href="/forgot-password"
				class="inline-block w-full rounded-lg border border-[#2A3241] px-6 py-2 text-center text-sm font-medium hover:bg-[#2A3241]"
			>
				Request New Link
			</a>
		{:else if form?.success}
			<div class="mb-6 rounded-lg bg-[#00390f] p-4 text-[#73f382]">
				{form.success}
			</div>
			<a
				href="/login"
				class="inline-block w-full rounded-lg bg-[#FF6B4A] px-6 py-3 text-center text-sm font-bold text-[#0B0E14] hover:bg-[#FF8264]"
			>
				Continue to Login
			</a>
		{:else}
			{#if form?.error}
				<div class="mb-4 rounded-lg bg-[#93000a] px-4 py-2 text-sm font-medium text-[#ffdad6]">
					{form.error}
				</div>
			{/if}
			{#if localError}
				<div class="mb-4 rounded-lg bg-[#93000a] px-4 py-2 text-sm font-medium text-[#ffdad6]">
					{localError}
				</div>
			{/if}

			<form
				bind:this={formElement}
				method="POST"
				use:enhance={({ cancel }) => {
					if (authHash === '') {
						cancel();
						handleFormSubmit();
						return;
					}
					isLoading = true;
					return async ({ update }) => {
						await update();
						isLoading = false;
					};
				}}
			>
				<input type="hidden" name="authHash" value={authHash} />
				<input type="hidden" name="encryptedVaultKey" value={encryptedVaultKey} />

				<div class="mb-6 space-y-4">
					<div class="group relative">
						<label class="mb-1 block text-xs font-medium text-gray-400" for="phrase"
							>12-Word Recovery Phrase</label
						>
						<div class="relative flex items-center">
							<Shield
								class="absolute left-3 text-[#2A3241] transition-colors group-focus-within:text-[#FF6B4A]"
								size={20}
							/>
							<input
								bind:value={recoveryPhrase}
								id="phrase"
								class="w-full rounded-lg border border-[#2A3241] bg-[#0B0E14] py-2 pr-3 pl-10 text-sm text-white transition-colors focus:border-[#FF6B4A] focus:outline-none"
								placeholder="word1 word2 word3..."
								type="text"
								autocomplete="off"
								required
							/>
						</div>
					</div>
					<div class="group relative">
						<label class="mb-1 block text-xs font-medium text-gray-400" for="password"
							>{data.hasGoogleId ? 'New Vault PIN' : 'New Password'}</label
						>
						<div class="relative flex items-center">
							<Key
								class="absolute left-3 text-[#2A3241] transition-colors group-focus-within:text-[#FF6B4A]"
								size={20}
							/>
							<input
								bind:value={newPassword}
								id="password"
								class="w-full rounded-lg border border-[#2A3241] bg-[#0B0E14] py-2 pr-3 pl-10 text-sm text-white transition-colors focus:border-[#FF6B4A] focus:outline-none {data.hasGoogleId ? 'font-mono tracking-[0.5em] text-center' : ''}"
								placeholder={data.hasGoogleId ? '••••••' : '••••••••'}
								type="password"
								required
								minlength={data.hasGoogleId ? '6' : '8'}
								maxlength={data.hasGoogleId ? '6' : undefined}
							/>
						</div>
					</div>
					<div class="group relative">
						<label class="mb-1 block text-xs font-medium text-gray-400" for="confirmPassword"
							>{data.hasGoogleId ? 'Confirm Vault PIN' : 'Confirm Password'}</label
						>
						<div class="relative flex items-center">
							<Key
								class="absolute left-3 text-[#2A3241] transition-colors group-focus-within:text-[#FF6B4A]"
								size={20}
							/>
							<input
								bind:value={confirmPassword}
								id="confirmPassword"
								class="w-full rounded-lg border border-[#2A3241] bg-[#0B0E14] py-2 pr-3 pl-10 text-sm text-white transition-colors focus:border-[#FF6B4A] focus:outline-none {data.hasGoogleId ? 'font-mono tracking-[0.5em] text-center' : ''}"
								placeholder={data.hasGoogleId ? '••••••' : '••••••••'}
								type="password"
								required
								minlength={data.hasGoogleId ? '6' : '8'}
								maxlength={data.hasGoogleId ? '6' : undefined}
							/>
						</div>
					</div>
				</div>

				<button
					type="submit"
					disabled={isLoading}
					class="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF6B4A] px-6 py-3 text-sm font-bold text-[#0B0E14] transition-colors hover:bg-[#FF8264] disabled:opacity-50"
				>
					{isLoading ? 'Resetting...' : data.hasGoogleId ? 'Restore Vault & Reset PIN' : 'Restore Vault & Reset Password'}
				</button>
			</form>
		{/if}
	</div>
</div>
