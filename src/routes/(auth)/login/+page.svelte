<script lang="ts">
	import { AtSign, Key, LogIn } from 'lucide-svelte';
	import { enhance } from '$app/forms';

	let { form } = $props<{ form: any }>();
	let isLoading = $state(false);
</script>

<div
	class="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B0E14] p-6 text-white"
>
	<!-- Ambient Overlay -->
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
			<p class="text-sm text-gray-400">Sign in to your private storage.</p>
		</header>

		<div
			class="rounded-2xl border border-[#2A3241] bg-[#151921] p-6 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.5)]"
		>
			{#if form?.error}
				<div class="mb-4 rounded-lg bg-[#93000a] px-4 py-2 text-sm font-medium text-[#ffdad6]">
					{form.error}
				</div>
			{/if}

			<form
				method="POST"
				use:enhance={() => {
					isLoading = true;
					return async ({ update }) => {
						await update();
						isLoading = false;
					};
				}}
			>
				<div class="mb-8 space-y-4">
					<div class="group relative">
						<label class="mb-1 block text-xs font-medium text-gray-400" for="username"
							>Username</label
						>
						<div class="relative flex items-center">
							<AtSign
								class="absolute left-3 text-[#2A3241] transition-colors group-focus-within:text-[#FF6B4A]"
								size={20}
							/>
							<input
								name="username"
								id="username"
								class="w-full rounded-lg border border-[#2A3241] bg-[#0B0E14] py-2 pr-3 pl-10 text-sm text-white transition-colors focus:border-[#FF6B4A] focus:outline-none"
								placeholder="admin_user"
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
							<input
								name="password"
								id="password"
								class="w-full rounded-lg border border-[#2A3241] bg-[#0B0E14] py-2 pr-3 pl-10 text-sm text-white transition-colors focus:border-[#FF6B4A] focus:outline-none"
								placeholder="••••••••"
								type="password"
								required
							/>
						</div>
					</div>
				</div>

				<button
					type="submit"
					disabled={isLoading}
					class="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF6B4A] px-6 py-3 text-sm font-bold text-[#0B0E14] transition-colors hover:bg-[#FF8264] disabled:opacity-50"
				>
					{isLoading ? 'Signing In...' : 'Sign In'}
					<LogIn size={18} />
				</button>
			</form>

			<div class="mt-6 text-center text-sm text-gray-400">
				Belum punya akun?
				<a
					href="/onboarding"
					class="font-medium text-[#FF6B4A] transition-colors hover:text-[#FF8264] hover:underline"
					>Buat akun di sini</a
				>
			</div>
		</div>
	</main>
</div>
