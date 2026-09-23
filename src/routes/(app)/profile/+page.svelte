<script lang="ts">
	import { enhance } from '$app/forms';
	import { User, Key, Shield, Eye, EyeOff } from 'lucide-svelte';


	let { data, form } = $props<{ data: any; form: any }>();
	let isLoading = $state(false);


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
		{#if !data.user.googleId}
		<section class="rounded-2xl border border-[#2A3241] bg-[#151921] p-6 shadow-lg">
			<h2 class="mb-6 flex items-center gap-2 text-xl font-bold text-white">
				<Key class="text-[#FF6B4A]" size={24} />
				Change Password
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
					
					const minLength = 8;

					if (newPassword !== confirmPassword) {
						alert(`New passwords do not match.`);
						isLoading = false;
						return;
					}
					if (newPassword.length < minLength) {
						alert(`Password must be at least ${minLength} characters.`);
						isLoading = false;
						return;
					}

					try {
						// 5. Send to server
						const res = await fetch('/api/profile/change-password', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								currentPassword,
								newPassword
							})
						});

						if (!res.ok) {
							const errData = await res.json();
							throw new Error(errData.error || 'Failed to update.');
						}

						// 6. Alert success
						alert(`Password updated successfully!`);
						
						formEl.reset();
						window.location.reload();
					} catch (err: any) {
						console.error(err);
						alert(err.message || `Failed to update password.`);
					} finally {
						isLoading = false;
					}
				}}
			>
				<div class="space-y-4">
					{#if data.user.passwordHash}
						<div class="group relative">
							<label class="mb-1 block text-xs font-medium text-gray-400" for="currentPassword">
								Current Password
							</label>
							<input
								name="currentPassword"
								id="currentPassword"
								class="w-full rounded-lg border border-[#2A3241] bg-[#0B0E14] px-4 py-2 text-sm text-white transition-colors focus:border-[#FF6B4A] focus:outline-none"
								type="password"
								inputmode="text"
								required
							/>
						</div>
					{/if}
					<div class="group relative">
						<label class="mb-1 block text-xs font-medium text-gray-400" for="newPassword">
							New Password
						</label>
						<input
							name="newPassword"
							id="newPassword"
							class="w-full rounded-lg border border-[#2A3241] bg-[#0B0E14] px-4 py-2 text-sm text-white transition-colors focus:border-[#FF6B4A] focus:outline-none"
							type="password"
							inputmode="text"
							required
							minlength={8}
						/>
					</div>
					<div class="group relative">
						<label class="mb-1 block text-xs font-medium text-gray-400" for="confirmPassword">
							Confirm New Password
						</label>
						<input
							name="confirmPassword"
							id="confirmPassword"
							class="w-full rounded-lg border border-[#2A3241] bg-[#0B0E14] px-4 py-2 text-sm text-white transition-colors focus:border-[#FF6B4A] focus:outline-none"
							type="password"
							inputmode="text"
							required
							minlength={8}
						/>
					</div>
				</div>

				<button
					type="submit"
					disabled={isLoading}
					class="mt-6 rounded-lg bg-[#2A3241] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3b465a] disabled:opacity-50"
				>
					{isLoading ? 'Updating...' : 'Update Password'}
				</button>
			</form>
		</section>
		{/if}

		<!-- Security & Encryption -->
		<section class="rounded-2xl border border-[#2A3241] bg-[#151921] p-6 shadow-lg md:col-span-2">
			<h2 class="mb-6 flex items-center gap-2 text-xl font-bold text-white">
				<Shield class="text-[#FF6B4A]" size={24} />
				Security & Encryption
			</h2>

			<div class="rounded-lg border border-[#2A3241] bg-[#0B0E14] p-4 text-sm text-gray-300">
				<div class="mb-4 flex items-center gap-2">
					<span class="font-bold text-white">Protect File (Obfuscation)</span>
					<div class="group relative cursor-help">
						<span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#FF6B4A] text-xs font-bold text-black">!</span>
						<div class="absolute bottom-full left-1/2 mb-2 hidden w-64 -translate-x-1/2 rounded-lg border border-[#2A3241] bg-[#151921] p-3 text-xs text-gray-300 shadow-xl group-hover:block">
							Sistem melindungi file Anda dengan memecahnya menjadi potongan-potongan tanpa nama. Jika pihak luar mengakses storage, mereka tidak akan bisa mengenali atau menyatukan file Anda.
							<div class="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-[#2A3241] bg-[#151921]"></div>
						</div>
					</div>
				</div>
				<p class="mb-2">
					Semua file Anda otomatis dilindungi dan dipecah saat diupload, menghilangkan buffering saat streaming tanpa membebani perangkat Anda.
				</p>
			</div>
		</section>
	</div>
</div>

