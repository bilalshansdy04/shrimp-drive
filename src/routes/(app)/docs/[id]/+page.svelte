<script lang="ts">
  import { page } from "$app/stores";
  import { 
    X, 
    Minus, 
    Plus, 
    Maximize, 
    Search, 
    Printer, 
    Download, 
    PanelLeftClose, 
    MessageSquarePlus 
  } from "lucide-svelte";
</script>

<!-- Full-screen overlay to cover the standard app layout -->
<div class="fixed inset-0 z-[100] bg-[#0B0E14] text-white flex flex-col font-sans h-screen overflow-hidden antialiased">
  <!-- Top Toolbar -->
  <header class="flex-none h-16 bg-[#10131A] border-b border-[#32353C] flex justify-between items-center px-6 z-20">
    <!-- Left: Branding & Breadcrumb -->
    <div class="flex items-center gap-4">
      <!-- Close/Back Action -->
      <a href="/docs" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#272A31] transition-colors text-gray-400 hover:text-white">
        <X size={24} />
      </a>
      <div class="h-6 w-px bg-[#32353C] mx-2"></div>
      <div class="flex flex-col">
        <span class="text-xs text-gray-400">Docs / Projects / Q3</span>
        <h1 class="text-sm text-[#FF6B4A] font-bold capitalize">{($page.params.id || 'document').replace(/-/g, '_')}.pdf</h1>
      </div>
    </div>
    
    <!-- Center: Reader Controls -->
    <div class="flex items-center gap-2 bg-[#191C22] rounded-lg border border-[#32353C] px-2 py-1">
      <button class="w-8 h-8 flex items-center justify-center rounded hover:bg-[#272A31] text-gray-400 hover:text-white transition-colors">
        <Minus size={18} />
      </button>
      <span class="text-sm px-2 font-mono">125%</span>
      <button class="w-8 h-8 flex items-center justify-center rounded hover:bg-[#272A31] text-gray-400 hover:text-white transition-colors">
        <Plus size={18} />
      </button>
      <div class="h-4 w-px bg-[#32353C] mx-1"></div>
      <span class="text-sm px-2 font-mono">Page 1 / 14</span>
      <div class="h-4 w-px bg-[#32353C] mx-1"></div>
      <button class="w-8 h-8 flex items-center justify-center rounded hover:bg-[#272A31] text-gray-400 hover:text-white transition-colors" title="Fit Screen">
        <Maximize size={18} />
      </button>
    </div>
    
    <!-- Right: Actions -->
    <div class="flex items-center gap-4">
      <button class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#272A31] transition-colors text-gray-400 hover:text-white" title="Search">
        <Search size={20} />
      </button>
      <button class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#272A31] transition-colors text-gray-400 hover:text-white" title="Print">
        <Printer size={20} />
      </button>
      <button class="h-10 px-4 flex items-center gap-2 rounded-full bg-transparent border border-[#32353C] hover:bg-[#272A31] text-white transition-colors text-sm font-medium">
        <Download size={18} />
        Download
      </button>
    </div>
  </header>
  
  <!-- Main Content Area -->
  <div class="flex-1 flex overflow-hidden bg-[#0B0E14]">
    <!-- Sidebar Thumbnails -->
    <aside class="w-64 bg-[#191C22] border-r border-[#32353C] flex flex-col h-full flex-none z-10">
      <div class="p-4 border-b border-[#32353C] flex justify-between items-center bg-[#10131A]">
        <span class="text-xs text-gray-400 uppercase tracking-wider font-medium">Thumbnails</span>
        <button class="text-gray-400 hover:text-[#FF6B4A] transition-colors">
          <PanelLeftClose size={18} />
        </button>
      </div>
      <div class="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#363940] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#59413C]">
        
        <!-- Thumbnail 1 (Active) -->
        <div class="group relative flex flex-col items-center gap-1 cursor-pointer">
          <div class="w-full aspect-[1/1.4] bg-white rounded-md border-2 border-[#FF6B4A] p-1 shadow-lg relative overflow-hidden transition-transform duration-150 transform group-hover:scale-[1.02]">
            <img class="w-full h-full object-cover opacity-80 mix-blend-multiply" alt="Thumbnail 1" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkLQy3Fcg8G7mTTw8_gRKqCF16ie1ZX91c66gUH21SrdZ6WIsOX111pEolfSbriYU79XSE3l3U1te0k9Ozo9iXtsk_O3IibZuQUYpu3w70BhjM7VbyZ6uhRe7nGK1panOkQiFU6an5h-EUFC-yoBgCgISK7K9j0Hetw6ESYm759itrIv3Lgf3yDajLi7t1SpCuq-3ezG1JApGPuZdCfcK0k5Cm6noW-shVv8QVTy5nFr6jwc0eIyiT"/>
            <div class="absolute inset-0 bg-[#FF6B4A]/10 pointer-events-none"></div>
          </div>
          <span class="text-xs text-[#FF6B4A] font-bold">1</span>
        </div>
        
        <!-- Thumbnail 2 -->
        <div class="group relative flex flex-col items-center gap-1 cursor-pointer">
          <div class="w-full aspect-[1/1.4] bg-[#f0f0f0] rounded-md border border-[#32353C] p-1 relative overflow-hidden transition-all duration-150 transform group-hover:border-[#FF6B4A]/50 group-hover:scale-[1.02]">
            <img class="w-full h-full object-cover opacity-60 mix-blend-multiply" alt="Thumbnail 2" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVwD-ANHOInQVz7_Wdr6Il4vQduFBRSpQYiCsGOf2eMgdBI2zU01L6ipModBDdacpq_5rP1kPOJxTtihoXpIknxN2QX5KPlH3GFV1H2WaSaSXgxZ5eEYk6nxoYG0eX5m8fVsMEo38EnmrwpPbJeXgO107REo6YSdyOEBotfEHHndluy3ItQcTB0flMkTXpQeung9mpNvgkzo_snYZJL33MrX3XC120MTLtQ96m1NGB174lcRX3myT-"/>
          </div>
          <span class="text-xs text-gray-400">2</span>
        </div>
        
        <!-- Thumbnail 3 -->
        <div class="group relative flex flex-col items-center gap-1 cursor-pointer">
          <div class="w-full aspect-[1/1.4] bg-[#f0f0f0] rounded-md border border-[#32353C] p-1 relative overflow-hidden transition-all duration-150 transform group-hover:border-[#FF6B4A]/50 group-hover:scale-[1.02]">
            <img class="w-full h-full object-cover opacity-60 mix-blend-multiply" alt="Thumbnail 3" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCoWSLP7ovU3CEWkeBeOCvDIEmDcNzDjINv2Ly16GwaDsocxTcHsQ6c38aUxp0k1GUfc6k2P_7aDbqTJkIkOox4SMBWy21KcsKkkcIk2iMDK8A9xB2MBOC2Grd3fZt_voEGQ3IK0-a2vndzvq4mT2m3-KS85iqHlvsKov4dGXXgd7YiO4F8TU_nJXBlS5peV802R23IlOJjpDqG5Kg1IphEzu9lrEkh4nWO4v9GzlVQvv4JlpR-wNbN"/>
          </div>
          <span class="text-xs text-gray-400">3</span>
        </div>
      </div>
    </aside>
    
    <!-- Document Viewer Canvas -->
    <main class="flex-1 overflow-y-auto bg-[#0B0E14] p-10 flex justify-center [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#363940] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#59413C] relative">
      
      <!-- Mock PDF Document Page -->
      <div class="w-full max-w-[850px] aspect-[1/1.414] bg-white rounded-sm relative flex flex-col transform transition-transform origin-top shadow-[0px_10px_25px_-5px_rgba(0,0,0,0.7)]">
        
        <!-- Mock Document Content -->
        <div class="absolute inset-0 p-12 flex flex-col gap-8 text-[#0B0E14]">
          <!-- Doc Header -->
          <div class="border-b-2 border-[#2A3241] pb-6 flex justify-between items-end">
            <div>
              <p class="text-xs text-[#59413c] uppercase tracking-widest mb-2 font-medium">Internal Eyes Only</p>
              <h2 class="text-3xl font-bold leading-tight capitalize">{($page.params.id || 'Document').replace(/-/g, ' ')} Review</h2>
            </div>
            <div class="text-right text-xs text-[#59413c]">
              <p>Doc ID: SR-2024-88A</p>
              <p>Date: 24.10.2024</p>
            </div>
          </div>
          
          <!-- Doc Body -->
          <div class="flex-1 flex flex-col gap-6 text-sm">
            <p class="text-[#151921] leading-relaxed">
              This document outlines the proposed restructuring of the primary data ingest pipeline to accommodate the projected 400% increase in telemetry throughput by Q4. The focus is on reducing latency across regional nodes while maintaining strict consistency guarantees.
            </p>
            
            <!-- Mock Chart/Diagram Area -->
            <div class="w-full h-64 bg-[#f4f5f7] border border-[#d1d5db] rounded flex items-center justify-center relative overflow-hidden">
              <img class="w-full h-full object-cover mix-blend-darken opacity-80" alt="Architecture Diagram" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRXUTWP_-XAcGlbPSBfAKAIg4jv58x636s3tVl0sivU6KOFM1lJ9kgMwmSgvLrSNrYzqqdmoIHDDa7mxTna77M8IjEp0wzSw7IQ2d6FVzKW1gCD0t5UmXLoJyKFCCFL3OHFS6sQGeQWGO2jVarkIgjBeHX2md3748LaBQTYKxG367u-J274tbxzRRd00Y31dE0RzwbysYkommvg6wgCCtTdj0CMiofdeU6hJWTx64c6RT_oz0NsIeW"/>
            </div>
            
            <h3 class="text-xl font-semibold mt-4">1.0 Throughput Analysis</h3>
            <p class="text-[#151921] leading-relaxed">
              Initial stress tests indicate bottlenecks at the ingress router layer when concurrent connections exceed 50k/sec. The proposed mitigation involves a distributed caching layer utilizing Redis clusters deployed at edge locations.
            </p>
            
            <!-- Mock Data Table -->
            <div class="mt-4 border border-[#d1d5db] rounded overflow-hidden">
              <table class="w-full text-left text-xs">
                <thead class="bg-[#f4f5f7] border-b border-[#d1d5db]">
                  <tr>
                    <th class="p-3 font-semibold text-[#151921]">Region</th>
                    <th class="p-3 font-semibold text-[#151921]">Current Latency (ms)</th>
                    <th class="p-3 font-semibold text-[#151921]">Target Latency (ms)</th>
                    <th class="p-3 font-semibold text-[#151921]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="border-b border-[#e5e7eb]">
                    <td class="p-3 font-mono">us-east-1</td>
                    <td class="p-3 font-mono text-right">45.2</td>
                    <td class="p-3 font-mono text-right">20.0</td>
                    <td class="p-3 text-[#ae3115] font-semibold">Critical</td>
                  </tr>
                  <tr class="border-b border-[#e5e7eb]">
                    <td class="p-3 font-mono">eu-central-1</td>
                    <td class="p-3 font-mono text-right">32.1</td>
                    <td class="p-3 font-mono text-right">25.0</td>
                    <td class="p-3 text-[#ae3115] font-semibold">Warning</td>
                  </tr>
                  <tr>
                    <td class="p-3 font-mono">ap-northeast-1</td>
                    <td class="p-3 font-mono text-right">18.5</td>
                    <td class="p-3 font-mono text-right">20.0</td>
                    <td class="p-3 text-[#00a572] font-semibold">Optimal</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Doc Footer -->
          <div class="mt-auto pt-6 border-t border-[#d1d5db] flex justify-between items-center text-xs text-[#59413c]">
            <span>Shrimp Drive Enterprise Systems</span>
            <span>Page 1</span>
          </div>
        </div>
      </div>
      
      <!-- Floating Action Button (Contextual for Reader) -->
      <button class="fixed bottom-10 right-10 w-14 h-14 bg-[#FF6B4A] text-[#0B0E14] rounded-full shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.5)] flex items-center justify-center hover:bg-[#FF8264] transition-colors z-30 group" title="Add Comment">
        <MessageSquarePlus class="transition-transform group-hover:scale-110" size={24} fill="currentColor" />
      </button>
    </main>
  </div>
</div>
