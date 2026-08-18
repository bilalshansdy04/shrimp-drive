<script lang="ts">
	import { enhance } from '$app/forms';
	import { Mail, KeyRound, RefreshCw, CheckCircle2 } from 'lucide-svelte';
	import { page } from '$app/stores';

	let { form } = $props<{ form: any }>();
	
	let isLoading = $state(false);
	let isResending = $state(false);
	let email = $derived($page.url.searchParams.get('email') || '');
</script>

<div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B0E14] p-6 text-white">
	<div class="pointer-events-none absolute inset-0 z-0 opacity-10" style="background: url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%232A3241\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"></div>
	<div class="pointer-events-none absolute inset-0 z-0" style="background: radial-gradient(circle at 50% -20%, rgba(255, 107, 74, 0.15), transparent 60%);"></div>

	<main class="z-10 w-full max-w-[400px]">
		<header class="mb-8 flex flex-col items-center text-center">
			<div class="mb-2 flex items-center gap-2">
				<img alt="Shrimp Drive Logo" class="h-10 w-10 object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGvKZiSWhKMKF4oL_J9_HFMU0WChW-H3PdTFKDH5fcwzeRD8cucxiu_m8SCwkkem_gncQ3pHQMY9XKT1E_Qo_Load05oN_wTLuSRdXuYGaOIOAuwO-Jy6LtN_Xg9SR377LbmXzEHCaItWXyb5TYNgLWxalFLC77QpW1a9iCyl4JMZYRXakuFTpelbzhSNjKiFehO624W8ZuGIfUwWxUCn8r76HAs-112uICmmFtYLuBBMM0ZqDiZD2" />
				<h1 class="text-3xl font-bold text-white">Verify Email</h1>
			</div>
			<p class="text-sm text-gray-400">Enter the 6-digit OTP code sent to your email.</p>
		</header>

		<div class="rounded-2xl border border-[#2A3241] bg-[#151921] p-6 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.5)]">
			{#if form?.error}
				<div class="mb-4 rounded-lg bg-[#93000a] px-4 py-2 text-sm font-medium text-[#ffdad6]">
					{form.error}
				</div>
			{/if}
			{#if form?.resendSuccess}
				<div class="mb-4 flex items-center gap-2 rounded-lg bg-[#00390f] px-4 py-2 text-sm font-medium text-[#73f382]">
					<CheckCircle2 size={18} />
					{form.resendSuccess}
				</div>
			{/if}
			{#if form?.success}
				<div class="mb-4 flex flex-col items-center gap-2 rounded-lg bg-[#00390f] px-4 py-6 text-center text-sm font-medium text-[#73f382]">
					<CheckCircle2 size={32} class="mb-2" />
					<p class="text-lg">Account Verified!</p>
					<p class="text-xs text-[#73f382]/80">You can now proceed to login.</p>
					<a href="/login" class="mt-4 rounded-lg bg-[#73f382] px-6 py-2 font-bold text-[#00390f] transition-colors hover:bg-[#86fb94]">
						Go to Login
					</a>
				</div>
			{:else}
				<form method="POST" action="?/verify" use:enhance={() => { isLoading = true; return async ({ update }) => { await update(); isLoading = false; }; }}>
					<input type="hidden" name="email" value={email} />
					
					<div class="mb-6 space-y-4">
						<div class="group relative">
							<label class="mb-1 block text-xs font-medium text-gray-400" for="otp">6-Digit OTP Code</label>
							<div class="relative flex items-center">
								<KeyRound class="absolute left-3 text-[#2A3241] transition-colors group-focus-within:text-[#FF6B4A]" size={20} />
								<input name="otp" id="otp" class="w-full rounded-lg border border-[#2A3241] bg-[#0B0E14] py-3 pr-3 pl-10 text-center text-xl font-bold tracking-[0.2em] text-white transition-colors focus:border-[#FF6B4A] focus:outline-none" placeholder="000000" type="text" required />
							</div>
						</div>
					</div>

					<button type="submit" disabled={isLoading || isResending} class="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF6B4A] px-6 py-3 text-sm font-bold text-[#0B0E14] transition-colors hover:bg-[#FF8264] disabled:opacity-50">
						{isLoading ? 'Verifying...' : 'Verify Account'}
					</button>
				</form>

				<div class="relative mt-6 flex items-center justify-center">
					<div class="absolute inset-0 flex items-center">
						<div class="w-full border-t border-[#2A3241]"></div>
					</div>
					<div class="relative bg-[#151921] px-4 text-xs font-medium text-gray-400">Didn't receive the email?</div>
				</div>

				<div class="mt-6">
					<form method="POST" action="?/resend" use:enhance={() => { isResending = true; return async ({ update }) => { await update({ reset: false }); isResending = false; }; }}>
						<input type="hidden" name="email" value={email} />
						<button type="submit" disabled={isResending || isLoading} class="flex w-full items-center justify-center gap-2 rounded-lg border border-[#2A3241] bg-[#0B0E14] px-6 py-3 text-sm font-medium text-white transition-colors hover:border-[#FF6B4A] hover:text-[#FF6B4A] disabled:opacity-50">
							<RefreshCw size={18} class={isResending ? 'animate-spin' : ''} />
							{isResending ? 'Sending...' : 'Resend OTP Code'}
						</button>
					</form>
				</div>
			{/if}
		</div>
	</main>
</div>
