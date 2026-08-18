<script lang="ts">
	import { Mail } from 'lucide-svelte';
	import { enhance } from '$app/forms';

	let { form } = $props<{ form: any }>();
	let isLoading = $state(false);
</script>

<div class="flex min-h-screen items-center justify-center bg-[#0B0E14] p-6 text-white">
	<div class="w-full max-w-[400px] rounded-2xl border border-[#2A3241] bg-[#151921] p-6 shadow-lg">
		<h1 class="mb-2 text-2xl font-bold">Forgot Password</h1>
		<p class="mb-6 text-sm text-gray-400">Enter your email address and we'll send you a link to reset your password.</p>

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
			<form method="POST" use:enhance={() => { isLoading = true; return async ({ update }) => { await update(); isLoading = false; }; }}>
				<div class="mb-6 space-y-4">
					<div class="group relative">
						<label class="mb-1 block text-xs font-medium text-gray-400" for="email">Email</label>
						<div class="relative flex items-center">
							<Mail class="absolute left-3 text-[#2A3241] transition-colors group-focus-within:text-[#FF6B4A]" size={20} />
							<input name="email" id="email" class="w-full rounded-lg border border-[#2A3241] bg-[#0B0E14] py-2 pr-3 pl-10 text-sm text-white transition-colors focus:border-[#FF6B4A] focus:outline-none" placeholder="you@example.com" type="email" required />
						</div>
					</div>
				</div>

				<button type="submit" disabled={isLoading} class="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF6B4A] px-6 py-3 text-sm font-bold text-[#0B0E14] transition-colors hover:bg-[#FF8264] disabled:opacity-50">
					{isLoading ? 'Sending...' : 'Send Reset Link'}
				</button>
			</form>
		{/if}

		<div class="mt-6 text-center text-sm text-gray-400">
			Remember your password?
			<a href="/login" class="font-medium text-[#FF6B4A] transition-colors hover:text-[#FF8264] hover:underline">Sign In</a>
		</div>
	</div>
</div>
