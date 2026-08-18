<script lang="ts">
  import {
    ArrowRight,
    ArrowLeft,
    KeyRound,
    CheckCircle2,
    Hash,
    Rocket,
    Gift
  } from "lucide-svelte";

  let currentStep = $state(1);
  let inviteCode = $state("");
  let inviteType = $state("");
  let botToken = $state("");
  let botVerified = $state(false);
  let chatId = $state("");
  let pingSuccess = $state(false);
  
  let isLoading = $state(false);
  let errorMsg = $state("");

  async function verifyInviteCode() {
    errorMsg = "";
    
    // Allow empty code (Skip)
    if (!inviteCode) {
      inviteType = 'regular_self_setup';
      currentStep = 2; // Go to bot setup
      return;
    }

    if (inviteCode.length < 5) {
      errorMsg = "Invalid invite code length.";
      return;
    }
    
    isLoading = true;
    try {
      const res = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode })
      });
      const data = await res.json();
      if (data.success) {
        inviteType = data.type;
        if (inviteType === 'friend_zero_setup') {
          currentStep = 4; // Jump to ready
        } else {
          currentStep = 2; // Go to bot setup
        }
      } else {
        errorMsg = data.error;
      }
    } catch (e) {
      errorMsg = "Failed to verify code.";
    }
    isLoading = false;
  }

  function prevStep() {
    if (currentStep > 1) {
      if (inviteType === 'friend_zero_setup' && currentStep === 4) {
        currentStep = 1;
      } else {
        currentStep--;
      }
      errorMsg = "";
    }
  }

  function nextStep() {
    if (currentStep < 4) currentStep++;
  }

  async function verifyBot() {
    errorMsg = "";
    if (botToken.length < 10) {
      errorMsg = "Token is too short.";
      return;
    }
    
    isLoading = true;
    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const data = await res.json();
      if (data.ok) {
        botVerified = true;
      } else {
        errorMsg = "Invalid Bot Token.";
      }
    } catch (e) {
      errorMsg = "Failed to connect to Telegram API.";
    }
    isLoading = false;
  }

  async function testPing() {
    errorMsg = "";
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
      const data = await res.json();
      if (data.ok) {
        pingSuccess = true;
      } else {
        errorMsg = `Failed to send ping: ${data.description}`;
      }
    } catch (e) {
      errorMsg = "Failed to connect to Telegram API.";
    }
    isLoading = false;
  }

  async function submitOnboarding() {
    isLoading = true;
    errorMsg = "";
    try {
      const res = await fetch('/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: inviteCode,
          botToken: inviteType === 'regular_self_setup' ? botToken : undefined,
          chatId: inviteType === 'regular_self_setup' ? chatId : undefined
        })
      });
      const data = await res.json();
      
      if (data.success) {
        window.location.href = '/dashboard';
      } else {
        errorMsg = data.error || 'Failed to finish onboarding.';
      }
    } catch (err) {
      errorMsg = 'An unexpected error occurred.';
    }
    isLoading = false;
  }
</script>

