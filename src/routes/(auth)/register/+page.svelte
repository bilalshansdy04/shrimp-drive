<script lang="ts">
	import { AtSign, Key, UserPlus, Mail, Check, X } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import {
		generateMasterVaultKey,
		generateRecoveryPhrase,
		deriveKeysFromPassword,
		wrapMasterKey
	} from '$lib/client/crypto';

	let { form } = $props<{ form: any }>();
	let isLoading = $state(false);

	let username = $state('');
	let rawPassword = $state('');

	let isUsernameAvailable = $state<boolean | null>(null);
	let isCheckingUsername = $state(false);

	let showRecoveryModal = $state(false);
	let recoveryPhrase = $state('');

	let authHash = $state('');
	let encryptedVaultKey = $state('');
	let formElement = $state<HTMLFormElement | null>(null);
	let useCustomStorage = $state(false);

	async function checkUsernameManual() {
		if (username.trim() === '') {
			isUsernameAvailable = null;
			return;
		}
		isCheckingUsername = true;
		try {
			const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
			const data = await res.json();
			isUsernameAvailable = data.available;
		} catch (e: any) {
			console.error('Error during fetch:', e);
			alert('Error: ' + (e.message || 'Unknown error'));
		} finally {
			isCheckingUsername = false;
		}
	}

	async function handleFormSubmit() {
		if (isUsernameAvailable !== true) {
			alert('Silakan tekan tombol Check untuk memverifikasi ketersediaan Username Anda.');
			return;
		}

		isLoading = true;

		try {
			// 1. Generate DEK
			const dek = generateMasterVaultKey();

			// 2. Derive KEK and Auth Hash from Password
			const { kek, authHash: derivedAuthHash } = await deriveKeysFromPassword(
				rawPassword,
				username
			);

			// 3. Wrap DEK with KEK
			const wrappedKey = await wrapMasterKey(dek, kek);

			// 4. Generate Recovery Phrase
			const phrase = generateRecoveryPhrase(dek);

			// Set state
			authHash = derivedAuthHash;
			encryptedVaultKey = wrappedKey;
			recoveryPhrase = phrase;

			isLoading = false;
			showRecoveryModal = true;
		} catch (err: any) {
			console.error('Crypto error:', err);
			alert('Failed to generate secure keys. Please try again.');
			isLoading = false;
		}
	}

	function confirmRecoverySaved() {
		showRecoveryModal = false;
		// After modal is closed, programmatically submit the form
		if (formElement) {
			formElement.submit();
		}
	}
</script>

<div
	class="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B0E14] p-6 text-white"
