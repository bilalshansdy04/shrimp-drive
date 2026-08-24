<script lang="ts">
	import { page } from '$app/stores';
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
	} from 'lucide-svelte';
</script>

<!-- Full-screen overlay to cover the standard app layout -->
<div
	class="fixed inset-0 z-[100] flex h-screen flex-col overflow-hidden bg-[#0B0E14] font-sans text-white antialiased"
>
	<!-- Top Toolbar -->
	<header
		class="z-20 flex h-16 flex-none items-center justify-between border-b border-[#32353C] bg-[#10131A] px-6"
	>
		<!-- Left: Branding & Breadcrumb -->
		<div class="flex items-center gap-4">
			<!-- Close/Back Action -->
			<a
				href="/docs"
				class="flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-[#272A31] hover:text-white"
			>
				<X size={24} />
			</a>
			<div class="mx-2 h-6 w-px bg-[#32353C]"></div>
			<div class="flex flex-col">
				<span class="text-xs text-gray-400">Docs / Projects / Q3</span>
				<h1 class="text-sm font-bold text-[#FF6B4A] capitalize">
					{($page.params.id || 'document').replace(/-/g, '_')}.pdf
				</h1>
			</div>
		</div>

		<!-- Center: Reader Controls -->
		<div class="flex items-center gap-2 rounded-lg border border-[#32353C] bg-[#191C22] px-2 py-1">
			<button
				class="flex h-8 w-8 items-center justify-center rounded text-gray-400 transition-colors hover:bg-[#272A31] hover:text-white"
			>
				<Minus size={18} />
			</button>
			<span class="px-2 font-mono text-sm">125%</span>
			<button
				class="flex h-8 w-8 items-center justify-center rounded text-gray-400 transition-colors hover:bg-[#272A31] hover:text-white"
			>
				<Plus size={18} />
			</button>
			<div class="mx-1 h-4 w-px bg-[#32353C]"></div>
			<span class="px-2 font-mono text-sm">Page 1 / 14</span>
			<div class="mx-1 h-4 w-px bg-[#32353C]"></div>
			<button
				class="flex h-8 w-8 items-center justify-center rounded text-gray-400 transition-colors hover:bg-[#272A31] hover:text-white"
				title="Fit Screen"
			>
				<Maximize size={18} />
			</button>
		</div>

		<!-- Right: Actions -->
		<div class="flex items-center gap-4">
			<button
				class="flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-[#272A31] hover:text-white"
				title="Search"
			>
				<Search size={20} />
			</button>
			<button
				class="flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-[#272A31] hover:text-white"
				title="Print"
			>
				<Printer size={20} />
			</button>
			<button
				class="flex h-10 items-center gap-2 rounded-full border border-[#32353C] bg-transparent px-4 text-sm font-medium text-white transition-colors hover:bg-[#272A31]"
			>
				<Download size={18} />
				Download
			</button>
		</div>
	</header>

	<!-- Main Content Area -->
	<div class="flex flex-1 overflow-hidden bg-[#0B0E14]">
		<!-- Sidebar Thumbnails -->
		<aside class="z-10 flex h-full w-64 flex-none flex-col border-r border-[#32353C] bg-[#191C22]">
			<div class="flex items-center justify-between border-b border-[#32353C] bg-[#10131A] p-4">
				<span class="text-xs font-medium tracking-wider text-gray-400 uppercase">Thumbnails</span>
				<button class="text-gray-400 transition-colors hover:text-[#FF6B4A]">
					<PanelLeftClose size={18} />
				</button>
			</div>
			<div
				class="flex-1 space-y-4 overflow-y-auto p-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#363940] hover:[&::-webkit-scrollbar-thumb]:bg-[#59413C] [&::-webkit-scrollbar-track]:bg-transparent"
			>
				<!-- Thumbnail 1 (Active) -->
				<div class="group relative flex cursor-pointer flex-col items-center gap-1">
					<div
						class="relative aspect-[1/1.4] w-full transform overflow-hidden rounded-md border-2 border-[#FF6B4A] bg-white p-1 shadow-lg transition-transform duration-150 group-hover:scale-[1.02]"
					>
						<img
							class="h-full w-full object-cover opacity-80 mix-blend-multiply"
							alt="Thumbnail 1"
							src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkLQy3Fcg8G7mTTw8_gRKqCF16ie1ZX91c66gUH21SrdZ6WIsOX111pEolfSbriYU79XSE3l3U1te0k9Ozo9iXtsk_O3IibZuQUYpu3w70BhjM7VbyZ6uhRe7nGK1panOkQiFU6an5h-EUFC-yoBgCgISK7K9j0Hetw6ESYm759itrIv3Lgf3yDajLi7t1SpCuq-3ezG1JApGPuZdCfcK0k5Cm6noW-shVv8QVTy5nFr6jwc0eIyiT"
						/>
						<div class="pointer-events-none absolute inset-0 bg-[#FF6B4A]/10"></div>
					</div>
					<span class="text-xs font-bold text-[#FF6B4A]">1</span>
				</div>

				<!-- Thumbnail 2 -->
				<div class="group relative flex cursor-pointer flex-col items-center gap-1">
					<div
						class="relative aspect-[1/1.4] w-full transform overflow-hidden rounded-md border border-[#32353C] bg-[#f0f0f0] p-1 transition-all duration-150 group-hover:scale-[1.02] group-hover:border-[#FF6B4A]/50"
					>
						<img
							class="h-full w-full object-cover opacity-60 mix-blend-multiply"
							alt="Thumbnail 2"
							src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVwD-ANHOInQVz7_Wdr6Il4vQduFBRSpQYiCsGOf2eMgdBI2zU01L6ipModBDdacpq_5rP1kPOJxTtihoXpIknxN2QX5KPlH3GFV1H2WaSaSXgxZ5eEYk6nxoYG0eX5m8fVsMEo38EnmrwpPbJeXgO107REo6YSdyOEBotfEHHndluy3ItQcTB0flMkTXpQeung9mpNvgkzo_snYZJL33MrX3XC120MTLtQ96m1NGB174lcRX3myT-"
						/>
					</div>
					<span class="text-xs text-gray-400">2</span>
				</div>

				<!-- Thumbnail 3 -->
				<div class="group relative flex cursor-pointer flex-col items-center gap-1">
					<div
						class="relative aspect-[1/1.4] w-full transform overflow-hidden rounded-md border border-[#32353C] bg-[#f0f0f0] p-1 transition-all duration-150 group-hover:scale-[1.02] group-hover:border-[#FF6B4A]/50"
					>
						<img
							class="h-full w-full object-cover opacity-60 mix-blend-multiply"
							alt="Thumbnail 3"
							src="https://lh3.googleusercontent.com/aida-public/AB6AXuCoWSLP7ovU3CEWkeBeOCvDIEmDcNzDjINv2Ly16GwaDsocxTcHsQ6c38aUxp0k1GUfc6k2P_7aDbqTJkIkOox4SMBWy21KcsKkkcIk2iMDK8A9xB2MBOC2Grd3fZt_voEGQ3IK0-a2vndzvq4mT2m3-KS85iqHlvsKov4dGXXgd7YiO4F8TU_nJXBlS5peV802R23IlOJjpDqG5Kg1IphEzu9lrEkh4nWO4v9GzlVQvv4JlpR-wNbN"
						/>
					</div>
					<span class="text-xs text-gray-400">3</span>
				</div>
			</div>
		</aside>

		<!-- Document Viewer Canvas -->
		<main
			class="relative flex flex-1 justify-center overflow-y-auto bg-[#0B0E14] p-10 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#363940] hover:[&::-webkit-scrollbar-thumb]:bg-[#59413C] [&::-webkit-scrollbar-track]:bg-transparent"
		>
			<!-- Mock PDF Document Page -->
			<div
				class="relative flex aspect-[1/1.414] w-full max-w-[850px] origin-top transform flex-col rounded-sm bg-white shadow-[0px_10px_25px_-5px_rgba(0,0,0,0.7)] transition-transform"
			>
				<!-- Mock Document Content -->
				<div class="absolute inset-0 flex flex-col gap-8 p-12 text-[#0B0E14]">
					<!-- Doc Header -->
					<div class="flex items-end justify-between border-b-2 border-[#2A3241] pb-6">
						<div>
							<p class="mb-2 text-xs font-medium tracking-widest text-[#59413c] uppercase">
								Internal Eyes Only
							</p>
							<h2 class="text-3xl leading-tight font-bold capitalize">
								{($page.params.id || 'Document').replace(/-/g, ' ')} Review
							</h2>
						</div>
						<div class="text-right text-xs text-[#59413c]">
							<p>Doc ID: SR-2024-88A</p>
							<p>Date: 24.10.2024</p>
						</div>
					</div>

					<!-- Doc Body -->
					<div class="flex flex-1 flex-col gap-6 text-sm">
						<p class="leading-relaxed text-[#151921]">
							This document outlines the proposed restructuring of the primary data ingest pipeline
							to accommodate the projected 400% increase in telemetry throughput by Q4. The focus is
							on reducing latency across regional nodes while maintaining strict consistency
							guarantees.
						</p>

						<!-- Mock Chart/Diagram Area -->
						<div
							class="relative flex h-64 w-full items-center justify-center overflow-hidden rounded border border-[#d1d5db] bg-[#f4f5f7]"
						>
							<img
								class="h-full w-full object-cover opacity-80 mix-blend-darken"
								alt="Architecture Diagram"
								src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRXUTWP_-XAcGlbPSBfAKAIg4jv58x636s3tVl0sivU6KOFM1lJ9kgMwmSgvLrSNrYzqqdmoIHDDa7mxTna77M8IjEp0wzSw7IQ2d6FVzKW1gCD0t5UmXLoJyKFCCFL3OHFS6sQGeQWGO2jVarkIgjBeHX2md3748LaBQTYKxG367u-J274tbxzRRd00Y31dE0RzwbysYkommvg6wgCCtTdj0CMiofdeU6hJWTx64c6RT_oz0NsIeW"
							/>
						</div>

						<h3 class="mt-4 text-xl font-semibold">1.0 Throughput Analysis</h3>
						<p class="leading-relaxed text-[#151921]">
							Initial stress tests indicate bottlenecks at the ingress router layer when concurrent
							connections exceed 50k/sec. The proposed mitigation involves a distributed caching
							layer utilizing Redis clusters deployed at edge locations.
						</p>

						<!-- Mock Data Table -->
						<div class="mt-4 overflow-hidden rounded border border-[#d1d5db]">
							<table class="w-full text-left text-xs">
								<thead class="border-b border-[#d1d5db] bg-[#f4f5f7]">
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
										<td class="p-3 text-right font-mono">45.2</td>
										<td class="p-3 text-right font-mono">20.0</td>
										<td class="p-3 font-semibold text-[#ae3115]">Critical</td>
									</tr>
									<tr class="border-b border-[#e5e7eb]">
										<td class="p-3 font-mono">eu-central-1</td>
										<td class="p-3 text-right font-mono">32.1</td>
										<td class="p-3 text-right font-mono">25.0</td>
										<td class="p-3 font-semibold text-[#ae3115]">Warning</td>
									</tr>
									<tr>
										<td class="p-3 font-mono">ap-northeast-1</td>
										<td class="p-3 text-right font-mono">18.5</td>
										<td class="p-3 text-right font-mono">20.0</td>
										<td class="p-3 font-semibold text-[#00a572]">Optimal</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>

					<!-- Doc Footer -->
					<div
						class="mt-auto flex items-center justify-between border-t border-[#d1d5db] pt-6 text-xs text-[#59413c]"
					>
						<span>Shrimp Drive Enterprise Systems</span>
						<span>Page 1</span>
					</div>
				</div>
			</div>

			<!-- Floating Action Button (Contextual for Reader) -->
			<button
				class="group fixed right-10 bottom-10 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#FF6B4A] text-[#0B0E14] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.5)] transition-colors hover:bg-[#FF8264]"
				title="Add Comment"
			>
				<MessageSquarePlus
					class="transition-transform group-hover:scale-110"
					size={24}
					fill="currentColor"
				/>
			</button>
		</main>
	</div>
</div>
