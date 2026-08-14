<script lang="ts">
</script>

<div class="flex h-screen items-center justify-center bg-[#0B0E14] text-white">
  <div class="w-full max-w-md rounded-xl border border-[#2A3241] bg-[#151921] p-8">
    <div class="mb-8 text-center">
      <span class="text-4xl block mb-4">🍤</span>
      <h1 class="text-2xl font-bold text-[#FF6B4A]">Welcome to Shrimp Drive</h1>
      <p class="text-gray-400 mt-2">Set up your Telegram Bot API to get started.</p>
    </div>
    
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1" for="botToken">Telegram Bot Token</label>
        <input type="text" id="botToken" class="w-full rounded-md border border-[#2A3241] bg-[#0B0E14] px-3 py-2 text-white focus:border-[#FF6B4A] focus:outline-none" placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1" for="chatId">Telegram Chat ID</label>
        <input type="text" id="chatId" class="w-full rounded-md border border-[#2A3241] bg-[#0B0E14] px-3 py-2 text-white focus:border-[#FF6B4A] focus:outline-none" placeholder="-1001234567890" />
      </div>
      
      <button class="w-full rounded-md bg-[#FF6B4A] py-2.5 font-medium text-white mt-4 hover:bg-[#FF8266] transition-colors">
        Complete Setup
      </button>
    </div>
  </div>
</div>
