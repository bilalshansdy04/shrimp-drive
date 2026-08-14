<script lang="ts">
  import { Home, ChevronRight, LayoutGrid, List, Music, Video, Image, FolderOpen, FileAudio, FileText, MoreVertical } from "lucide-svelte";
</script>

<div class="max-w-[1280px] mx-auto">
  <!-- Breadcrumbs & Path -->
  <div class="flex items-center gap-2 mb-6 text-gray-400 text-xs font-medium">
    <Home size={16} />
    <span class="hover:text-[#FF6B4A] cursor-pointer transition-colors">Home</span>
    <ChevronRight size={16} />
    <span class="text-[#FF6B4A] font-bold">Drive</span>
  </div>

  <!-- Page Header -->
  <div class="flex justify-between items-end mb-6">
    <div>
      <h2 class="text-2xl md:text-4xl font-bold text-white mb-1">My Drive</h2>
      <p class="text-sm text-gray-400">Manage and organize your personal cloud storage.</p>
    </div>
    <div class="hidden sm:flex items-center gap-2 bg-[#151921] border border-[#2A3241] rounded-lg p-1">
      <button class="p-1.5 bg-[#1E2430] rounded text-[#FF6B4A] shadow-sm"><LayoutGrid size={20} /></button>
      <button class="p-1.5 text-gray-400 hover:text-[#FF6B4A] transition-colors"><List size={20} /></button>
    </div>
  </div>

  <!-- Bento Grid Layout for Folders -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
    <!-- Folder: Music -->
    <div class="bg-[#151921] border border-[#2A3241] rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer group relative overflow-hidden h-40 hover:bg-[#1E2430] transition-colors">
      <div class="absolute inset-0 bg-gradient-to-br from-[#FF6B4A]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <Music size={48} class="text-[#2A3241] group-hover:text-[#FF6B4A] transition-colors duration-300 mb-2" />
      <h3 class="text-sm font-medium text-white group-hover:text-[#FF6B4A] transition-colors">Music</h3>
      <p class="text-xs text-gray-400/70 mt-1 font-mono">1.2 GB</p>
    </div>
    
    <!-- Folder: Video -->
    <div class="bg-[#151921] border border-[#2A3241] rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer group relative overflow-hidden h-40 hover:bg-[#1E2430] transition-colors">
      <div class="absolute inset-0 bg-gradient-to-br from-[#FF6B4A]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <Video size={48} class="text-[#2A3241] group-hover:text-[#FF6B4A] transition-colors duration-300 mb-2" />
      <h3 class="text-sm font-medium text-white group-hover:text-[#FF6B4A] transition-colors">Video</h3>
      <p class="text-xs text-gray-400/70 mt-1 font-mono">4.5 GB</p>
    </div>
    
    <!-- Folder: Photos -->
    <div class="bg-[#151921] border border-[#2A3241] rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer group relative overflow-hidden h-40 hover:bg-[#1E2430] transition-colors">
      <div class="absolute inset-0 bg-gradient-to-br from-[#FF6B4A]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <Image size={48} class="text-[#2A3241] group-hover:text-[#FF6B4A] transition-colors duration-300 mb-2" />
      <h3 class="text-sm font-medium text-white group-hover:text-[#FF6B4A] transition-colors">Photos</h3>
      <p class="text-xs text-gray-400/70 mt-1 font-mono">850 MB</p>
    </div>
    
    <!-- Folder: Docs -->
    <div class="bg-[#151921] border border-[#2A3241] rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer group relative overflow-hidden h-40 hover:bg-[#1E2430] transition-colors">
      <div class="absolute inset-0 bg-gradient-to-br from-[#FF6B4A]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <FolderOpen size={48} class="text-[#2A3241] group-hover:text-[#FF6B4A] transition-colors duration-300 mb-2" />
      <h3 class="text-sm font-medium text-white group-hover:text-[#FF6B4A] transition-colors">Docs</h3>
      <p class="text-xs text-gray-400/70 mt-1 font-mono">120 MB</p>
    </div>
  </div>

  <!-- Recent Files Section (Asymmetric Layout) -->
  <div class="mt-6">
    <h3 class="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4 border-b border-[#2A3241] pb-2">Recent Files</h3>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- File Row 1 -->
      <div class="lg:col-span-2 bg-[#151921] border border-[#2A3241] hover:bg-[#1E2430] rounded-xl p-4 flex items-center justify-between group cursor-pointer transition-colors">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded bg-[#1E2430] flex items-center justify-center text-[#FF6B4A]">
            <FileAudio size={20} />
          </div>
          <div>
            <p class="text-sm text-white font-medium">Cyberpunk_Ambient_Mix.wav</p>
            <p class="text-xs text-gray-400 font-mono text-[11px]">Today, 14:30 • Audio</p>
          </div>
        </div>
        <div class="flex items-center gap-6">
          <span class="text-xs text-gray-400 font-mono hidden sm:block">45 MB</span>
          <button class="text-[#2A3241] group-hover:text-[#FF6B4A] transition-colors"><MoreVertical size={20} /></button>
        </div>
      </div>
      
      <!-- File Row 2 -->
      <div class="lg:col-span-1 bg-[#151921] border border-[#2A3241] hover:bg-[#1E2430] rounded-xl p-4 flex items-center justify-between group cursor-pointer transition-colors">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded bg-[#1E2430] flex items-center justify-center text-[#10B981]">
            <FileText size={20} />
          </div>
          <div class="truncate">
            <p class="text-sm text-white font-medium truncate">System_Architecture.pdf</p>
            <p class="text-xs text-gray-400 font-mono text-[11px]">Yesterday</p>
          </div>
        </div>
        <button class="text-[#2A3241] group-hover:text-[#FF6B4A] transition-colors"><MoreVertical size={20} /></button>
      </div>
    </div>
  </div>
</div>
