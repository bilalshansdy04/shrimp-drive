<script lang="ts">
	import {
		ArrowRight,
		ArrowLeft,
		KeyRound,
		CheckCircle2,
		Hash,
		Rocket,
		Gift,
		Globe,
		Server,
		Lock
	} from 'lucide-svelte';
		
	let { data } = $props<{ data: { hasPassword: boolean; hasEncryptedVaultKey: boolean; email: string; username: string } }>();

	// Flow:
	// 1: Choose Backend (Global vs Custom)
	// If Global: 1 -> 4 (Ready)
	// If Custom: 1 -> 2 (Bot) -> 3 (Channel) -> 4 (Ready)
	let currentStep = $state(1);
	let backendChoice = $state<'global' | 'custom'>('global');

	let inviteCode = $state('');
	let inviteType = $state(''); // optional
	let inviteCodeError = $state('');

	let botToken = $state('');
	let botVerified = $state(false);
	let chatId = $state('');
	let pingSuccess = $state(false);

	
	let isLoading = $state(false);
	let errorMsg = $state('');

	function prevStep() {
		if (currentStep === 4) {
			if (backendChoice === 'global') currentStep = 1;
			else currentStep = 3;
		} else {
			if (currentStep > 1) {
				currentStep--;
			}
		}
		errorMsg = '';
	}

	async function nextStep() {
		if (currentStep === 1) {
			if (backendChoice === 'global') {
				if (inviteCode) {
					if (inviteCode.length < 5) {
						inviteCodeError = 'Invalid invite code length.';
						return;
					}
					isLoading = true;
					try {
						const res = await fetch('/api/verify-code', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ code: inviteCode })
						});
						const rData = await res.json();
						if (rData.success) {
							inviteType = rData.type;
							currentStep = 4;
						} else {
							inviteCodeError = rData.error;
						}
					} catch (e) {
						inviteCodeError = 'Failed to verify code.';
					}
					isLoading = false;
				} else {
					currentStep = 4;
				}
			} else {
				currentStep = 2; // Bot Setup
			}
		} else if (currentStep === 2 && backendChoice === 'custom') {
			currentStep = 3; // Channel
		} else if (currentStep === 3 && backendChoice === 'custom') {
			currentStep = 4;
		}
	}

	async function verifyBot() {
		errorMsg = '';
		if (botToken.length < 10) {
			errorMsg = 'Token is too short.';
			return;
		}

		isLoading = true;
		try {
			const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
			const getMeData = await res.json();
			if (getMeData.ok) {
				botVerified = true;
			} else {
				errorMsg = 'Invalid Bot Token.';
			}
		} catch (e) {
			errorMsg = 'Failed to connect to Telegram API.';
		}
		isLoading = false;
	}

	async function testPing() {
		errorMsg = '';
		pingSuccess = false;
		if (!chatId || !botVerified) return;

		isLoading = true;
		try {
			const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					chat_id: chatId,
					text: '🦐 Ping! Shrimp Drive is successfully connected to this channel.'
				})
			});
			const rData = await res.json();
			if (rData.ok) {
				pingSuccess = true;
			} else {
				errorMsg = `Failed to send ping: ${rData.description}`;
			}
		} catch (e) {
			errorMsg = 'Failed to connect to Telegram API.';
		}
		isLoading = false;
	}

	async function submitOnboarding() {
		isLoading = true;
		errorMsg = '';
		try {
			const res = await fetch('/onboarding', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					backendChoice,
					code: backendChoice === 'global' ? inviteCode : undefined,
					botToken: backendChoice === 'custom' ? botToken : undefined,
					chatId: backendChoice === 'custom' ? chatId : undefined,
				})
			});
			const rData = await res.json();

			if (rData.success) {
				window.location.href = '/dashboard';
			} else {
				errorMsg = rData.error || 'Failed to finish onboarding.';
			}
		} catch (err) {
			errorMsg = 'An unexpected error occurred.';
			console.error(err);
		}
		isLoading = false;
	}
</script>

<div
	class="relative flex justify-center items-center bg-[#0B0E14] p-6 min-h-screen overflow-hidden text-white"
