<script lang="ts">
	import { enhance } from '$app/forms';
	import { User, Key, Shield } from 'lucide-svelte';

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
						<label class="mb-1 block text-xs font-medium text-gray-400" for="displayName">Display Name</label>
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

		<!-- Password -->
		<section class="rounded-2xl border border-[#2A3241] bg-[#151921] p-6 shadow-lg">
			<h2 class="mb-6 flex items-center gap-2 text-xl font-bold text-white">
				<Key class="text-[#FF6B4A]" size={24} />
				Change Password
			</h2>
			<form
				method="POST"
				action="?/updatePassword"
				use:enhance={() => {
					isLoading = true;
					return async ({ update }) => {
						await update();
						isLoading = false;
					};
				}}
			>
				<div class="mb-4 space-y-4">
					{#if data.user.passwordHash}
					<div class="group relative">
						<label class="mb-1 block text-xs font-medium text-gray-400" for="currentPassword">Current Password</label>
						<input
							name="currentPassword"
							id="currentPassword"
							class="w-full rounded-lg border border-[#2A3241] bg-[#0B0E14] px-4 py-2 text-sm text-white transition-colors focus:border-[#FF6B4A] focus:outline-none"
							type="password"
							required
						/>
					</div>
					{/if}
					<div class="group relative">
						<label class="mb-1 block text-xs font-medium text-gray-400" for="newPassword">New Password</label>
						<input
							name="newPassword"
							id="newPassword"
							class="w-full rounded-lg border border-[#2A3241] bg-[#0B0E14] px-4 py-2 text-sm text-white transition-colors focus:border-[#FF6B4A] focus:outline-none"
							type="password"
							required
							minlength="8"
						/>
					</div>
					<div class="group relative">
						<label class="mb-1 block text-xs font-medium text-gray-400" for="confirmPassword">Confirm New Password</label>
						<input
							name="confirmPassword"
							id="confirmPassword"
							class="w-full rounded-lg border border-[#2A3241] bg-[#0B0E14] px-4 py-2 text-sm text-white transition-colors focus:border-[#FF6B4A] focus:outline-none"
							type="password"
							required
							minlength="8"
						/>
					</div>
				</div>
				<button
					type="submit"
					disabled={isLoading}
					class="mt-4 rounded-lg bg-[#2A3241] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#343D4F] disabled:opacity-50"
				>
					{isLoading ? 'Updating...' : (data.user.passwordHash ? 'Update Password' : 'Set Password')}
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
					<span class="ml-2 inline-block rounded-full bg-[#FF6B4A]/20 px-2 py-1 text-xs font-bold text-[#FF6B4A] uppercase tracking-wider">
						{data.user.encryptionMode}
					</span>
				</div>
				<p class="mb-2">
					{#if data.user.encryptionMode === 'locked_on'}
						Your storage is strictly encrypted before leaving your device. Files cannot be accessed without your credentials. This mode cannot be disabled.
					{:else if data.user.encryptionMode === 'locked_off'}
						Encryption is permanently disabled by your administrator. Files are stored as-is. This mode cannot be changed.
					{:else}
						You are in flexible mode. You can choose whether to encrypt files on upload in your storage dashboard.
					{/if}
				</p>
			</div>
		</section>
	</div>
</div>
