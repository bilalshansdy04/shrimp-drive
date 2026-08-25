<script lang="ts">
	import { enhance } from '$app/forms';
	import { User, Key, Shield, Eye, EyeOff } from 'lucide-svelte';
	import {
		deriveKeysFromPassword,
		generateMasterVaultKey,
		wrapMasterKey,
		generateRecoveryPhrase
	} from '$lib/client/crypto';
	import { vaultKeyStore, saveVaultKeyToSession } from '$lib/client/encryptionStore';
	import { get } from 'svelte/store';

	let { data, form } = $props<{ data: any; form: any }>();
	let isLoading = $state(false);

	let rawDek = $state('');
	let recoveryPhrase = $state('');
	let isKeyRevealed = $state(false);

	let showRevealModal = $state(false);
	let revealStep = $state(1); // 1: Password, 2: OTP
	let revealPassword = $state('');
	let revealOtp = $state('');
	let revealError = $state('');
	let isRevealing = $state(false);
	
	let hideKeyTimeout: NodeJS.Timeout | null = null;

	$effect(() => {
		const dek = get(vaultKeyStore);
		if (dek) {
			rawDek = Array.from(dek)
				.map((b) => b.toString(16).padStart(2, '0'))
				.join('');
			recoveryPhrase = generateRecoveryPhrase(dek);
		}
	});

	async function handleRevealStep1() {
		if (!revealPassword) {
			revealError = 'Password is required';
			return;
		}

		isRevealing = true;
		revealError = '';

		try {
			// Same as login: derive authHash from password
			const { authHash } = await deriveKeysFromPassword(revealPassword, data.user.email);

			const res = await fetch('/api/profile/request-key-reveal', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ authHash })
			});
			const rData = await res.json();
			if (rData.success) {
				revealStep = 2; // Move to OTP
			} else {
				revealError = rData.error || 'Incorrect password';
			}
		} catch (e) {
			revealError = 'Failed to verify password';
		}
		isRevealing = false;
	}

	async function handleRevealStep2() {
		if (!revealOtp || revealOtp.length !== 6) {
			revealError = 'Enter a valid 6-digit OTP';
			return;
		}

		isRevealing = true;
		revealError = '';

		try {
			const res = await fetch('/api/profile/verify-key-reveal', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ otp: revealOtp })
			});
			const rData = await res.json();
			if (rData.success) {
				showRevealModal = false;
				isKeyRevealed = true;
				
				if (hideKeyTimeout) clearTimeout(hideKeyTimeout);
				hideKeyTimeout = setTimeout(() => {
					isKeyRevealed = false;
				}, 60000);
			} else {
				revealError = rData.error || 'Incorrect OTP';
			}
		} catch (e) {
			revealError = 'Failed to verify OTP';
		}
		isRevealing = false;
	}
</script>

