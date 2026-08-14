<script lang="ts">
  import { Music, Video, FileText, UploadCloud, FileAudio, FileVideo, Play, Download, Trash2, Eye } from "lucide-svelte";
</script>

<div class="max-w-[1280px] mx-auto">
  <!-- Filters -->
  <div class="flex gap-3 mb-8 overflow-x-auto pb-2">
    <button class="px-4 py-1.5 rounded-full bg-[#1E2430] border border-[#2A3241] text-[#FF6B4A] text-sm font-medium">All</button>
    <button class="px-4 py-1.5 rounded-full bg-transparent border border-[#2A3241] text-gray-300 hover:bg-[#1E2430] text-sm font-medium transition-colors duration-150">Audio</button>
    <button class="px-4 py-1.5 rounded-full bg-transparent border border-[#2A3241] text-gray-300 hover:bg-[#1E2430] text-sm font-medium transition-colors duration-150">Video</button>
    <button class="px-4 py-1.5 rounded-full bg-transparent border border-[#2A3241] text-gray-300 hover:bg-[#1E2430] text-sm font-medium transition-colors duration-150">Docs</button>
    <button class="px-4 py-1.5 rounded-full bg-transparent border border-[#2A3241] text-gray-300 hover:bg-[#1E2430] text-sm font-medium transition-colors duration-150">Images</button>
  </div>

  <!-- Analytics Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
    <!-- Total Storage -->
    <div class="bg-[#151921] rounded-2xl border border-[#2A3241] p-6 flex flex-col items-center justify-center">
      <div class="relative w-24 h-24 mb-3">
        <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          <path class="text-[#151921] stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke-width="3"></path>
          <path class="text-[#FF6B4A] stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke-dasharray="30, 100" stroke-width="3"></path>
        </svg>
        <div class="absolute inset-0 flex items-center justify-center text-xl font-bold text-[#FF6B4A]">
          30%
        </div>
      </div>
      <h3 class="text-sm font-medium text-gray-400">Total Storage</h3>
    </div>

    <!-- Audio Vault -->
    <div class="bg-[#151921] rounded-2xl border border-[#2A3241] p-6">
      <div class="flex items-start justify-between mb-4">
        <Music class="text-[#4edea3]" size={24} />
        <span class="text-xs font-medium text-gray-400">1.2 GB</span>
      </div>
      <h3 class="text-2xl font-bold text-white mb-1">Audio Vault</h3>
      <p class="text-sm text-gray-400">342 Tracks</p>
    </div>

    <!-- Visual Media -->
    <div class="bg-[#151921] rounded-2xl border border-[#2A3241] p-6">
      <div class="flex items-start justify-between mb-4">
        <Video class="text-[#56d9d8]" size={24} />
        <span class="text-xs font-medium text-gray-400">800 MB</span>
      </div>
      <h3 class="text-2xl font-bold text-white mb-1">Visual Media</h3>
      <p class="text-sm text-gray-400">45 Videos / 120 Photos</p>
    </div>

    <!-- Documents -->
    <div class="bg-[#151921] rounded-2xl border border-[#2A3241] p-6">
      <div class="flex items-start justify-between mb-4">
        <FileText class="text-[#ffb4a3]" size={24} />
        <span class="text-xs font-medium text-gray-400">400 MB</span>
      </div>
      <h3 class="text-2xl font-bold text-white mb-1">Documents</h3>
      <p class="text-sm text-gray-400">89 Files</p>
    </div>
  </div>

  <!-- Upload Zone -->
  <div class="border-2 border-dashed border-[#2A3241] rounded-2xl bg-[#10131a] p-8 flex flex-col items-center justify-center mb-8 hover:bg-[#151921] transition-colors duration-150 cursor-pointer group">
    <UploadCloud class="text-[#2A3241] group-hover:text-[#FF6B4A] transition-colors duration-150 mb-3" size={48} />
    <p class="text-base text-white mb-1">Drag and drop files here</p>
    <p class="text-xs text-gray-400">or click to browse from your computer</p>
  </div>

  <!-- Recent Files Table -->
  <div class="bg-[#151921] rounded-2xl border border-[#2A3241] overflow-hidden">
    <div class="p-4 border-b border-[#2A3241]">
      <h2 class="text-lg text-white font-semibold">Recent Files</h2>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-[#0B0E14] border-b border-[#2A3241]">
            <th class="p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
            <th class="p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
            <th class="p-4 text-xs font-medium text-gray-400 uppercase tracking-wider text-right tabular-nums">Size</th>
            <th class="p-4 text-xs font-medium text-gray-400 uppercase tracking-wider text-right tabular-nums">Date</th>
            <th class="p-4 text-xs font-medium text-gray-400 uppercase tracking-wider text-center">Actions</th>
          </tr>
        </thead>
        <tbody class="text-sm text-gray-300">
          <!-- Row 1: Audio -->
          <tr class="border-b border-[#2A3241] hover:bg-[#1E2430] transition-colors duration-150 group">
            <td class="p-4 flex items-center gap-3">
              <FileAudio class="text-[#4edea3]" size={20} />
              <span class="text-white">Magnetic - ILLIT.m4a</span>
            </td>
            <td class="p-4 text-gray-400">Audio</td>
            <td class="p-4 text-gray-400 text-right tabular-nums text-xs">8.4 MB</td>
            <td class="p-4 text-gray-400 text-right tabular-nums text-xs">Oct 24, 2024</td>
            <td class="p-4 text-center">
              <div class="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button class="text-[#FF6B4A] hover:text-[#FF8264]"><Play size={18} /></button>
                <button class="text-gray-400 hover:text-white"><Download size={18} /></button>
                <button class="text-[#ffb4ab] hover:text-[#93000a]"><Trash2 size={18} /></button>
              </div>
            </td>
          </tr>
          <!-- Row 2: Doc -->
          <tr class="border-b border-[#2A3241] hover:bg-[#1E2430] transition-colors duration-150 group">
            <td class="p-4 flex items-center gap-3">
              <FileText class="text-[#ffb4a3]" size={20} />
              <span class="text-white">Q3_Financial_Report.pdf</span>
            </td>
            <td class="p-4 text-gray-400">Document</td>
            <td class="p-4 text-gray-400 text-right tabular-nums text-xs">2.1 MB</td>
            <td class="p-4 text-gray-400 text-right tabular-nums text-xs">Oct 23, 2024</td>
            <td class="p-4 text-center">
              <div class="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button class="text-[#FF6B4A] hover:text-[#FF8264]"><Eye size={18} /></button>
                <button class="text-gray-400 hover:text-white"><Download size={18} /></button>
                <button class="text-[#ffb4ab] hover:text-[#93000a]"><Trash2 size={18} /></button>
              </div>
            </td>
          </tr>
          <!-- Row 3: Video -->
          <tr class="border-b border-[#2A3241] hover:bg-[#1E2430] transition-colors duration-150 group">
            <td class="p-4 flex items-center gap-3">
              <FileVideo class="text-[#56d9d8]" size={20} />
              <span class="text-white">Project_Alpha_Demo.mp4</span>
            </td>
            <td class="p-4 text-gray-400">Video</td>
            <td class="p-4 text-gray-400 text-right tabular-nums text-xs">145.2 MB</td>
            <td class="p-4 text-gray-400 text-right tabular-nums text-xs">Oct 21, 2024</td>
            <td class="p-4 text-center">
              <div class="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button class="text-[#FF6B4A] hover:text-[#FF8264]"><Play size={18} /></button>
                <button class="text-gray-400 hover:text-white"><Download size={18} /></button>
                <button class="text-[#ffb4ab] hover:text-[#93000a]"><Trash2 size={18} /></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
