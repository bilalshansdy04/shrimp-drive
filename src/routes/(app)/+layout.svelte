<script lang="ts">
  import { Search, Filter, UploadCloud, HardDrive, File, Music, Video, Image, FileText, Settings, LogOut } from "lucide-svelte";
  import "../../app.css";

  let { children } = $props();
</script>

<div class="flex h-screen w-full bg-[#0B0E14] text-white overflow-hidden">
  <!-- Sidebar -->
  <aside class="flex w-[260px] flex-col border-r border-[#2A3241] bg-[#151921] h-full shrink-0">
    <!-- Brand -->
    <div class="flex h-[64px] items-center px-6 border-b border-[#2A3241]">
      <div class="flex items-center gap-2 text-[#FF6B4A] font-bold text-xl">
        <span>🍤</span>
        <span class="text-white">Shrimp Drive</span>
      </div>
    </div>

    <!-- Navigation -->
    <div class="flex-1 overflow-y-auto py-4 flex flex-col gap-6 px-4">
      <!-- Main Links -->
      <nav class="flex flex-col gap-1">
        <a href="/dashboard" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-[#2A3241] hover:text-white transition-colors">
          <HardDrive size={18} />
          Overview
        </a>
        <a href="/drive" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-[#2A3241] hover:text-white transition-colors">
          <File size={18} />
          All Files
        </a>
      </nav>

      <!-- Media Hubs -->
      <div>
        <h3 class="px-3 text-xs font-semibold uppercase text-gray-500 mb-2 tracking-wider">Media Hubs</h3>
        <nav class="flex flex-col gap-1">
          <a href="/music" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-[#2A3241] hover:text-white transition-colors">
            <Music size={18} />
            Music
          </a>
          <a href="/video" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-[#2A3241] hover:text-white transition-colors">
            <Video size={18} />
            Video
          </a>
          <a href="/photo" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-[#2A3241] hover:text-white transition-colors">
            <Image size={18} />
            Photo
          </a>
          <a href="/docs" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-[#2A3241] hover:text-white transition-colors">
            <FileText size={18} />
            Docs
          </a>
        </nav>
      </div>
    </div>

    <!-- Footer Sidebar -->
    <div class="p-4 border-t border-[#2A3241]">
      <div class="mb-4">
        <div class="flex justify-between text-xs text-gray-400 mb-2">
          <span>Storage (Telegram)</span>
          <span>2.4 GB / 8.0 GB</span>
        </div>
        <div class="h-1.5 w-full bg-[#0B0E14] rounded-full overflow-hidden">
          <div class="h-full bg-[#FF6B4A] rounded-full" style="width: 30%;"></div>
        </div>
      </div>
      
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-full bg-gradient-to-tr from-[#FF6B4A] to-purple-500"></div>
        <div class="flex-1 overflow-hidden">
          <p class="truncate text-sm font-medium">User Account</p>
        </div>
        <button class="text-gray-400 hover:text-white p-1">
          <Settings size={16} />
        </button>
        <button class="text-gray-400 hover:text-white p-1">
          <LogOut size={16} />
        </button>
      </div>
    </div>
  </aside>

  <!-- Main Canvas -->
  <main class="flex flex-1 flex-col overflow-hidden min-w-0">
    <!-- Header -->
    <header class="flex h-[64px] shrink-0 items-center justify-between border-b border-[#2A3241] bg-[#0B0E14]/80 px-6 backdrop-blur z-10">
      <div class="flex items-center gap-4 flex-1">
        <div class="relative w-96">
          <Search size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search files, metadata..." 
            class="h-10 w-full rounded-full border border-[#2A3241] bg-[#151921] pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-[#FF6B4A] focus:outline-none focus:ring-1 focus:ring-[#FF6B4A]"
          />
        </div>
        
        <div class="hidden lg:flex items-center gap-2">
          <button class="flex items-center gap-1 rounded-full border border-[#2A3241] bg-[#151921] px-3 py-1.5 text-xs text-gray-300 hover:text-white transition-colors">
            All
          </button>
          <button class="flex items-center gap-1 rounded-full border border-[#2A3241] bg-[#151921] px-3 py-1.5 text-xs text-gray-300 hover:text-white transition-colors">
            Audio
          </button>
          <button class="flex items-center gap-1 rounded-full border border-[#2A3241] bg-[#151921] px-3 py-1.5 text-xs text-gray-300 hover:text-white transition-colors">
            Video
          </button>
        </div>
      </div>

      <div class="flex items-center gap-4 ml-auto pl-4">
        <button class="flex items-center gap-2 rounded-lg bg-[#FF6B4A] px-4 py-2 text-sm font-medium text-white hover:bg-[#FF8266] transition-colors">
          <UploadCloud size={18} />
          Upload File
        </button>
      </div>
    </header>

    <!-- Dynamic Canvas -->
    <div class="flex-1 overflow-y-auto p-6">
      {@render children()}
    </div>
  </main>
</div>
