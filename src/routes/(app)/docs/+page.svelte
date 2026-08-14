<script lang="ts">
  import { 
    List, 
    LayoutGrid, 
    FileText, 
    Download, 
    MoreVertical, 
    ChevronLeft, 
    ChevronRight 
  } from "lucide-svelte";
</script>

<div class="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6">
  <!-- Page Header -->
  <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
    <div>
      <h2 class="text-3xl font-bold text-white">Documents Library</h2>
      <p class="text-sm text-gray-400 mt-1">Manage and review your technical documentation.</p>
    </div>
    <!-- View Toggles / Filters -->
    <div class="flex items-center gap-1 p-1 rounded-lg bg-[#1D2026] border border-[#32353C]">
      <button class="p-1.5 rounded bg-[#32353C] text-[#FF6B4A] shadow-sm">
        <List size={20} />
      </button>
      <button class="p-1.5 rounded text-gray-400 hover:bg-[#272A31] transition-colors">
        <LayoutGrid size={20} />
      </button>
    </div>
  </div>

  <!-- Documents Table Container -->
  <div class="bg-[#151921] border border-[#2A3241] rounded-2xl w-full overflow-hidden flex flex-col flex-1 min-h-[400px]">
    <!-- Table Header -->
    <div class="grid grid-cols-12 gap-4 p-4 border-b border-[#32353C] bg-[#191C22] text-xs text-gray-400 uppercase tracking-wider items-center">
      <div class="col-span-5 md:col-span-4 pl-2">Name</div>
      <div class="hidden md:block col-span-2 text-right">Pages</div>
      <div class="col-span-3 md:col-span-3 text-right">Date Modified</div>
      <div class="col-span-2 text-right">Size</div>
      <div class="hidden md:block col-span-1 text-center">Ext</div>
      <div class="col-span-2 md:col-span-2 text-right pr-2">Actions</div>
    </div>

    <!-- Table Body -->
    <div class="flex-1 overflow-y-auto flex flex-col">
      <!-- Row 1 -->
      <a href="/docs/q3-architecture" class="grid grid-cols-12 gap-4 p-4 border-b border-[#32353C]/50 hover:bg-[#1E2430] items-center transition-colors group cursor-pointer text-white">
        <div class="col-span-5 md:col-span-4 flex items-center gap-4 pl-2">
          <div class="w-10 h-10 rounded-lg bg-[#1D2026] flex items-center justify-center border border-[#32353C] group-hover:border-[#FF6B4A]/50 transition-colors shrink-0">
            <FileText size={24} class="text-[#FF6B4A]" />
          </div>
          <span class="text-sm font-medium truncate group-hover:text-[#FF6B4A] transition-colors">Q3_Architecture_Review.pdf</span>
        </div>
        <div class="hidden md:block col-span-2 text-right text-sm text-gray-400">42</div>
        <div class="col-span-3 md:col-span-3 text-right text-sm text-gray-400">Oct 12, 2023</div>
        <div class="col-span-2 text-right text-sm text-gray-400">4.2 MB</div>
        <div class="hidden md:block col-span-1 text-center">
          <span class="px-2 py-1 rounded bg-[#272A31] text-gray-400 text-xs border border-[#32353C]/50">PDF</span>
        </div>
        <div class="col-span-2 md:col-span-2 flex justify-end items-center gap-2 pr-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
          <button class="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-[#272A31] hover:text-[#FF6B4A] transition-colors">
            <Download size={18} />
          </button>
          <button class="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-[#272A31] transition-colors">
            <MoreVertical size={18} />
          </button>
        </div>
      </a>

      <!-- Row 2 -->
      <a href="/docs/system-specs" class="grid grid-cols-12 gap-4 p-4 border-b border-[#32353C]/50 hover:bg-[#1E2430] items-center transition-colors group cursor-pointer text-white">
        <div class="col-span-5 md:col-span-4 flex items-center gap-4 pl-2">
          <div class="w-10 h-10 rounded-lg bg-[#1D2026] flex items-center justify-center border border-[#32353C] group-hover:border-[#FF6B4A]/50 transition-colors shrink-0">
            <FileText size={24} class="text-[#FF6B4A]" />
          </div>
          <span class="text-sm font-medium truncate group-hover:text-[#FF6B4A] transition-colors">System_Specs_V2.pdf</span>
        </div>
        <div class="hidden md:block col-span-2 text-right text-sm text-gray-400">128</div>
        <div class="col-span-3 md:col-span-3 text-right text-sm text-gray-400">Nov 05, 2023</div>
        <div class="col-span-2 text-right text-sm text-gray-400">12.8 MB</div>
        <div class="hidden md:block col-span-1 text-center">
          <span class="px-2 py-1 rounded bg-[#272A31] text-gray-400 text-xs border border-[#32353C]/50">PDF</span>
        </div>
        <div class="col-span-2 md:col-span-2 flex justify-end items-center gap-2 pr-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
          <button class="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-[#272A31] hover:text-[#FF6B4A] transition-colors">
            <Download size={18} />
          </button>
          <button class="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-[#272A31] transition-colors">
            <MoreVertical size={18} />
          </button>
        </div>
      </a>

      <!-- Row 3 -->
      <a href="/docs/api-docs" class="grid grid-cols-12 gap-4 p-4 border-b border-[#32353C]/50 hover:bg-[#1E2430] items-center transition-colors group cursor-pointer text-white">
        <div class="col-span-5 md:col-span-4 flex items-center gap-4 pl-2">
          <div class="w-10 h-10 rounded-lg bg-[#1D2026] flex items-center justify-center border border-[#32353C] group-hover:border-[#FF6B4A]/50 transition-colors shrink-0">
            <FileText size={24} class="text-[#FF6B4A]" />
          </div>
          <span class="text-sm font-medium truncate group-hover:text-[#FF6B4A] transition-colors">API_Documentation.pdf</span>
        </div>
        <div class="hidden md:block col-span-2 text-right text-sm text-gray-400">856</div>
        <div class="col-span-3 md:col-span-3 text-right text-sm text-gray-400">Nov 18, 2023</div>
        <div class="col-span-2 text-right text-sm text-gray-400">45.1 MB</div>
        <div class="hidden md:block col-span-1 text-center">
          <span class="px-2 py-1 rounded bg-[#272A31] text-gray-400 text-xs border border-[#32353C]/50">PDF</span>
        </div>
        <div class="col-span-2 md:col-span-2 flex justify-end items-center gap-2 pr-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
          <button class="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-[#272A31] hover:text-[#FF6B4A] transition-colors">
            <Download size={18} />
          </button>
          <button class="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-[#272A31] transition-colors">
            <MoreVertical size={18} />
          </button>
        </div>
      </a>
    </div>

    <!-- Table Footer / Pagination -->
    <div class="p-4 border-t border-[#32353C] bg-[#0B0E14] flex justify-between items-center text-gray-400 text-sm">
      <span>Showing 3 of 3 items</span>
      <div class="flex items-center gap-2">
        <button class="p-1 rounded hover:bg-[#272A31] disabled:opacity-50" disabled>
          <ChevronLeft size={20} />
        </button>
        <button class="p-1 rounded hover:bg-[#272A31] disabled:opacity-50" disabled>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  </div>
</div>