<div class="p-6">
	<h1 class="mb-8 text-3xl font-bold text-white">Profile Settings</h1>

	{#if form?.success}
		<div class="mb-6 rounded-lg bg-[#00390f] px-4 py-3 text-sm font-medium text-[#73f382]">
			{form.success}
		</div>
	{/if}
	{#if form?.error}
		<div class="mb-6 rounded-lg bg-[#93000a] px-4 py-3 text-sm font-medium text-[#ffdad6]">
			{form.error}
		</div>
	{/if}

	<div class="grid gap-6 md:grid-cols-2">
		<!-- Profile Information -->
		<section class="rounded-2xl border border-[#2A3241] bg-[#151921] p-6 shadow-lg">
			<h2 class="mb-6 flex items-center gap-2 text-xl font-bold text-white">
				<User class="text-[#FF6B4A]" size={24} />
				Profile Information
			</h2>
			<form
				method="POST"
				action="?/updateProfile"
				use:enhance={() => {
					isLoading = true;
					return async ({ update }) => {
						await update();
						isLoading = false;
					};
				}}
			>
				<div class="mb-4 space-y-4">
					<div class="group relative">
						<label class="mb-1 block text-xs font-medium text-gray-400" for="displayName"
							>Display Name</label
						>
						<input
							name="displayName"
							id="displayName"
							value={data.user.displayName}
							class="w-full rounded-lg border border-[#2A3241] bg-[#0B0E14] px-4 py-2 text-sm text-white transition-colors focus:border-[#FF6B4A] focus:outline-none"
							type="text"
							required
						/>
					</div>
					<div class="group relative">
						<label class="mb-1 block text-xs font-medium text-gray-400">Username</label>
						<input
							value={data.user.username}
							class="w-full cursor-not-allowed rounded-lg border border-[#2A3241] bg-[#0B0E14] px-4 py-2 text-sm text-gray-500 opacity-70"
							type="text"
							disabled
						/>
					</div>
					<div class="group relative">
						<label class="mb-1 block text-xs font-medium text-gray-400">Email</label>
						<input
							value={data.user.email}
							class="w-full cursor-not-allowed rounded-lg border border-[#2A3241] bg-[#0B0E14] px-4 py-2 text-sm text-gray-500 opacity-70"
							type="text"
							disabled
						/>
					</div>
				</div>
				<button
					type="submit"
					disabled={isLoading}
					class="mt-4 rounded-lg bg-[#2A3241] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#343D4F] disabled:opacity-50"
				>
					{isLoading ? 'Saving...' : 'Save Profile'}
				</button>
			</form>
		</section>

		<!-- Password / PIN -->
		<section class="rounded-2xl border border-[#2A3241] bg-[#151921] p-6 shadow-lg">
			<h2 class="mb-6 flex items-center gap-2 text-xl font-bold text-white">
				<Key class="text-[#FF6B4A]" size={24} />
				{data.user.googleId ? 'Change Vault PIN' : 'Change Password'}
			</h2>
			<form
				onsubmit={async (e) => {
					e.preventDefault();
					isLoading = true;
					const formEl = e.currentTarget;
					const currentPassword = (formEl.elements.namedItem('currentPassword') as HTMLInputElement)
						?.value;
					const newPassword = (formEl.elements.namedItem('newPassword') as HTMLInputElement).value;
					const confirmPassword = (formEl.elements.namedItem('confirmPassword') as HTMLInputElement)
						.value;
					
					const isGoogle = !!data.user.googleId;
					const minLength = isGoogle ? 6 : 8;

					if (newPassword !== confirmPassword) {
						alert(`New ${isGoogle ? 'PINs' : 'passwords'} do not match.`);
						isLoading = false;
						return;
					}
					if (newPassword.length < minLength) {
						alert(`${isGoogle ? 'PIN' : 'Password'} must be at least ${minLength} characters.`);
						isLoading = false;
						return;
					}

					try {
						// 1. If user has existing password/PIN, derive old auth hash
						let currentAuthHash = '';
						if (data.user.passwordHash) {
							const oldKeys = await deriveKeysFromPassword(currentPassword, data.user.email);
							currentAuthHash = oldKeys.authHash;
						}

						// 2. Derive new keys
						const newKeys = await deriveKeysFromPassword(newPassword, data.user.email);

						// 3. Get or generate DEK
						let dek = get(vaultKeyStore);
						if (!dek) {
							// Google users without a key generate one now
							dek = generateMasterVaultKey();
						}

						// 4. Wrap DEK with new KEK
						const newEncryptedVaultKey = await wrapMasterKey(dek, newKeys.kek);

						// 5. Send to server
						const res = await fetch('/api/profile/change-password', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								currentAuthHash,
								newAuthHash: newKeys.authHash,
								newEncryptedVaultKey
							})
						});

						if (!res.ok) {
							const errData = await res.json();
							throw new Error(errData.error || 'Failed to update.');
						}

						// 6. Alert success
						alert(`${isGoogle ? 'PIN' : 'Password'} updated successfully!`);
						
						formEl.reset();
					} catch (err: any) {
						console.error(err);
						alert(err.message || `Failed to update ${isGoogle ? 'PIN' : 'password'}.`);
					} finally {
						isLoading = false;
					}
				}}
			>
				<div class="space-y-4">
					{#if data.user.passwordHash}
						<div class="group relative">
							<label class="mb-1 block text-xs font-medium text-gray-400" for="currentPassword">
								{data.user.googleId ? 'Current PIN' : 'Current Password'}
							</label>
							<input
								name="currentPassword"
								id="currentPassword"
								class="w-full rounded-lg border border-[#2A3241] bg-[#0B0E14] px-4 py-2 text-sm text-white transition-colors focus:border-[#FF6B4A] focus:outline-none"
								type="password"
								inputmode={data.user.googleId ? 'numeric' : 'text'}
								required
							/>
						</div>
					{/if}
					<div class="group relative">
						<label class="mb-1 block text-xs font-medium text-gray-400" for="newPassword">
							{data.user.googleId ? 'New PIN' : 'New Password'}
						</label>
						<input
							name="newPassword"
							id="newPassword"
							class="w-full rounded-lg border border-[#2A3241] bg-[#0B0E14] px-4 py-2 text-sm text-white transition-colors focus:border-[#FF6B4A] focus:outline-none"
							type="password"
							inputmode={data.user.googleId ? 'numeric' : 'text'}
							required
							minlength={data.user.googleId ? 6 : 8}
						/>
					</div>
					<div class="group relative">
						<label class="mb-1 block text-xs font-medium text-gray-400" for="confirmPassword">
							{data.user.googleId ? 'Confirm New PIN' : 'Confirm New Password'}
						</label>
						<input
							name="confirmPassword"
							id="confirmPassword"
							class="w-full rounded-lg border border-[#2A3241] bg-[#0B0E14] px-4 py-2 text-sm text-white transition-colors focus:border-[#FF6B4A] focus:outline-none"
							type="password"
							inputmode={data.user.googleId ? 'numeric' : 'text'}
							required
							minlength={data.user.googleId ? 6 : 8}
						/>
					</div>
				</div>

				<button
					type="submit"
					disabled={isLoading}
					class="mt-6 rounded-lg bg-[#2A3241] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3b465a] disabled:opacity-50"
				>
					{isLoading ? 'Updating...' : (data.user.googleId ? 'Update PIN' : 'Update Password')}
				</button>
			</form>
		</section>

		<!-- Security & Encryption -->
		<section class="rounded-2xl border border-[#2A3241] bg-[#151921] p-6 shadow-lg md:col-span-2">
			<h2 class="mb-6 flex items-center gap-2 text-xl font-bold text-white">
				<Shield class="text-[#FF6B4A]" size={24} />
				Security & Encryption
			</h2>

			<div class="rounded-lg border border-[#2A3241] bg-[#0B0E14] p-4 text-sm text-gray-300">
				<div class="mb-4">
					<span class="font-bold text-white">Current Mode:</span>
					<span
						class="ml-2 inline-block rounded-full bg-[#FF6B4A]/20 px-2 py-1 text-xs font-bold tracking-wider text-[#FF6B4A] uppercase"
					>
						{data.user.encryptionMode}
					</span>
				</div>
				<p class="mb-2">
					{#if data.user.encryptionMode === 'locked_on'}
						Your storage is strictly encrypted before leaving your device. Files cannot be accessed
						without your credentials. This mode cannot be disabled.
					{:else if data.user.encryptionMode === 'locked_off'}
						Encryption is permanently disabled by your administrator. Files are stored as-is. This
						mode cannot be changed.
					{:else}
						You are in flexible mode. You can choose whether to encrypt files on upload. Turning
						this on will secure all your future uploads using AES-256-CTR before reaching Telegram.
					{/if}
				</p>

				{#if data.user.encryptionMode === 'flexible'}
					<div
						class="mt-4 flex items-center justify-between rounded-lg border border-[#2A3241] bg-[#151921] p-4"
					>
						<div>
							<h3 class="text-sm font-bold text-white">Toggle Encryption</h3>
							<p class="text-xs text-gray-400">
								Currently: {data.user.isEncryptionActive
									? 'Active (Encrypting)'
									: 'Inactive (Not Encrypting)'}
							</p>
						</div>
						<form
							method="POST"
							action="?/toggleFlexibleEncryption"
							use:enhance={() => {
								isLoading = true;
								return async ({ update }) => {
									await update();
									isLoading = false;
								};
							}}
						>
							<input
								type="hidden"
								name="action"
								value={data.user.isEncryptionActive ? 'off' : 'on'}
							/>
							<button
								type="submit"
								disabled={isLoading}
								class="rounded-lg px-4 py-2 text-sm font-bold transition-colors disabled:opacity-50 {data
									.user.isEncryptionActive
									? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
									: 'bg-green-500/10 text-green-500 hover:bg-green-500/20'}"
							>
								{isLoading ? 'Wait...' : data.user.isEncryptionActive ? 'Turn Off' : 'Turn On'}
							</button>
						</form>
					</div>
				{/if}

				<div class="mt-4 rounded-lg border border-[#2A3241] bg-[#151921] p-4">
					<h3 class="mb-2 text-sm font-bold text-white">Your Permanent Encryption Key</h3>
					<p class="mb-3 text-xs text-gray-400">
						This is your unique 256-bit AES cryptographic key. Please save it in a secure location
						(e.g., a password manager). If you ever lose access to this platform, you will need this
						key to decrypt your files manually.
					</p>
					<div class="flex items-center gap-2">
						<input
							type="text"
							readonly
							value={isKeyRevealed ? rawDek : '************************************************'}
							class="w-full rounded-md border border-[#2A3241] bg-[#0F1219] p-2 font-mono text-xs text-gray-300 focus:outline-none {isKeyRevealed
								? ''
								: 'tracking-widest'}"
						/>
						<button
							type="button"
							class="rounded-md bg-[#FF6B4A]/10 p-2 text-[#FF6B4A] transition-colors hover:bg-[#FF6B4A]/20"
							onclick={() => {
								if (isKeyRevealed) {
									isKeyRevealed = false;
									if (hideKeyTimeout) clearTimeout(hideKeyTimeout);
								} else {
									showRevealModal = true;
									revealStep = 1;
									revealError = '';
									revealPassword = '';
									revealOtp = '';
								}
							}}
							title={isKeyRevealed ? 'Hide Key' : 'Reveal Key'}
						>
							{#if isKeyRevealed}
								<EyeOff size={16} />
							{:else}
								<Eye size={16} />
							{/if}
						</button>
					</div>
					
					{#if isKeyRevealed && recoveryPhrase}
						<div class="mt-4 rounded-lg border border-[#FF6B4A]/30 bg-[#FF6B4A]/5 p-4">
							<div class="mb-4 flex items-center justify-between">
								<h4 class="text-sm font-bold text-white">Your 12-Word Recovery Phrase</h4>
								<button
									onclick={() => {
										const blob = new Blob([recoveryPhrase], { type: 'text/plain' });
										const url = URL.createObjectURL(blob);
										const a = document.createElement('a');
										a.href = url;
										a.download = 'ShrimpDrive_Recovery_Phrase.txt';
										a.click();
										URL.revokeObjectURL(url);
									}}
									class="flex items-center gap-2 rounded-lg bg-[#FF6B4A] px-3 py-1.5 text-xs font-bold text-black transition-colors hover:bg-[#ff8264]"
								>
									Download .txt
								</button>
							</div>
							<div class="grid grid-cols-3 gap-2 font-mono text-xs">
								{#each recoveryPhrase.split(' ') as word, i}
									<div class="flex items-center gap-2">
										<span class="text-gray-500">{i + 1}.</span>
										<span class="font-bold text-white">{word}</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>
		</section>
	</div>
</div>

<!-- Key Reveal Modal -->
{#if showRevealModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
		onclick={(e) => {
			if (e.target === e.currentTarget) showRevealModal = false;
		}}
	>
		<div
			class="relative w-full max-w-sm rounded-2xl border border-[#2A3241] bg-[#151921] p-6 shadow-2xl"
		>
			<button
				class="absolute top-4 right-4 text-gray-400 hover:text-white"
				onclick={() => (showRevealModal = false)}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"
					></line></svg
				>
			</button>

			<h2 class="mb-2 text-xl font-bold text-white">Security Verification</h2>
			<p class="mb-6 text-xs text-gray-400">
				{#if revealStep === 1}
					Enter your account password or pin to verify your identity.
				{:else}
					We've sent a 6-digit verification code to your email.
				{/if}
			</p>

			{#if revealError}
				<div class="mb-4 rounded-lg bg-[#93000a] px-3 py-2 text-xs font-medium text-[#ffdad6]">
					{revealError}
				</div>
			{/if}

			{#if revealStep === 1}
				<div class="mb-4">
					<label class="mb-1 block text-xs font-medium text-gray-400" for="revealPassword"
						>Account Password/Pin</label
					>
					<input
						bind:value={revealPassword}
						id="revealPassword"
						class="w-full rounded-lg border border-[#2A3241] bg-[#0B0E14] px-4 py-2 text-sm text-white transition-colors focus:border-[#FF6B4A] focus:outline-none"
						type="password"
						onkeydown={(e) => e.key === 'Enter' && handleRevealStep1()}
					/>
				</div>
				<button
					onclick={handleRevealStep1}
					disabled={isRevealing}
					class="w-full rounded-lg bg-[#FF6B4A] px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-[#ff8264] disabled:opacity-50"
				>
					{isRevealing ? 'Verifying...' : 'Next'}
				</button>
			{:else}
				<div class="mb-4">
					<label class="mb-1 block text-xs font-medium text-gray-400" for="revealOtp"
						>6-Digit Code</label
					>
					<input
						bind:value={revealOtp}
						id="revealOtp"
						class="w-full rounded-lg border border-[#2A3241] bg-[#0B0E14] px-4 py-2 text-center font-mono text-2xl tracking-[0.5em] text-white transition-colors focus:border-[#FF6B4A] focus:outline-none"
						type="text"
						maxlength="6"
						onkeydown={(e) => e.key === 'Enter' && handleRevealStep2()}
					/>
				</div>
				<button
					onclick={handleRevealStep2}
					disabled={isRevealing}
					class="w-full rounded-lg bg-[#FF6B4A] px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-[#ff8264] disabled:opacity-50"
				>
					{isRevealing ? 'Verifying...' : 'Reveal Key'}
				</button>
			{/if}
		</div>
	</div>
{/if}