<div class="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#0B0E14] text-white">
  <!-- Ambient Overlay -->
  <div class="absolute inset-0 pointer-events-none z-0 opacity-10" style="background: url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%232A3241\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"></div>
  
  <div class="absolute inset-0 pointer-events-none z-0" style="background: radial-gradient(circle at 50% -20%, rgba(255, 107, 74, 0.15), transparent 60%);"></div>

  <main class="w-full max-w-[600px] z-10">
    <!-- Header -->
    <header class="text-center mb-8 flex flex-col items-center">
      <div class="flex items-center gap-2 mb-2">
        <img alt="Shrimp Drive Logo" class="w-10 h-10 object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGvKZiSWhKMKF4oL_J9_HFMU0WChW-H3PdTFKDH5fcwzeRD8cucxiu_m8SCwkkem_gncQ3pHQMY9XKT1E_Qo_Load05oN_wTLuSRdXuYGaOIOAuwO-Jy6LtN_Xg9SR377LbmXzEHCaItWXyb5TYNgLWxalFLC77QpW1a9iCyl4JMZYRXakuFTpelbzhSNjKiFehO624W8ZuGIfUwWxUCn8r76HAs-112uICmmFtYLuBBMM0ZqDiZD2"/>
        <h1 class="text-3xl font-bold text-white">Shrimp Drive</h1>
      </div>
      <span class="inline-block bg-[#151921] border border-[#2A3241] rounded-full px-4 py-1 text-xs font-medium text-[#FF6B4A] tracking-wider uppercase">Initial Setup</span>
      
      {#if errorMsg}
        <div class="mt-4 bg-[#93000a] text-[#ffdad6] px-4 py-2 rounded-lg text-sm font-medium animate-[fadeIn_0.3s_ease]">
          {errorMsg}
        </div>
      {/if}
    </header>

    <!-- Main Card -->
    <div class="bg-[#151921] border border-[#2A3241] rounded-2xl p-6 md:p-8 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.5)]">
      
      <!-- Stepper -->
      <div class="flex items-center justify-between mb-8 px-2">
        <!-- Node 1 -->
        <div class="flex flex-col items-center gap-1">
          <div class="w-3 h-3 rounded-full transition-all duration-300 {currentStep >= 1 ? 'bg-[#FF6B4A] shadow-[0_0_0_4px_rgba(255,107,74,0.2)]' : 'bg-[#151921] border-2 border-[#2A3241]'}"></div>
          <span class="text-xs font-medium {currentStep >= 1 ? 'text-[#FF6B4A]' : 'text-gray-400'}">Invite</span>
        </div>
        <div class="flex-grow h-0.5 mx-2 transition-colors duration-300 {currentStep >= 2 ? 'bg-[#FF6B4A]' : 'bg-[#2A3241]'}"></div>
        
        <!-- Node 2 -->
        <div class="flex flex-col items-center gap-1">
          <div class="w-3 h-3 rounded-full transition-all duration-300 {currentStep >= 2 ? 'bg-[#FF6B4A] shadow-[0_0_0_4px_rgba(255,107,74,0.2)]' : 'bg-[#151921] border-2 border-[#2A3241]'}"></div>
          <span class="text-xs font-medium {currentStep >= 2 ? 'text-[#FF6B4A]' : 'text-gray-400'}">Bot Setup</span>
        </div>
        <div class="flex-grow h-0.5 mx-2 transition-colors duration-300 {currentStep >= 3 ? 'bg-[#FF6B4A]' : 'bg-[#2A3241]'}"></div>
        
        <!-- Node 3 -->
        <div class="flex flex-col items-center gap-1">
          <div class="w-3 h-3 rounded-full transition-all duration-300 {currentStep >= 3 ? 'bg-[#FF6B4A] shadow-[0_0_0_4px_rgba(255,107,74,0.2)]' : 'bg-[#151921] border-2 border-[#2A3241]'}"></div>
          <span class="text-xs font-medium {currentStep >= 3 ? 'text-[#FF6B4A]' : 'text-gray-400'}">Storage</span>
        </div>
        <div class="flex-grow h-0.5 mx-2 transition-colors duration-300 {currentStep >= 4 ? 'bg-[#FF6B4A]' : 'bg-[#2A3241]'}"></div>
        
        <!-- Node 4 -->
        <div class="flex flex-col items-center gap-1">
          <div class="w-3 h-3 rounded-full transition-all duration-300 {currentStep >= 4 ? 'bg-[#FF6B4A] shadow-[0_0_0_4px_rgba(255,107,74,0.2)]' : 'bg-[#151921] border-2 border-[#2A3241]'}"></div>
          <span class="text-xs font-medium {currentStep >= 4 ? 'text-[#FF6B4A]' : 'text-gray-400'}">Ready</span>
        </div>
      </div>

      <!-- Step 1: Invitation Code -->
      {#if currentStep === 1}
        <section class="animate-[fadeIn_0.3s_ease]">
          <h2 class="text-2xl font-bold text-white mb-2">Invitation Code</h2>
          <p class="text-sm text-gray-400 mb-6">Enter your invitation code provided by the administrator to configure your storage backend.</p>
          
          <div class="space-y-4">
            <div class="relative group">
              <label class="block text-xs font-medium text-gray-400 mb-1" for="inviteCode">Code</label>
              <div class="relative flex items-center">
                <Gift class="absolute left-3 text-[#2A3241] group-focus-within:text-[#FF6B4A] transition-colors" size={20} />
                <input bind:value={inviteCode} id="inviteCode" class="w-full bg-[#0B0E14] border border-[#2A3241] rounded-lg py-2 pl-10 pr-3 text-white text-sm focus:border-[#FF6B4A] focus:outline-none transition-colors" placeholder="e.g. SHRIMP-123" type="text"/>
              </div>
            </div>
          </div>
          
          <div class="flex justify-end mt-8 pt-4 border-t border-[#2A3241]">
            <button class="bg-[#FF6B4A] hover:bg-[#FF8264] text-[#0B0E14] font-bold rounded-lg px-6 py-2 flex items-center gap-2 text-sm transition-colors disabled:opacity-50" onclick={verifyInviteCode} disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Next'} <ArrowRight size={18} />
            </button>
          </div>
        </section>
      {/if}

      <!-- Step 2: Bot Link -->
      {#if currentStep === 2}
        <section class="animate-[fadeIn_0.3s_ease]">
          <h2 class="text-2xl font-bold text-white mb-2">Connect Telegram Bot</h2>
          <p class="text-sm text-gray-400 mb-6">Shrimp Drive uses Telegram as its storage backend. Create a bot via @BotFather and paste the token here.</p>
          
          <div class="bg-[#0B0E14] border border-[#2A3241] rounded-lg p-4 mb-4">
            <ol class="list-decimal list-inside text-sm text-gray-400 space-y-2">
              <li>Message <a class="text-[#FF6B4A] hover:underline" href="https://t.me/BotFather" target="_blank">@BotFather</a> on Telegram.</li>
              <li>Send <code class="text-xs bg-[#151921] px-1 rounded border border-[#2A3241]">/newbot</code> and follow prompts.</li>
              <li>Copy the HTTP API Token provided.</li>
            </ol>
          </div>
          
          <div class="relative mb-4">
            <label class="block text-xs font-medium text-gray-400 mb-1" for="bot-token">HTTP API Token</label>
            <div class="flex gap-2">
              <div class="relative flex-grow flex items-center group">
                <KeyRound class="absolute left-3 {botVerified ? 'text-[#4edea3]' : 'text-[#2A3241]'} group-focus-within:text-[#FF6B4A] transition-colors" size={20} />
                <input bind:value={botToken} class="w-full bg-[#0B0E14] border {botVerified ? 'border-[#4edea3]' : 'border-[#2A3241]'} rounded-lg py-2 pl-10 pr-3 text-white text-sm focus:border-[#FF6B4A] focus:outline-none transition-colors" id="bot-token" placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ" type="text"/>
              </div>
              <button disabled={isLoading} class="bg-transparent border border-[#2A3241] hover:bg-[#1E2430] text-white rounded-lg px-4 py-2 text-sm flex items-center gap-2 whitespace-nowrap transition-colors disabled:opacity-50" onclick={verifyBot}>
                {isLoading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>
          
          {#if botVerified}
            <div class="flex items-center gap-2 text-[#4edea3] text-xs font-medium animate-[fadeIn_0.3s_ease]">
              <CheckCircle2 size={18} />
              Bot successfully connected.
            </div>
          {/if}
          
          <div class="flex justify-between mt-8 pt-4 border-t border-[#2A3241]">
            <button class="bg-transparent border border-[#2A3241] hover:bg-[#1E2430] text-white rounded-lg px-4 py-2 flex items-center gap-2 text-sm transition-colors" onclick={prevStep}>
              <ArrowLeft size={18} /> Back
            </button>
            <button class="bg-[#FF6B4A] hover:bg-[#FF8264] text-[#0B0E14] font-bold rounded-lg px-6 py-2 flex items-center gap-2 text-sm transition-colors" onclick={nextStep}>
              Next <ArrowRight size={18} />
            </button>
          </div>
        </section>
      {/if}

      <!-- Step 3: Channel Link -->
      {#if currentStep === 3}
        <section class="animate-[fadeIn_0.3s_ease]">
          <h2 class="text-2xl font-bold text-white mb-2">Storage Channel</h2>
          <p class="text-sm text-gray-400 mb-6">Create a private channel to act as your limitless storage drive and add your bot as an admin.</p>
          
          <div class="bg-[#0B0E14] border border-[#2A3241] rounded-lg p-4 mb-4">
            <ol class="list-decimal list-inside text-sm text-gray-400 space-y-2">
              <li>Create a New Channel in Telegram.</li>
              <li>Set it to <strong>Private</strong>.</li>
              <li>Add the bot you just created as an <strong>Administrator</strong>.</li>
              <li>Forward a message from that channel to <a class="text-[#FF6B4A] hover:underline" href="https://t.me/userinfobot" target="_blank">@userinfobot</a> to get the ID.</li>
            </ol>
          </div>
          
          <div class="relative mb-4 group">
            <label class="block text-xs font-medium text-gray-400 mb-1" for="channel-id">Channel ID</label>
            <div class="flex gap-2">
              <div class="relative flex-grow flex items-center">
                <Hash class="absolute left-3 {pingSuccess ? 'text-[#4edea3]' : 'text-[#2A3241]'} group-focus-within:text-[#FF6B4A] transition-colors" size={20} />
                <input bind:value={chatId} id="channel-id" class="w-full bg-[#0B0E14] border {pingSuccess ? 'border-[#4edea3]' : 'border-[#2A3241]'} rounded-lg py-2 pl-10 pr-3 text-white text-sm focus:border-[#FF6B4A] focus:outline-none transition-colors" placeholder="-1001234567890" type="text"/>
              </div>
              <button disabled={isLoading} class="bg-transparent border border-[#2A3241] hover:bg-[#1E2430] text-white rounded-lg px-4 py-2 text-sm flex items-center gap-2 whitespace-nowrap transition-colors disabled:opacity-50" onclick={testPing}>
                {isLoading ? 'Testing...' : 'Test Ping'}
              </button>
            </div>
          </div>
          
          {#if pingSuccess}
            <div class="flex items-center gap-2 text-[#4edea3] text-xs font-medium animate-[fadeIn_0.3s_ease]">
              <CheckCircle2 size={18} />
              Ping sent! Check your channel.
            </div>
          {/if}
          
          <div class="flex justify-between mt-8 pt-4 border-t border-[#2A3241]">
            <button class="bg-transparent border border-[#2A3241] hover:bg-[#1E2430] text-white rounded-lg px-4 py-2 flex items-center gap-2 text-sm transition-colors" onclick={prevStep}>
              <ArrowLeft size={18} /> Back
            </button>
            <button class="bg-[#FF6B4A] hover:bg-[#FF8264] text-[#0B0E14] font-bold rounded-lg px-6 py-2 flex items-center gap-2 text-sm transition-colors" onclick={nextStep}>
              Next <ArrowRight size={18} />
            </button>
          </div>
        </section>
      {/if}

      <!-- Step 4: Ready -->
      {#if currentStep === 4}
        <section class="text-center animate-[fadeIn_0.3s_ease]">
          <div class="w-20 h-20 bg-[#FF6B4A]/10 rounded-full flex items-center justify-center mx-auto mb-6 mt-4 shadow-[0_0_30px_rgba(255,107,74,0.2)] border border-[#FF6B4A]/30">
            <Rocket class="text-[#FF6B4A]" size={40} />
          </div>
          
          <h2 class="text-2xl font-bold text-white mb-1">Engine Active</h2>
          <p class="text-sm text-gray-400 mb-8">Your personal cloud is configured and ready to accept data.</p>
          
          <div class="bg-[#0B0E14] border border-[#2A3241] rounded-lg p-4 mb-8 flex flex-col items-center gap-2">
            <div class="flex items-center gap-2 text-xs font-medium text-[#4edea3]">
              <span class="relative flex h-3 w-3">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4edea3] opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-[#4edea3]"></span>
              </span>
              Connection Established
            </div>
            <div class="text-sm font-medium text-white">Capacity: Unlimited (TG Backend)</div>
            <div class="text-xs text-gray-400">Allocated: dynamically / Speed: Optimal</div>
          </div>
          
          <div class="flex justify-between mt-8 pt-4 border-t border-[#2A3241]">
            <button class="bg-transparent border border-[#2A3241] hover:bg-[#1E2430] text-white rounded-lg px-4 py-2 flex items-center gap-2 text-sm transition-colors" onclick={prevStep}>
              <ArrowLeft size={18} /> Back
            </button>
            <button disabled={isLoading} onclick={submitOnboarding} class="bg-[#FF6B4A] hover:bg-[#FF8264] text-[#0B0E14] font-bold rounded-lg px-6 py-2 flex justify-center items-center gap-2 text-sm transition-colors disabled:opacity-50">
              {isLoading ? 'Configuring System...' : 'Launch Drive'} <Rocket size={18} />
            </button>
          </div>
        </section>
      {/if}
      
    </div>
  </main>
</div>

<style>
  @keyframes fadeIn { 
    from { opacity: 0; transform: translateY(10px); } 
    to { opacity: 1; transform: translateY(0); } 
  }
</style>
