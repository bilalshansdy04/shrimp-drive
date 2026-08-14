<script lang="ts">
  import { LayoutGrid, List, Filter, Download, Trash2 } from "lucide-svelte";
</script>

<div class="flex-1 overflow-y-auto p-8">
  <!-- Page Header -->
  <div class="flex justify-between items-end mb-6">
    <div>
      <h2 class="text-3xl font-bold text-white">Photos Library</h2>
      <p class="text-sm text-gray-400 mt-1">3 items in current view</p>
    </div>
    <!-- View Toggles & Filters -->
    <div class="flex items-center gap-3">
      <div class="flex items-center bg-[#1D2026] rounded-lg border border-[#32353C] p-1">
        <button class="p-1.5 rounded text-gray-400 hover:bg-[#32353C] transition-colors" title="Grid View">
          <LayoutGrid size={20} />
        </button>
        <button class="p-1.5 rounded bg-[#32353C] text-[#FF6B4A] shadow-sm border border-[#32353C]" title="List View">
          <List size={20} />
        </button>
      </div>
      <button class="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#32353C] text-white hover:bg-[#272A31] transition-colors text-sm font-medium">
        <Filter size={18} />
        Filter
      </button>
    </div>
  </div>

  <!-- Table Container -->
  <div class="bg-[#10131A] rounded-2xl border border-[#32353C] overflow-hidden shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]">
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="border-b border-[#32353C] bg-[#191C22] text-gray-400 text-xs font-medium uppercase tracking-wider">
          <th class="px-6 py-4 font-medium">Name</th>
          <th class="px-6 py-4 font-medium w-40">Date Taken</th>
          <th class="px-6 py-4 font-medium w-32">Dimensions</th>
          <th class="px-6 py-4 font-medium w-24 text-right">File Size</th>
          <th class="px-6 py-4 font-medium w-24 text-center">Actions</th>
        </tr>
      </thead>
      <tbody class="text-white text-sm">
        <!-- Row 1 -->
        <tr class="border-b border-[#32353C] hover:bg-[#272A31] transition-colors duration-150 group">
          <td class="px-6 py-3">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-lg overflow-hidden border border-[#32353C] flex-shrink-0 bg-[#0B0E14]">
                <img class="w-full h-full object-cover" alt="server_rack_04.jpg" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBL9WUFIS1EmXKONhqcnOK3LgXymz4r_X8I-s1txAzVc89EHV-fCXt5P79mqZb4g62xog3x2_LHQjugzSmZtC5FcxGzDSDS5HjZEzJFBofjQTWhW19HnfVkOZul1L8iLK2B0gvhrB-Ei1NHmZ9NYVB5bK_Bk785Sv_lZMPzUVNxlg_XFGuyQT0H5IYkq8JZOZwlCeoYuYvFTvSCalqd348Yhn74a-CDBuoA85G0KvNhEDxqTOpYVVL7">
              </div>
              <span class="font-medium truncate max-w-[200px] group-hover:text-[#FF6B4A] transition-colors">server_rack_04.jpg</span>
            </div>
          </td>
          <td class="px-6 py-3 text-gray-400 font-mono text-sm">2023-11-12</td>
          <td class="px-6 py-3 text-gray-400 font-mono text-sm">4000x3000</td>
          <td class="px-6 py-3 text-gray-400 font-mono text-sm text-right">4.2 MB</td>
          <td class="px-6 py-3 text-center">
            <div class="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button class="w-8 h-8 rounded text-gray-400 hover:text-[#FF6B4A] hover:bg-[#32353C] transition-colors flex items-center justify-center">
                <Download size={18} />
              </button>
              <button class="w-8 h-8 rounded text-gray-400 hover:text-red-500 hover:bg-[#32353C] transition-colors flex items-center justify-center">
                <Trash2 size={18} />
              </button>
            </div>
          </td>
        </tr>
        
        <!-- Row 2 -->
        <tr class="border-b border-[#32353C] hover:bg-[#272A31] transition-colors duration-150 group">
          <td class="px-6 py-3">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-lg overflow-hidden border border-[#32353C] flex-shrink-0 bg-[#0B0E14]">
                <img class="w-full h-full object-cover" alt="circuit_board_macro.png" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC80bsMhmj4Zf6zLK_e9TIUWOpbzt9YSdeJQ_8aB1ijMsRqPaHOzv85g1rKBQlGPslmP1RAWMiLqNB23Po9veCrbhc9AhLkhDGL2OcZ4iEfkLuIuNHUQU5pTrXKq39ltpgzteZfiZ5kS35ZAMYivxpvrab-HaotY8jTKyYa70Xx_qG1p2lEwr74sOoSClDHrrBze_ylFRLRT0PxHN_y7V-CvmG_Ce1_7AUnG4In0ZQYTyIRsvYnY9Wd">
              </div>
              <span class="font-medium truncate max-w-[200px] group-hover:text-[#FF6B4A] transition-colors">circuit_board_macro.png</span>
            </div>
          </td>
          <td class="px-6 py-3 text-gray-400 font-mono text-sm">2023-11-10</td>
          <td class="px-6 py-3 text-gray-400 font-mono text-sm">2000x2000</td>
          <td class="px-6 py-3 text-gray-400 font-mono text-sm text-right">1.8 MB</td>
          <td class="px-6 py-3 text-center">
            <div class="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button class="w-8 h-8 rounded text-gray-400 hover:text-[#FF6B4A] hover:bg-[#32353C] transition-colors flex items-center justify-center">
                <Download size={18} />
              </button>
              <button class="w-8 h-8 rounded text-gray-400 hover:text-red-500 hover:bg-[#32353C] transition-colors flex items-center justify-center">
                <Trash2 size={18} />
              </button>
            </div>
          </td>
        </tr>
        
        <!-- Row 3 -->
        <tr class="hover:bg-[#272A31] transition-colors duration-150 group">
          <td class="px-6 py-3">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-lg overflow-hidden border border-[#32353C] flex-shrink-0 bg-[#0B0E14]">
                <img class="w-full h-full object-cover" alt="datacenter_hallway.jpg" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA7JddUF-i9bYw1RyhhEmPYS0TrM61cty9-u3jHPQvPTqDjkKarFJY2sSkSnIUOjJ0sB5I-8DpbaKAMGCsRfaO5UryfrCMa41Exs_eEmZq15V6OfzxuI_lkopfO-4CHilX3daMG12L11KZMPH3_Rda7yOyJKKjU-vbaajj_BuI7KelHU_slbT5gGv6VRZuS7CT8xYjbAc_n-ySEx6BWvFm8nGNtwD323-oBlnSNudDEyDEltJRsMUy6">
              </div>
              <span class="font-medium truncate max-w-[200px] group-hover:text-[#FF6B4A] transition-colors">datacenter_hallway.jpg</span>
            </div>
          </td>
          <td class="px-6 py-3 text-gray-400 font-mono text-sm">2023-11-05</td>
          <td class="px-6 py-3 text-gray-400 font-mono text-sm">6000x4000</td>
          <td class="px-6 py-3 text-gray-400 font-mono text-sm text-right">8.5 MB</td>
          <td class="px-6 py-3 text-center">
            <div class="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button class="w-8 h-8 rounded text-gray-400 hover:text-[#FF6B4A] hover:bg-[#32353C] transition-colors flex items-center justify-center">
                <Download size={18} />
              </button>
              <button class="w-8 h-8 rounded text-gray-400 hover:text-red-500 hover:bg-[#32353C] transition-colors flex items-center justify-center">
                <Trash2 size={18} />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
