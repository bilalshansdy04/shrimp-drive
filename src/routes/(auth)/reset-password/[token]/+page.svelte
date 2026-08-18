<script lang="ts">
	import { Key } from 'lucide-svelte';
	import { enhance } from '$app/forms';

	let { form, data } = $props<{ form: any; data: any }>();
	let isLoading = $state(false);
</script>

<div class="flex min-h-screen items-center justify-center bg-[#0B0E14] p-6 text-white">
	<div class="w-full max-w-[400px] rounded-2xl border border-[#2A3241] bg-[#151921] p-6 shadow-lg">
		<h1 class="mb-2 text-2xl font-bold">Reset Password</h1>
		<p class="mb-6 text-sm text-gray-400">Enter your new password below.</p>

		{#if data.error}
			<div class="mb-6 rounded-lg bg-[#93000a] p-4 text-[#ffdad6]">
				{data.error}
			</div>
			<a href="/forgot-password" class="inline-block w-full text-center rounded-lg border border-[#2A3241] px-6 py-2 text-sm font-medium hover:bg-[#2A3241]">
				Request New Link
			</a>
		{:else if form?.success}
			<div class="mb-6 rounded-lg bg-[#00390f] p-4 text-[#73f382]">
				{form.success}
			</div>
			<a href="/login" class="inline-block w-full text-center rounded-lg bg-[#FF6B4A] px-6 py-3 text-sm font-bold text-[#0B0E14] hover:bg-[#FF8264]">
				Continue to Login
			</a>
		{:else}
			{#if form?.error}
				<div class="mb-4 rounded-lg bg-[#93000a] px-4 py-2 text-sm font-medium text-[#ffdad6]">
					{form.error}
				</div>
			{/if}

			<form method="POST" use:enhance={() => { isLoading = true; return async ({ update }) => { await update(); isLoading = false; }; }}>
				<div class="mb-6 space-y-4">
					<div class="group relative">
						<label class="mb-1 block text-xs font-medium text-gray-400" for="password">New Password</label>
						<div class="relative flex items-center">
							<Key class="absolute left-3 text-[#2A3241] transition-colors group-focus-within:text-[#FF6B4A]" size={20} />
							<input name="password" id="password" class="w-full rounded-lg border border-[#2A3241] bg-[#0B0E14] py-2 pr-3 pl-10 text-sm text-white transition-colors focus:border-[#FF6B4A] focus:outline-none" placeholder="••••••••" type="password" required minlength="8" />
						</div>
					</div>
					<div class="group relative">
						<label class="mb-1 block text-xs font-medium text-gray-400" for="confirmPassword">Confirm Password</label>
						<div class="relative flex items-center">
							<Key class="absolute left-3 text-[#2A3241] transition-colors group-focus-within:text-[#FF6B4A]" size={20} />
							<input name="confirmPassword" id="confirmPassword" class="w-full rounded-lg border border-[#2A3241] bg-[#0B0E14] py-2 pr-3 pl-10 text-sm text-white transition-colors focus:border-[#FF6B4A] focus:outline-none" placeholder="••••••••" type="password" required minlength="8" />
						</div>
					</div>
				</div>

				<button type="submit" disabled={isLoading} class="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF6B4A] px-6 py-3 text-sm font-bold text-[#0B0E14] transition-colors hover:bg-[#FF8264] disabled:opacity-50">
					{isLoading ? 'Resetting...' : 'Reset Password'}
				</button>
			</form>
		{/if}
	</div>
</div>
