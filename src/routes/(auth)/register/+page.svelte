<script lang="ts">
	import { AtSign, Key, UserPlus, Mail, Check, X } from 'lucide-svelte';
	import { enhance } from '$app/forms';

	let { form } = $props<{ form: any }>();
	let isLoading = $state(false);

	let username = $state('');
	let isUsernameAvailable = $state<boolean | null>(null);
	let isCheckingUsername = $state(false);

	async function checkUsernameManual() {
		if (username.trim() === '') {
			isUsernameAvailable = null;
			return;
		}
		isCheckingUsername = true;
		try {
			console.log('Sending check request for username:', username);
			const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
			const data = await res.json();
			console.log('Received response:', data);
			isUsernameAvailable = data.available;
		} catch (e: any) {
			console.error('Error during fetch:', e);
			alert('Error: ' + (e.message || 'Unknown error'));
		} finally {
			isCheckingUsername = false;
		}
	}
</script>

<div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B0E14] p-6 text-white">
	<div class="pointer-events-none absolute inset-0 z-0 opacity-10" style="background: url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%232A3241\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"></div>
	<div class="pointer-events-none absolute inset-0 z-0" style="background: radial-gradient(circle at 50% -20%, rgba(255, 107, 74, 0.15), transparent 60%);"></div>

	<main class="z-10 w-full max-w-[400px]">
		<header class="mb-8 flex flex-col items-center text-center">
			<div class="mb-2 flex items-center gap-2">
				<img alt="Shrimp Drive Logo" class="h-10 w-10 object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGvKZiSWhKMKF4oL_J9_HFMU0WChW-H3PdTFKDH5fcwzeRD8cucxiu_m8SCwkkem_gncQ3pHQMY9XKT1E_Qo_Load05oN_wTLuSRdXuYGaOIOAuwO-Jy6LtN_Xg9SR377LbmXzEHCaItWXyb5TYNgLWxalFLC77QpW1a9iCyl4JMZYRXakuFTpelbzhSNjKiFehO624W8ZuGIfUwWxUCn8r76HAs-112uICmmFtYLuBBMM0ZqDiZD2" />
				<h1 class="text-3xl font-bold text-white">Shrimp Drive</h1>
			</div>
			<p class="text-sm text-gray-400">Create your private storage account.</p>
		</header>

		<div class="rounded-2xl border border-[#2A3241] bg-[#151921] p-6 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.5)]">
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
			<form method="POST" use:enhance={({ cancel }) => { 
					if (isUsernameAvailable !== true) {
						alert('Silakan tekan tombol Check untuk memverifikasi ketersediaan Username Anda.');
						cancel();
						return;
					}
					isLoading = true; 
					return async ({ update }) => { await update(); isLoading = false; }; 
				}}>
				<div class="mb-6 space-y-4">
					<div class="group relative">
						<label class="mb-1 block text-xs font-medium text-gray-400" for="username">Username</label>
						<div class="relative flex items-center gap-2">
							<div class="relative flex-1 items-center flex">
								<AtSign class="absolute left-3 text-[#2A3241] transition-colors group-focus-within:text-[#FF6B4A]" size={20} />
								<input bind:value={username} oninput={() => isUsernameAvailable = null} name="username" id="username" class="w-full rounded-lg border border-[#2A3241] bg-[#0B0E14] py-2 pr-3 pl-10 text-sm text-white transition-colors focus:border-[#FF6B4A] focus:outline-none" placeholder="admin_user" type="text" required />
							</div>
							<button type="button" onclick={checkUsernameManual} disabled={isCheckingUsername || !username} class="flex h-[38px] items-center justify-center rounded-lg bg-[#2A3241] px-4 text-xs font-medium text-white transition-colors hover:bg-[#323b4d] disabled:opacity-50 shrink-0">
								{#if isCheckingUsername}
									<span class="animate-pulse">...</span>
								{:else}
									Check
								{/if}
							</button>
						</div>
						{#if isUsernameAvailable === true}
							<p class="mt-2 flex items-center gap-1 text-xs text-green-400"><Check size={14} /> Username tersedia</p>
						{:else if isUsernameAvailable === false}
							<p class="mt-2 flex items-center gap-1 text-xs text-red-400"><X size={14} /> Username sudah dipakai</p>
						{/if}
					</div>
					<div class="group relative">
						<label class="mb-1 block text-xs font-medium text-gray-400" for="email">Email</label>
						<div class="relative flex items-center">
							<Mail class="absolute left-3 text-[#2A3241] transition-colors group-focus-within:text-[#FF6B4A]" size={20} />
							<input name="email" id="email" class="w-full rounded-lg border border-[#2A3241] bg-[#0B0E14] py-2 pr-3 pl-10 text-sm text-white transition-colors focus:border-[#FF6B4A] focus:outline-none" placeholder="you@example.com" type="email" required />
						</div>
					</div>
					<div class="group relative">
						<label class="mb-1 block text-xs font-medium text-gray-400" for="displayName">Display Name</label>
						<div class="relative flex items-center">
							<UserPlus class="absolute left-3 text-[#2A3241] transition-colors group-focus-within:text-[#FF6B4A]" size={20} />
							<input name="displayName" id="displayName" class="w-full rounded-lg border border-[#2A3241] bg-[#0B0E14] py-2 pr-3 pl-10 text-sm text-white transition-colors focus:border-[#FF6B4A] focus:outline-none" placeholder="John Doe" type="text" required />
						</div>
					</div>
					<div class="group relative">
						<label class="mb-1 block text-xs font-medium text-gray-400" for="password">Password</label>
						<div class="relative flex items-center">
							<Key class="absolute left-3 text-[#2A3241] transition-colors group-focus-within:text-[#FF6B4A]" size={20} />
							<input name="password" id="password" class="w-full rounded-lg border border-[#2A3241] bg-[#0B0E14] py-2 pr-3 pl-10 text-sm text-white transition-colors focus:border-[#FF6B4A] focus:outline-none" placeholder="••••••••" type="password" required minlength="8" />
						</div>
					</div>
				</div>

				<button type="submit" disabled={isLoading} class="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF6B4A] px-6 py-3 text-sm font-bold text-[#0B0E14] transition-colors hover:bg-[#FF8264] disabled:opacity-50">
					{isLoading ? 'Creating Account...' : 'Create Account'}
				</button>
			</form>

			<div class="relative mt-6 flex items-center justify-center">
				<div class="absolute inset-0 flex items-center">
					<div class="w-full border-t border-[#2A3241]"></div>
				</div>
				<div class="relative bg-[#151921] px-4 text-xs font-medium text-gray-400">OR</div>
			</div>

			<div class="mt-6">
				<a href="/login/google" class="flex w-full items-center justify-center gap-3 rounded-lg border border-[#2A3241] bg-[#0B0E14] px-6 py-3 text-sm font-medium text-white transition-colors hover:border-[#FF6B4A] hover:text-[#FF6B4A]">
					<svg class="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
						<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
						<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
						<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
						<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
					</svg>
					Continue with Google
				</a>
			</div>
			{/if}

			<div class="mt-6 text-center text-sm text-gray-400">
				Sudah punya akun?
				<a href="/login" class="font-medium text-[#FF6B4A] transition-colors hover:text-[#FF8264] hover:underline">Sign In di sini</a>
			</div>
		</div>
	</main>
</div>
