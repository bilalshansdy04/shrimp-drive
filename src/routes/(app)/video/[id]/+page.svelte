<script lang="ts">
  import { page } from "$app/stores";
  import { ArrowLeft, Play, Volume2, PictureInPicture2, Maximize } from "lucide-svelte";
</script>

<div class="max-w-6xl mx-auto flex flex-col gap-8">
  <!-- Video Player & Details -->
  <div class="flex flex-col gap-4">
    <!-- Video Metadata Area -->
    <div class="flex items-center justify-between gap-4 mb-2">
      <div class="flex flex-col">
        <a href="/video" class="flex items-center gap-2 px-3 py-1.5 -ml-3 rounded-lg text-gray-400 hover:text-white hover:bg-[#1E2430] transition-all duration-150 group mb-2 w-fit">
          <ArrowLeft size={20} />
          <span class="text-sm font-medium">Back to Library</span>
        </a>
        <h2 class="text-3xl font-bold text-white tracking-tight">Video {$page.params.id}</h2>
      </div>
    </div>
    
    <!-- Video Player Container (Level 1 Surface) -->
    <div class="w-full aspect-video bg-black rounded-2xl border border-[#2A3241] overflow-hidden relative group shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)]">
      <!-- Video Output/Placeholder -->
      <div class="w-full h-full relative">
        <img class="w-full h-full object-cover opacity-80" alt="Video Placeholder" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9KS5xFEJCyvoAcyLdeN7A3A2ZlGAJP0P7EHcDfCNfIxseNE5QYNRcoA6RkWhSmbnWZgB7ZC6cjLR0z2W2bCj1CgtA2TZor71pxCbwxda7m_cqYhH9Dn79bQ28s1_orYAOs_JqI5mW8ETzCPF9bZmExw2tz_8zRHtOvwdAjOPMyk72sFM9OvSvpEgKEN47BiOQTAodtniMmN6q75dPrdCTjfuNrGKtQyQfmjsQAZflfhprooQr1Dzz">
        <!-- Overlay Gradient for Controls visibility -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      
      <!-- Custom Controls Overlay -->
      <div class="absolute bottom-0 left-0 w-full p-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
        <!-- Progress Bar -->
        <div class="w-full flex items-center h-2 cursor-pointer group/progress relative">
          <input class="absolute top-1/2 -translate-y-1/2 z-10 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#FF6B4A] [&::-webkit-slider-thumb]:opacity-0 group-hover/progress:[&::-webkit-slider-thumb]:opacity-100 [&::-webkit-slider-thumb]:transition-opacity [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-gradient-to-r [&::-webkit-slider-runnable-track]:from-[#FF6B4A] [&::-webkit-slider-runnable-track]:from-[35%] [&::-webkit-slider-runnable-track]:to-[#2A3241] [&::-webkit-slider-runnable-track]:to-[35%] [&::-webkit-slider-runnable-track]:rounded-full" max="100" min="0" type="range" value="35">
        </div>
        
        <!-- Control Buttons Row -->
        <div class="flex items-center justify-between mt-2">
          <!-- Left Controls -->
          <div class="flex items-center gap-4">
            <button class="text-white hover:text-[#FF6B4A] transition-colors flex items-center justify-center">
              <Play size={24} fill="currentColor" />
            </button>
            <button class="text-white hover:text-[#FF6B4A] transition-colors flex items-center justify-center group/vol">
              <Volume2 size={20} />
            </button>
            <div class="text-sm text-gray-400 flex items-center gap-1 ml-2 font-mono">
              <span class="text-white">02:14</span>
              <span>/</span>
              <span>06:45</span>
            </div>
          </div>
          
          <!-- Right Controls -->
          <div class="flex items-center gap-3">
            <button class="px-2 py-1 rounded bg-[#10131a]/50 backdrop-blur border border-[#2A3241] text-xs font-medium text-white hover:border-[#FF6B4A] hover:text-[#FF6B4A] transition-colors">
              1.0x
            </button>
            <button class="px-2 py-1 rounded bg-[#10131a]/50 backdrop-blur border border-[#2A3241] text-xs font-medium text-white hover:border-[#FF6B4A] hover:text-[#FF6B4A] transition-colors">
              1080p
            </button>
            <div class="w-px h-4 bg-[#2A3241] mx-1"></div>
            <button class="text-white hover:text-[#FF6B4A] transition-colors flex items-center justify-center">
              <PictureInPicture2 size={20} />
            </button>
            <button class="text-white hover:text-[#FF6B4A] transition-colors flex items-center justify-center">
              <Maximize size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