>
	<div
		class="pointer-events-none absolute inset-0 z-0 opacity-10"
		style="background: url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%232A3241\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"
	></div>
	<div
		class="pointer-events-none absolute inset-0 z-0"
		style="background: radial-gradient(circle at 50% -20%, rgba(255, 107, 74, 0.15), transparent 60%);"
	></div>

	<main class="z-10 w-full max-w-[400px]">
		<header class="mb-8 flex flex-col items-center text-center">
			<div class="mb-2 flex items-center gap-2">
				<img
					alt="Shrimp Drive Logo"
					class="h-10 w-10 object-contain"
					src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGvKZiSWhKMKF4oL_J9_HFMU0WChW-H3PdTFKDH5fcwzeRD8cucxiu_m8SCwkkem_gncQ3pHQMY9XKT1E_Qo_Load05oN_wTLuSRdXuYGaOIOAuwO-Jy6LtN_Xg9SR377LbmXzEHCaItWXyb5TYNgLWxalFLC77QpW1a9iCyl4JMZYRXakuFTpelbzhSNjKiFehO624W8ZuGIfUwWxUCn8r76HAs-112uICmmFtYLuBBMM0ZqDiZD2"
				/>
				<h1 class="text-3xl font-bold text-white">Shrimp Drive</h1>
			</div>
			<p class="text-sm text-gray-400">Create your private storage account.</p>
		</header>

		<div
			class="rounded-2xl border border-[#2A3241] bg-[#151921] p-6 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.5)]"
		>
			{#if form?.error}
				<div class="mb-4 rounded-lg bg-[#93000a] px-4 py-2 text-sm font-medium text-[#ffdad6]">
					{form.error}
				</div>
			{/if}
			{#if form?.success}
				<div class="mb-4 rounded-lg bg-[#00390f] px-4 py-2 text-sm font-medium text-[#73f382]">
					{form.success}
				</div>
			{/if}

			{#if !form?.success}
				<form
					bind:this={formElement}
					method="POST"
					use:enhance={({ cancel }) => {
						if (!showRecoveryModal && authHash === '') {
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
							<label class="mb-1 block text-xs font-medium text-gray-400" for="username"
								>Username</label
							>
							<div class="relative flex items-center gap-2">
								<div class="relative flex flex-1 items-center">
									<AtSign
										class="absolute left-3 text-[#2A3241] transition-colors group-focus-within:text-[#FF6B4A]"
										size={20}
									/>
									<input
										bind:value={username}
										oninput={() => (isUsernameAvailable = null)}
										name="username"
										id="username"
										class="w-full rounded-lg border border-[#2A3241] bg-[#0B0E14] py-2 pr-3 pl-10 text-sm text-white transition-colors focus:border-[#FF6B4A] focus:outline-none"
										placeholder="admin_user"
										type="text"
										required
									/>
								</div>
								<button
									type="button"
									onclick={checkUsernameManual}
									disabled={isCheckingUsername || !username}
									class="flex h-[38px] shrink-0 items-center justify-center rounded-lg bg-[#2A3241] px-4 text-xs font-medium text-white transition-colors hover:bg-[#323b4d] disabled:opacity-50"
								>
									{#if isCheckingUsername}
										<span class="animate-pulse">...</span>
									{:else}
										Check
									{/if}
								</button>
							</div>
							{#if isUsernameAvailable === true}
								<p class="mt-2 flex items-center gap-1 text-xs text-green-400">
									<Check size={14} /> Username tersedia
								</p>
							{:else if isUsernameAvailable === false}
								<p class="mt-2 flex items-center gap-1 text-xs text-red-400">
									<X size={14} /> Username sudah dipakai
								</p>
							{/if}
						</div>
						<div class="group relative">
							<label class="mb-1 block text-xs font-medium text-gray-400" for="email">Email</label>
							<div class="relative flex items-center">
								<Mail
									class="absolute left-3 text-[#2A3241] transition-colors group-focus-within:text-[#FF6B4A]"
									size={20}
								/>
								<input
									name="email"
									id="email"
									class="w-full rounded-lg border border-[#2A3241] bg-[#0B0E14] py-2 pr-3 pl-10 text-sm text-white transition-colors focus:border-[#FF6B4A] focus:outline-none"
									placeholder="you@example.com"
									type="email"
									required
								/>
							</div>
						</div>
						<div class="group relative">
							<label class="mb-1 block text-xs font-medium text-gray-400" for="displayName"
								>Display Name</label
							>
							<div class="relative flex items-center">
								<UserPlus
									class="absolute left-3 text-[#2A3241] transition-colors group-focus-within:text-[#FF6B4A]"
									size={20}
								/>
								<input
									name="displayName"
									id="displayName"
									class="w-full rounded-lg border border-[#2A3241] bg-[#0B0E14] py-2 pr-3 pl-10 text-sm text-white transition-colors focus:border-[#FF6B4A] focus:outline-none"
									placeholder="John Doe"
									type="text"
									required
								/>
							</div>
						</div>
						<div class="group relative">
							<label class="mb-1 block text-xs font-medium text-gray-400" for="password"
								>Password</label
							>
							<div class="relative flex items-center">
								<Key
									class="absolute left-3 text-[#2A3241] transition-colors group-focus-within:text-[#FF6B4A]"
									size={20}
								/>
								<!-- Note: name="password" is still present so the browser autocomplete works, but the server will read authHash instead -->
								<input
									bind:value={rawPassword}
									name="password"
									id="password"
									class="w-full rounded-lg border border-[#2A3241] bg-[#0B0E14] py-2 pr-3 pl-10 text-sm text-white transition-colors focus:border-[#FF6B4A] focus:outline-none"
									placeholder="••••••••"
									type="password"
									required
									minlength="8"
								/>
							</div>
						</div>

						<!-- Custom Storage Section -->
						<div class="rounded-lg border border-[#2A3241] bg-[#151921] p-4">
							<label class="flex items-center gap-2 cursor-pointer">
								<input type="checkbox" bind:checked={useCustomStorage} class="rounded border-[#2A3241] bg-[#0B0E14] text-[#FF6B4A] focus:ring-[#FF6B4A] focus:ring-offset-[#0B0E14]" />
								<span class="text-sm font-medium text-white">Use Custom Telegram Storage</span>
							</label>
							{#if useCustomStorage}
								<div class="mt-4 space-y-3 border-t border-[#2A3241] pt-4">
									<div class="group relative">
										<label class="mb-1 block text-xs font-medium text-gray-400" for="botToken">Bot API Token</label>
										<input
											name="botToken"
											id="botToken"
											class="w-full rounded-lg border border-[#2A3241] bg-[#0B0E14] py-2 px-3 text-sm text-white transition-colors focus:border-[#FF6B4A] focus:outline-none"
											placeholder="1234567890:AAH_XYZ..."
											type="text"
											required={useCustomStorage}
										/>
									</div>
									<div class="group relative">
										<label class="mb-1 block text-xs font-medium text-gray-400" for="chatId">Channel / Chat ID</label>
										<input
											name="chatId"
											id="chatId"
											class="w-full rounded-lg border border-[#2A3241] bg-[#0B0E14] py-2 px-3 text-sm text-white transition-colors focus:border-[#FF6B4A] focus:outline-none"
											placeholder="-1001234567890"
											type="text"
											required={useCustomStorage}
										/>
									</div>
									<p class="text-xs text-gray-400">
										Your files will be stored in your own Telegram Channel. This bot will be automatically saved as your primary storage node.
									</p>
								</div>
							{/if}
						</div>
					</div>

					<button
						type="submit"
						class="mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF6B4A] px-6 py-3 text-sm font-bold text-[#0B0E14] transition-colors hover:bg-[#FF8264] {isLoading ? 'opacity-50 pointer-events-none' : ''}"
					>
						{isLoading ? 'Creating Account...' : 'Create Account'}
					</button>

					<div class="mb-4 relative flex items-center py-2">
						<div class="flex-grow border-t border-[#2A3241]"></div>
						<span class="mx-4 shrink-0 text-xs text-gray-500">ATAU</span>
						<div class="flex-grow border-t border-[#2A3241]"></div>
					</div>

					<a
						href="/login/google"
						class="flex w-full items-center justify-center gap-3 rounded-lg border border-[#2A3241] bg-[#151921] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#2A3241]"
					>
						<svg class="h-5 w-5" viewBox="0 0 24 24">
							<path
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								fill="#4285F4"
							/>
							<path
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								fill="#34A853"
							/>
							<path
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								fill="#FBBC05"
							/>
							<path
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 15.01 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								fill="#EA4335"
							/>
						</svg>
						Continue with Google
					</a>
				</form>

				{#if showRecoveryModal}
					<div
						class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
					>
						<div
							class="w-full max-w-md rounded-2xl border border-[#2A3241] bg-[#0B0E14] p-6 shadow-2xl"
						>
							<h2 class="mb-2 text-xl font-bold text-white">Your Recovery Phrase</h2>
							<p class="mb-4 text-sm font-medium text-red-400">
								WARNING: This is the ONLY time you will see this. Write it down offline. If you lose
								your password and this phrase, your files are gone forever!
							</p>

							<div
								class="mb-6 grid grid-cols-3 gap-2 rounded-lg bg-[#151921] p-4 font-mono text-xs"
							>
								{#each recoveryPhrase.split(' ') as word, i}
									<div class="flex items-center gap-2">
										<span class="text-gray-500">{i + 1}.</span>
										<span class="font-bold text-white">{word}</span>
									</div>
								{/each}
							</div>

							<div class="flex flex-col gap-3">
								<button
									onclick={confirmRecoverySaved}
									class="w-full rounded-lg bg-[#FF6B4A] py-3 text-sm font-bold text-black transition-colors hover:bg-[#ff8264]"
								>
									I have safely stored this phrase
								</button>
							</div>
						</div>
					</div>
				{/if}

				<div class="mt-6 text-center text-sm text-gray-400">
					Sudah punya akun?
					<a
						href="/login"
						class="font-medium text-[#FF6B4A] transition-colors hover:text-[#FF8264] hover:underline"
						>Sign In di sini</a
					>
				</div>
			{/if}
		</div>
	</main>
</div>
