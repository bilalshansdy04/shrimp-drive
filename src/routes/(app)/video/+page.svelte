<script lang="ts">
  import { Filter, List, LayoutGrid, Video, PlayCircle, Download, Trash2, ChevronLeft, ChevronRight } from "lucide-svelte";
</script>

<div class="max-w-[1280px] mx-auto">
  <!-- Header Section -->
  <div class="flex justify-between items-end mb-6">
    <div>
      <h2 class="text-3xl font-bold text-white mb-1">Video Hub</h2>
      <p class="text-sm text-gray-400">Manage and preview your high-resolution renders and exports.</p>
    </div>
    
    <!-- Contextual Filters/View Controls -->
    <div class="flex gap-2">
      <button class="p-2 rounded-lg bg-[#10131a] border border-[#2A3241] text-gray-400 hover:bg-[#1E2430] hover:text-white transition-colors duration-150" title="Filter Options">
        <Filter size={20} />
      </button>
      <div class="flex bg-[#0B0E14] border border-[#2A3241] rounded-lg p-0.5">
        <button class="p-1.5 rounded bg-[#151921] text-[#FF6B4A] shadow-sm" title="List View">
          <List size={20} />
        </button>
        <button class="p-1.5 rounded text-gray-400 hover:text-white hover:bg-[#1E2430]" title="Grid View">
          <LayoutGrid size={20} />
        </button>
      </div>
    </div>
  </div>

  <!-- Data Table Container -->
  <div class="bg-[#151921] border border-[#2A3241] rounded-2xl overflow-hidden shadow-lg">
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse whitespace-nowrap">
        <thead>
          <tr class="bg-[#10131a] border-b border-[#2A3241]">
            <th class="py-4 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider w-2/5">Name</th>
            <th class="py-4 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Duration</th>
            <th class="py-4 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Resolution</th>
            <th class="py-4 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Size</th>
            <th class="py-4 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Date Uploaded</th>
            <th class="py-4 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#2A3241]">
          <!-- Row 1 -->
          <tr class="group hover:bg-[#1E2430] transition-colors duration-150">
            <td class="py-3 px-6">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded bg-[#0B0E14] border border-[#2A3241] flex items-center justify-center text-[#FF6B4A] relative overflow-hidden">
                  <div class="absolute inset-0 bg-[#FF6B4A] opacity-5"></div>
                  <Video size={20} />
                </div>
                <span class="text-sm text-white group-hover:text-[#FF6B4A] transition-colors duration-150 cursor-pointer">Project_Alpha_Final_Render_v3.mp4</span>
              </div>
            </td>
            <td class="py-3 px-4 text-sm text-gray-400">00:12:45</td>
            <td class="py-3 px-4 text-sm text-gray-400">4K UHD (3840x2160)</td>
            <td class="py-3 px-4 text-sm text-gray-400 text-right tabular-nums">4.2 GB</td>
            <td class="py-3 px-4 text-sm text-gray-400 text-right">Oct 24, 2023</td>
            <td class="py-3 px-6 text-right">
              <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button class="p-1.5 text-gray-400 hover:text-[#FF6B4A] transition-colors" title="Play">
                  <PlayCircle size={20} />
                </button>
                <button class="p-1.5 text-gray-400 hover:text-white transition-colors" title="Download">
                  <Download size={20} />
                </button>
                <button class="p-1.5 text-gray-400 hover:text-[#ffb4ab] transition-colors" title="Delete">
                  <Trash2 size={20} />
                </button>
              </div>
            </td>
          </tr>
          
          <!-- Row 2 -->
          <tr class="group hover:bg-[#1E2430] transition-colors duration-150">
            <td class="py-3 px-6">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded bg-[#0B0E14] border border-[#2A3241] flex items-center justify-center text-gray-400">
                  <Video size={20} />
                </div>
                <span class="text-sm text-white group-hover:text-[#FF6B4A] transition-colors duration-150 cursor-pointer">Q3_Marketing_B-Roll_Raw.mxf</span>
              </div>
            </td>
            <td class="py-3 px-4 text-sm text-gray-400">01:05:22</td>
            <td class="py-3 px-4 text-sm text-gray-400">1080p (1920x1080)</td>
            <td class="py-3 px-4 text-sm text-gray-400 text-right tabular-nums">18.5 GB</td>
            <td class="py-3 px-4 text-sm text-gray-400 text-right">Oct 22, 2023</td>
            <td class="py-3 px-6 text-right">
              <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button class="p-1.5 text-gray-400 hover:text-[#FF6B4A] transition-colors" title="Play">
                  <PlayCircle size={20} />
                </button>
                <button class="p-1.5 text-gray-400 hover:text-white transition-colors" title="Download">
                  <Download size={20} />
                </button>
                <button class="p-1.5 text-gray-400 hover:text-[#ffb4ab] transition-colors" title="Delete">
                  <Trash2 size={20} />
                </button>
              </div>
            </td>
          </tr>
          
          <!-- Row 3 -->
          <tr class="group hover:bg-[#1E2430] transition-colors duration-150">
            <td class="py-3 px-6">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded bg-[#0B0E14] border border-[#2A3241] flex items-center justify-center text-gray-400">
                  <Video size={20} />
                </div>
                <span class="text-sm text-white group-hover:text-[#FF6B4A] transition-colors duration-150 cursor-pointer">Client_Interview_Sync_01.mov</span>
              </div>
            </td>
            <td class="py-3 px-4 text-sm text-gray-400">00:45:10</td>
            <td class="py-3 px-4 text-sm text-gray-400">4K UHD (3840x2160)</td>
            <td class="py-3 px-4 text-sm text-gray-400 text-right tabular-nums">12.1 GB</td>
            <td class="py-3 px-4 text-sm text-gray-400 text-right">Oct 18, 2023</td>
            <td class="py-3 px-6 text-right">
              <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button class="p-1.5 text-gray-400 hover:text-[#FF6B4A] transition-colors" title="Play">
                  <PlayCircle size={20} />
                </button>
                <button class="p-1.5 text-gray-400 hover:text-white transition-colors" title="Download">
                  <Download size={20} />
                </button>
                <button class="p-1.5 text-gray-400 hover:text-[#ffb4ab] transition-colors" title="Delete">
                  <Trash2 size={20} />
                </button>
              </div>
            </td>
          </tr>
          
          <!-- Row 4 -->
          <tr class="group hover:bg-[#1E2430] transition-colors duration-150">
            <td class="py-3 px-6">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded bg-[#0B0E14] border border-[#2A3241] flex items-center justify-center text-gray-400">
                  <Video size={20} />
                </div>
                <span class="text-sm text-white group-hover:text-[#FF6B4A] transition-colors duration-150 cursor-pointer">Social_Teaser_Vertical.mp4</span>
              </div>
            </td>
            <td class="py-3 px-4 text-sm text-gray-400">00:00:30</td>
            <td class="py-3 px-4 text-sm text-gray-400">1080x1920</td>
            <td class="py-3 px-4 text-sm text-gray-400 text-right tabular-nums">150 MB</td>
            <td class="py-3 px-4 text-sm text-gray-400 text-right">Oct 15, 2023</td>
            <td class="py-3 px-6 text-right">
              <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button class="p-1.5 text-gray-400 hover:text-[#FF6B4A] transition-colors" title="Play">
                  <PlayCircle size={20} />
                </button>
                <button class="p-1.5 text-gray-400 hover:text-white transition-colors" title="Download">
                  <Download size={20} />
                </button>
                <button class="p-1.5 text-gray-400 hover:text-[#ffb4ab] transition-colors" title="Delete">
                  <Trash2 size={20} />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Table Footer / Pagination -->
    <div class="bg-[#10131a] border-t border-[#2A3241] px-6 py-3 flex items-center justify-between">
      <span class="text-sm text-gray-400">Showing 1 to 4 of 42 entries</span>
      <div class="flex gap-2">
        <button class="p-1.5 rounded text-[#2A3241] cursor-not-allowed">
          <ChevronLeft size={20} />
        </button>
        <button class="p-1.5 rounded text-gray-400 hover:text-white hover:bg-[#1E2430] transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  </div>
</div>
