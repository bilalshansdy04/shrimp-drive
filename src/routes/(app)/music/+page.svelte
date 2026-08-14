<script lang="ts">
  import { Filter, List, Activity, Pause, SlidersHorizontal, MoreVertical, Music, Maximize2, Heart, Shuffle, SkipBack, SkipForward, Repeat, ListMusic, Volume2 } from "lucide-svelte";
</script>

<div class="max-w-[1280px] mx-auto pb-24"> <!-- pb-24 to clear bottom audio player -->
  <!-- Page Header -->
  <div class="flex justify-between items-end mb-6">
    <div>
      <h1 class="text-3xl font-bold text-white mb-1">Music Library</h1>
      <p class="text-sm text-gray-400">1,204 tracks • 48.2 GB</p>
    </div>
    <div class="flex gap-2">
      <button class="p-2 border border-[#2A3241] rounded-lg bg-[#151921] hover:bg-[#1E2430] text-gray-400 hover:text-white transition-colors flex items-center justify-center">
        <Filter size={18} />
      </button>
      <button class="p-2 border border-[#2A3241] rounded-lg bg-[#151921] hover:bg-[#1E2430] text-gray-400 hover:text-white transition-colors flex items-center justify-center">
        <List size={18} />
      </button>
    </div>
  </div>

  <!-- Bento Grid Header / Featured -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
    <!-- Featured Track (Hero) -->
    <div class="bg-[#151921] border border-[#2A3241] rounded-2xl p-6 col-span-1 lg:col-span-2 relative overflow-hidden group cursor-pointer flex flex-col justify-end min-h-[200px]">
      <div class="absolute inset-0 bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700 ease-out z-0" style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuCAXDPtbNDB1OfwltcV1apwm7gXpwMHU_oYFkbFV5XbjcxplH8q20XfGR9lSQE92Jb2et-k6xzvPTbysEoy64bfKwIoL2FqpDNNtPKu_V3UxxOjpoh_qUJgpi51qvtjkfzjbOB40I5Vhj8ehkDCj_BQrDRRxkJKRWIwGx-0bmxNJEShanB8CY8Xl3ehRKijlZKyVDDzB9nzhyNCFWOL0eFHaJfznumc2X7HKdQZUFuFXhthtLKuAR1U')"></div>
      <div class="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/80 to-transparent z-10"></div>
      
      <div class="relative z-20 flex justify-between items-end w-full">
        <div>
          <div class="inline-flex items-center gap-1 bg-[#FF6B4A]/10 text-[#FF6B4A] border border-[#FF6B4A]/30 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider mb-2">
            <Activity size={12} /> Now Playing
          </div>
          <h2 class="text-2xl font-bold text-white drop-shadow-md">Magnetic</h2>
          <p class="text-sm text-gray-400">ILLIT • SUPER REAL ME</p>
        </div>
        <button class="w-12 h-12 rounded-full bg-[#FF6B4A] hover:bg-[#FF8264] text-[#0B0E14] flex items-center justify-center transition-all shadow-[0_0_15px_rgba(255,107,74,0.3)] hover:scale-105">
          <Pause size={24} fill="currentColor" />
        </button>
      </div>
    </div>
    
    <!-- Audio Pipeline Stats -->
    <div class="bg-[#151921] border border-[#2A3241] rounded-2xl p-6 flex flex-col justify-between">
      <div>
        <h3 class="text-sm font-medium text-gray-400 flex items-center gap-2 mb-4">
          <SlidersHorizontal size={18} /> Audio Pipeline Stats
        </h3>
        <div class="space-y-4">
          <div>
            <div class="flex justify-between text-[11px] font-medium text-gray-400 mb-1">
              <span>Stream Buffer</span>
              <span class="text-[#10B981]">Optimal</span>
            </div>
            <div class="w-full h-1.5 bg-[#10131a] rounded-full overflow-hidden border border-[#2A3241]">
              <div class="h-full bg-[#10B981] w-[85%]"></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between text-[11px] font-medium text-gray-400 mb-1">
              <span>Transcode Queue</span>
              <span>2 pending</span>
            </div>
            <div class="w-full h-1.5 bg-[#10131a] rounded-full overflow-hidden border border-[#2A3241]">
              <div class="h-full bg-[#FF6B4A] w-[15%]"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-4 pt-4 border-t border-[#2A3241] flex items-center justify-between">
        <span class="text-xs text-gray-400">Current Bitrate</span>
        <span class="text-xs font-medium text-[#FF6B4A]">320 kbps</span>
      </div>
    </div>
  </div>

  <!-- Table Container -->
  <div class="bg-[#151921] border border-[#2A3241] rounded-2xl overflow-hidden shadow-lg">
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-[#2A3241] bg-[#10131a]">
            <th class="w-12 px-4 py-3 text-xs font-medium text-gray-400 text-center">#</th>
            <th class="px-4 py-3 text-xs font-medium text-gray-400">Name</th>
            <th class="px-4 py-3 text-xs font-medium text-gray-400 hidden sm:table-cell">Artist</th>
            <th class="px-4 py-3 text-xs font-medium text-gray-400 text-right w-24">Duration</th>
            <th class="px-4 py-3 text-xs font-medium text-gray-400 text-right hidden md:table-cell w-28">Bitrate</th>
            <th class="px-4 py-3 text-xs font-medium text-gray-400 text-right hidden lg:table-cell w-32">Added</th>
            <th class="w-12 px-4 py-3 text-center"></th>
          </tr>
        </thead>
        <tbody class="text-sm text-white divide-y divide-[#2A3241]/50">
          
          <!-- Active Row -->
          <tr class="group cursor-pointer bg-[#1E2430]/50 relative hover:bg-[#1E2430] transition-colors">
            <td class="px-4 py-3 text-center text-[#FF6B4A]">
              <Activity size={18} class="mx-auto group-hover:hidden" />
              <Pause size={18} class="mx-auto hidden group-hover:block" />
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded border border-[#2A3241] overflow-hidden shrink-0">
                  <img class="w-full h-full object-cover" alt="Album Cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDAV-nxMuGUsYtUp98k2ufOpmDYdlBPU9Gy7XnMoLZWrga5aZCFYWNi_5Xh8tD1wY2yKCPVHGNo6QaUWU0lxY1QAInIiWtu7aERTDxRS5ijc1v1c7_KhANXbsAhRlvIiYt4VpUIG88K5WOo2GaQoYX4ryWHoB08IQEHz-cB_M0wT2QLpIsM1c-5U1sfQwS29evpN1Pq-cw9sgRhVr4pPzU8x0nzZ-eXqPdhy0L2Sa9zl63Nd8QLrTew">
                </div>
                <span class="font-medium text-[#FF6B4A]">Magnetic</span>
              </div>
            </td>
            <td class="px-4 py-3 hidden sm:table-cell text-gray-400">ILLIT</td>
            <td class="px-4 py-3 text-right text-xs tabular-nums text-gray-400">3:24</td>
            <td class="px-4 py-3 text-right text-xs text-gray-400 tabular-nums hidden md:table-cell">320 kbps</td>
            <td class="px-4 py-3 text-right text-xs text-gray-400 hidden lg:table-cell">Oct 12, 2024</td>
            <td class="px-4 py-3 text-center">
              <button class="text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical size={18} />
              </button>
            </td>
            <!-- Active glow line -->
            <td class="absolute left-0 top-0 bottom-0 w-0.5 bg-[#FF6B4A] shadow-[0_0_8px_rgba(255,107,74,0.8)]"></td>
          </tr>
          
          <!-- Standard Row 1 -->
          <tr class="group cursor-pointer hover:bg-[#1E2430] transition-colors">
            <td class="px-4 py-3 text-center text-xs text-gray-400">2</td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded bg-[#10131a] border border-[#2A3241] overflow-hidden shrink-0 flex items-center justify-center">
                  <Music size={16} class="text-gray-400" />
                </div>
                <span class="font-medium text-gray-300 group-hover:text-white transition-colors">Supernova</span>
              </div>
            </td>
            <td class="px-4 py-3 hidden sm:table-cell text-gray-400">aespa</td>
            <td class="px-4 py-3 text-right text-xs tabular-nums text-gray-400">2:58</td>
            <td class="px-4 py-3 text-right text-xs text-gray-400 tabular-nums hidden md:table-cell">FLAC</td>
            <td class="px-4 py-3 text-right text-xs text-gray-400 hidden lg:table-cell">Sep 28, 2024</td>
            <td class="px-4 py-3 text-center">
              <button class="text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical size={18} />
              </button>
            </td>
          </tr>
          
          <!-- Standard Row 2 -->
          <tr class="group cursor-pointer hover:bg-[#1E2430] transition-colors">
            <td class="px-4 py-3 text-center text-xs text-gray-400">3</td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded bg-[#10131a] border border-[#2A3241] overflow-hidden shrink-0 flex items-center justify-center">
                  <Music size={16} class="text-gray-400" />
                </div>
                <span class="font-medium text-gray-300 group-hover:text-white transition-colors">Armageddon</span>
              </div>
            </td>
            <td class="px-4 py-3 hidden sm:table-cell text-gray-400">aespa</td>
            <td class="px-4 py-3 text-right text-xs tabular-nums text-gray-400">3:16</td>
            <td class="px-4 py-3 text-right text-xs text-gray-400 tabular-nums hidden md:table-cell">FLAC</td>
            <td class="px-4 py-3 text-right text-xs text-gray-400 hidden lg:table-cell">Sep 28, 2024</td>
            <td class="px-4 py-3 text-center">
              <button class="text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical size={18} />
              </button>
            </td>
          </tr>
          
          <!-- Standard Row 3 -->
          <tr class="group cursor-pointer hover:bg-[#1E2430] transition-colors">
            <td class="px-4 py-3 text-center text-xs text-gray-400">4</td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded bg-[#10131a] border border-[#2A3241] overflow-hidden shrink-0 flex items-center justify-center">
                  <Music size={16} class="text-gray-400" />
                </div>
                <span class="font-medium text-gray-300 group-hover:text-white transition-colors">How Sweet</span>
              </div>
            </td>
            <td class="px-4 py-3 hidden sm:table-cell text-gray-400">NewJeans</td>
            <td class="px-4 py-3 text-right text-xs tabular-nums text-gray-400">3:05</td>
            <td class="px-4 py-3 text-right text-xs text-gray-400 tabular-nums hidden md:table-cell">320 kbps</td>
            <td class="px-4 py-3 text-right text-xs text-gray-400 hidden lg:table-cell">Aug 15, 2024</td>
            <td class="px-4 py-3 text-center">
              <button class="text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical size={18} />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- Bottom Audio Player (Footer) -->
<div class="fixed bottom-0 right-0 w-full md:w-[calc(100%-260px)] h-20 bg-[#151921] border-t border-[#2A3241] shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.5)] z-50 flex flex-col">
  <!-- Progress Bar (Thin, full width top) -->
  <div class="w-full h-1 bg-[#10131a] relative cursor-pointer group">
    <div class="absolute top-0 left-0 h-full bg-[#FF6B4A] w-[45%]"></div>
    <!-- Thumb appears on hover -->
    <div class="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#FF6B4A] shadow-[0_0_8px_rgba(255,107,74,0.6)] left-[45%] -ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150"></div>
    <!-- Expanded hit area -->
    <div class="absolute -top-2 -bottom-2 left-0 w-full bg-transparent"></div>
  </div>
  
  <div class="flex items-center justify-between px-6 flex-1">
    <!-- Now Playing Info -->
    <div class="flex items-center gap-4 w-1/3 min-w-[200px]">
      <div class="w-12 h-12 rounded border border-[#2A3241] overflow-hidden relative group cursor-pointer">
        <img class="w-full h-full object-cover" alt="Album Cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLUI7HnaKDxiepQOx_hjqd1bOPntlFNG6J26Ba7fcVWJksMwLXXzQ1dK5N8Ab69dzex8Cq4ulcKmWXwBtRvtXRpmOpInenq7XDBOnPf3h-f-G1bPN0yt5WSt8g07vZE5XeAZnBZBAafrjocwLlnok_uVt3an3LDL7zEPISi_lwIqL6LemPV5v-IgB5b5iSXtKK4GwWcH4YkcASj4g89u9eXJrO1tzOKf3xsxLFPrQOURp32hKaaiWg">
        <div class="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-all">
          <Maximize2 size={20} class="text-white" />
        </div>
      </div>
      <div class="overflow-hidden">
        <div class="text-sm font-medium text-white truncate hover:underline cursor-pointer">Magnetic</div>
        <div class="text-xs text-gray-400 truncate hover:underline cursor-pointer">ILLIT</div>
      </div>
      <button class="ml-2 text-gray-400 hover:text-[#FF6B4A] transition-colors p-1">
        <Heart size={20} />
      </button>
    </div>
    
    <!-- Playback Controls -->
    <div class="flex flex-col items-center justify-center w-1/3 flex-1">
      <div class="flex items-center gap-6">
        <button class="text-gray-400 hover:text-white transition-colors active:scale-95">
          <Shuffle size={20} />
        </button>
        <button class="text-gray-400 hover:text-white transition-colors active:scale-95">
          <SkipBack size={24} fill="currentColor" />
        </button>
        <button class="w-10 h-10 rounded-full bg-[#FF6B4A] hover:bg-[#FF8264] text-[#0B0E14] flex items-center justify-center transition-all active:scale-95 shadow-[0_0_10px_rgba(255,107,74,0.2)]">
          <Pause size={24} fill="currentColor" />
        </button>
        <button class="text-gray-400 hover:text-white transition-colors active:scale-95">
          <SkipForward size={24} fill="currentColor" />
        </button>
        <button class="text-[#FF6B4A] transition-colors active:scale-95 relative">
          <Repeat size={20} />
          <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#FF6B4A]"></div>
        </button>
      </div>
    </div>
    
    <!-- Volume & Extra Actions -->
    <div class="flex items-center justify-end gap-4 w-1/3 min-w-[200px]">
      <div class="text-xs text-gray-400 font-mono w-20 text-right">
        1:28 / 3:24
      </div>
      <div class="h-6 w-px bg-[#2A3241] mx-1"></div>
      <button class="text-gray-400 hover:text-white transition-colors">
        <ListMusic size={20} />
      </button>
      <div class="flex items-center gap-2 group">
        <button class="text-gray-400 hover:text-white transition-colors">
          <Volume2 size={20} />
        </button>
        <div class="w-16 h-1 bg-[#10131a] rounded-full overflow-hidden cursor-pointer border border-[#2A3241]">
          <div class="h-full bg-[#FF6B4A] w-[70%] group-hover:bg-[#FF8264] transition-colors"></div>
        </div>
      </div>
    </div>
  </div>
</div>