>
	<!-- Ambient Overlay -->
	<div
		class="z-0 absolute inset-0 opacity-10 pointer-events-none"
		style="background: url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%232A3241\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"
	></div>

	<div
		class="z-0 absolute inset-0 pointer-events-none"
		style="background: radial-gradient(circle at 50% -20%, rgba(255, 107, 74, 0.15), transparent 60%);"
	></div>

	<main class="z-10 w-full max-w-[600px]">
		<!-- Header -->
		<header class="flex flex-col items-center mb-8 text-center">
			<div class="flex items-center gap-2 mb-2">
				<img
					alt="Shrimp Drive Logo"
					class="w-10 h-10 object-contain"
					src="/logo.webp"
				/>
				<h1 class="font-bold text-white text-3xl">Shrimp Drive</h1>
			</div>
			<span
				class="inline-block bg-[#151921] px-4 py-1 border border-[#2A3241] rounded-full font-medium text-[#FF6B4A] text-xs uppercase tracking-wider"
				>Initial Setup</span
			>

			{#if errorMsg}
				<div
					class="bg-[#93000a] mt-4 px-4 py-2 rounded-lg font-medium text-[#ffdad6] text-sm animate-[fadeIn_0.3s_ease]"
				>
					{errorMsg}
				</div>
			{/if}
		</header>

		<!-- Main Card -->
		<div
			class="bg-[#151921] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.5)] p-6 md:p-8 border border-[#2A3241] rounded-2xl"
		>
			<!-- Step 1: Choose Backend & Options -->
			{#if currentStep === 1}
				<section class="animate-[fadeIn_0.3s_ease]">
					<h2 class="mb-2 font-bold text-white text-2xl">Select Storage Node</h2>
					<p class="mb-6 text-gray-400 text-sm">
						Choose how you want to configure your Shrimp Drive storage backend.
					</p>

					<div class="space-y-4">
						<button
							onclick={() => (backendChoice = 'global')}
							class="w-full border bg-[#0B0E14] text-left {backendChoice === 'global'
								? 'border-[#FF6B4A]'
								: 'border-[#2A3241]'} flex items-start gap-4 rounded-xl p-4 transition-colors hover:border-[#FF6B4A]"
						>
							<div class="bg-[#151921] p-2 rounded-lg text-[#FF6B4A]">
								<Globe size={24} />
							</div>
							<div>
								<h3 class="mb-1 font-bold text-white">Global Drive (Quick Start)</h3>
								<p class="text-gray-400 text-xs">
									Use the shared community node. Zero setup required, start uploading immediately.
									Recommended for most users.
								</p>
							</div>
						</button>

						<!-- Inline Invite Code for Global -->
						{#if backendChoice === 'global'}
							<div class="ml-12 animate-[fadeIn_0.3s_ease]">
								<label class="block mb-1 font-medium text-gray-400 text-xs" for="inviteCode"
									>Invitation Code (Optional)</label
								>
								<div class="group relative flex items-center">
									<Gift
										class="left-3 absolute text-[#2A3241] group-focus-within:text-[#FF6B4A] transition-colors"
										size={20}
									/>
									<input
										bind:value={inviteCode}
										id="inviteCode"
										class="bg-[#0B0E14] py-2 pr-3 pl-10 border border-[#2A3241] focus:border-[#FF6B4A] rounded-lg focus:outline-none w-full text-white text-sm transition-colors"
										placeholder="e.g. SHRIMP-123"
										type="text"
									/>
								</div>
								{#if inviteCodeError}
									<p class="mt-1 text-red-400 text-xs">{inviteCodeError}</p>
								{/if}
							</div>
						{/if}

						<button
							onclick={() => (backendChoice = 'custom')}
							class="w-full border bg-[#0B0E14] text-left {backendChoice === 'custom'
								? 'border-[#FF6B4A]'
								: 'border-[#2A3241]'} flex items-start gap-4 rounded-xl p-4 transition-colors hover:border-[#FF6B4A]"
						>
							<div class="bg-[#151921] p-2 rounded-lg text-[#FF6B4A]">
								<Server size={24} />
							</div>
							<div>
								<h3 class="mb-1 font-bold text-white">Custom Node (Self-Setup)</h3>
								<p class="text-gray-400 text-xs">
									Configure your own private Telegram Bot and Channel. Requires technical knowledge
									of Telegram's @BotFather.
								</p>
							</div>
						</button>


					</div>

					<div class="flex justify-end mt-8 pt-4 border-[#2A3241] border-t">
						<button
							class="flex items-center gap-2 bg-[#FF6B4A] hover:bg-[#FF8264] disabled:opacity-50 px-6 py-2 rounded-lg font-bold text-[#0B0E14] text-sm transition-colors"
							onclick={nextStep}
							disabled={isLoading}
						>
							{isLoading ? 'Verifying...' : 'Next'}
							<ArrowRight size={18} />
						</button>
					</div>
				</section>
			{/if}

			<!-- Step 2 (Custom): Bot Link -->
			{#if currentStep === 2 && backendChoice === 'custom'}
				<section class="animate-[fadeIn_0.3s_ease]">
					<h2 class="mb-2 font-bold text-white text-2xl">Connect Telegram Bot</h2>
					<p class="mb-6 text-gray-400 text-sm">
						Create a bot via @BotFather and paste the token here.
					</p>

					<div class="bg-[#0B0E14] mb-4 p-4 border border-[#2A3241] rounded-lg">
						<ol class="space-y-2 text-gray-400 text-sm list-decimal list-inside">
							<li>
								Message <a
									class="text-[#FF6B4A] hover:underline"
									href="https://t.me/BotFather"
									target="_blank">@BotFather</a
								> on Telegram.
							</li>
							<li>
								Send <code class="bg-[#151921] px-1 border border-[#2A3241] rounded text-xs"
									>/newbot</code
								> and follow prompts.
							</li>
							<li>Copy the HTTP API Token provided.</li>
						</ol>
					</div>

					<div class="relative mb-4">
						<label class="block mb-1 font-medium text-gray-400 text-xs" for="bot-token"
							>HTTP API Token</label
						>
						<div class="flex gap-2">
							<div class="group relative flex flex-grow items-center">
								<KeyRound
									class="absolute left-3 {botVerified
										? 'text-[#4edea3]'
										: 'text-[#2A3241]'} transition-colors group-focus-within:text-[#FF6B4A]"
									size={20}
								/>
								<input
									bind:value={botToken}
									class="w-full border bg-[#0B0E14] {botVerified
										? 'border-[#4edea3]'
										: 'border-[#2A3241]'} rounded-lg py-2 pr-3 pl-10 text-sm text-white transition-colors focus:border-[#FF6B4A] focus:outline-none"
									id="bot-token"
									placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
									type="text"
								/>
							</div>
							<button
								disabled={isLoading}
								class="flex items-center gap-2 bg-transparent hover:bg-[#1E2430] disabled:opacity-50 px-4 py-2 border border-[#2A3241] rounded-lg text-white text-sm whitespace-nowrap transition-colors"
								onclick={verifyBot}
							>
								{isLoading ? 'Verifying...' : 'Verify'}
							</button>
						</div>
					</div>

					{#if botVerified}
						<div
							class="flex items-center gap-2 font-medium text-[#4edea3] text-xs animate-[fadeIn_0.3s_ease]"
						>
							<CheckCircle2 size={18} />
							Bot successfully connected.
						</div>
					{/if}

					<div class="flex justify-between mt-8 pt-4 border-[#2A3241] border-t">
						<button
							class="flex items-center gap-2 bg-transparent hover:bg-[#1E2430] px-4 py-2 border border-[#2A3241] rounded-lg text-white text-sm transition-colors"
							onclick={prevStep}
						>
							<ArrowLeft size={18} /> Back
						</button>
						<button
							class="flex items-center gap-2 bg-[#FF6B4A] hover:bg-[#FF8264] disabled:opacity-50 px-6 py-2 rounded-lg font-bold text-[#0B0E14] text-sm transition-colors"
							onclick={nextStep}
							disabled={!botVerified}
						>
							Next <ArrowRight size={18} />
						</button>
					</div>
				</section>
			{/if}

			<!-- Step 3 (Custom): Channel Link -->
			{#if currentStep === 3 && backendChoice === 'custom'}
				<section class="animate-[fadeIn_0.3s_ease]">
					<h2 class="mb-2 font-bold text-white text-2xl">Storage Channel</h2>
					<p class="mb-6 text-gray-400 text-sm">
						Create a private channel to act as your limitless storage drive and add your bot as an
						admin.
					</p>

					<div class="bg-[#0B0E14] mb-4 p-4 border border-[#2A3241] rounded-lg">
						<ol class="space-y-2 text-gray-400 text-sm list-decimal list-inside">
							<li>Create a New Channel in Telegram.</li>
							<li>Set it to <strong>Private</strong>.</li>
							<li>Add the bot you just created as an <strong>Administrator</strong> using your phone.</li>
							<li>Send a message the content doesn't matter, for example, a <strong>"ping"</strong> to the channel.</li>
							<li>
								Forward a message from that channel to <a
									class="text-[#FF6B4A] hover:underline"
									href="https://t.me/JsonDumpBot"
									target="_blank">@JsonDumpBot</a
								> to get the ID.
							</li>
							<li>Look for a result like this and copy its ID.</li>
							<li>"forward_from_chat":<br>
      "id": -1004302xxxxxx,<br>
      "title": "xxxxxxxxxxxx",<br>
      "type": "channel"</li>
						</ol>
					</div>

					<div class="group relative mb-4">
						<label class="block mb-1 font-medium text-gray-400 text-xs" for="channel-id"
							>Channel ID</label
						>
						<div class="flex gap-2">
							<div class="relative flex flex-grow items-center">
								<Hash
									class="absolute left-3 {pingSuccess
										? 'text-[#4edea3]'
										: 'text-[#2A3241]'} transition-colors group-focus-within:text-[#FF6B4A]"
									size={20}
								/>
								<input
									bind:value={chatId}
									id="channel-id"
									class="w-full border bg-[#0B0E14] {pingSuccess
										? 'border-[#4edea3]'
										: 'border-[#2A3241]'} rounded-lg py-2 pr-3 pl-10 text-sm text-white transition-colors focus:border-[#FF6B4A] focus:outline-none"
									placeholder="-1001234567890"
									type="text"
								/>
							</div>
							<button
								disabled={isLoading}
								class="flex items-center gap-2 bg-transparent hover:bg-[#1E2430] disabled:opacity-50 px-4 py-2 border border-[#2A3241] rounded-lg text-white text-sm whitespace-nowrap transition-colors"
								onclick={testPing}
							>
								{isLoading ? 'Testing...' : 'Test Ping'}
							</button>
						</div>
					</div>

					{#if pingSuccess}
						<div
							class="flex items-center gap-2 font-medium text-[#4edea3] text-xs animate-[fadeIn_0.3s_ease]"
						>
							<CheckCircle2 size={18} />
							Ping sent! Check your channel.
						</div>
					{/if}

					<div class="flex justify-between mt-8 pt-4 border-[#2A3241] border-t">
						<button
							class="flex items-center gap-2 bg-transparent hover:bg-[#1E2430] px-4 py-2 border border-[#2A3241] rounded-lg text-white text-sm transition-colors"
							onclick={prevStep}
						>
							<ArrowLeft size={18} /> Back
						</button>
						<button
							class="flex items-center gap-2 bg-[#FF6B4A] hover:bg-[#FF8264] disabled:opacity-50 px-6 py-2 rounded-lg font-bold text-[#0B0E14] text-sm transition-colors"
							onclick={nextStep}
							disabled={!pingSuccess}
						>
							Next <ArrowRight size={18} />
						</button>
					</div>
				</section>
			{/if}

			<!-- Step 4: Ready -->
			{#if currentStep === 4}
				<section class="text-center animate-[fadeIn_0.3s_ease]">
					<div
						class="flex justify-center items-center bg-[#FF6B4A]/10 shadow-[0_0_30px_rgba(255,107,74,0.2)] mx-auto mt-4 mb-6 border border-[#FF6B4A]/30 rounded-full w-20 h-20"
					>
						<Rocket class="text-[#FF6B4A]" size={40} />
					</div>

					<h2 class="mb-1 font-bold text-white text-2xl">Engine Active</h2>
					<p class="mb-8 text-gray-400 text-sm">
						Your personal cloud is configured and ready to accept data.
					</p>

					<div
						class="flex flex-col items-center gap-2 bg-[#0B0E14] mb-8 p-4 border border-[#2A3241] rounded-lg"
					>
						<div class="flex items-center gap-2 font-medium text-[#4edea3] text-xs">
							<span class="relative flex w-3 h-3">
								<span
									class="inline-flex absolute bg-[#4edea3] opacity-75 rounded-full w-full h-full animate-ping"
								></span>
								<span class="inline-flex relative bg-[#4edea3] rounded-full w-3 h-3"></span>
							</span>
							Connection Established ({backendChoice === 'global' ? 'Global Node' : 'Custom Node'})
						</div>
						<div class="font-medium text-white text-sm">
							Capacity: {backendChoice === 'global' ? 'Shared Pool' : 'Unlimited (TG Backend)'}
						</div>
					</div>

					<div class="flex justify-between mt-8 pt-4 border-[#2A3241] border-t">
						<button
							class="flex items-center gap-2 bg-transparent hover:bg-[#1E2430] px-4 py-2 border border-[#2A3241] rounded-lg text-white text-sm transition-colors"
							onclick={prevStep}
						>
							<ArrowLeft size={18} /> Back
						</button>
						<button
							disabled={isLoading}
							onclick={submitOnboarding}
							class="flex justify-center items-center gap-2 bg-[#FF6B4A] hover:bg-[#FF8264] disabled:opacity-50 px-6 py-2 rounded-lg font-bold text-[#0B0E14] text-sm transition-colors"
						>
							{isLoading ? 'Configuring System...' : 'Launch Drive'}
							<Rocket size={18} />
						</button>
					</div>
				</section>
			{/if}
		</div>
	</main>
</div>

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
