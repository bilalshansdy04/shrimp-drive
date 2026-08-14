<script lang="ts">
	import {
		Music,
		Video,
		FileText,
		UploadCloud,
		FileAudio,
		FileVideo,
		Play,
		Download,
		Trash2,
		Eye
	} from 'lucide-svelte';
</script>

<div class="mx-auto max-w-7xl">
	<!-- Filters -->
	<div class="mb-8 flex gap-3 overflow-x-auto pb-2">
		<button
			class="text-primary-container rounded-full border border-[#2A3241] bg-[#1E2430] px-4 py-1.5 text-sm font-medium"
			>All</button
		>
		<button
			class="rounded-full border border-[#2A3241] bg-transparent px-4 py-1.5 text-sm font-medium text-gray-300 transition-colors duration-150 hover:bg-[#1E2430]"
			>Audio</button
		>
		<button
			class="rounded-full border border-[#2A3241] bg-transparent px-4 py-1.5 text-sm font-medium text-gray-300 transition-colors duration-150 hover:bg-[#1E2430]"
			>Video</button
		>
		<button
			class="rounded-full border border-[#2A3241] bg-transparent px-4 py-1.5 text-sm font-medium text-gray-300 transition-colors duration-150 hover:bg-[#1E2430]"
			>Docs</button
		>
		<button
			class="rounded-full border border-[#2A3241] bg-transparent px-4 py-1.5 text-sm font-medium text-gray-300 transition-colors duration-150 hover:bg-[#1E2430]"
			>Images</button
		>
	</div>

	<!-- Analytics Grid -->
	<div class="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
		<!-- Total Storage -->
		<div
			class="flex flex-col items-center justify-center rounded-2xl border border-[#2A3241] bg-[#151921] p-6"
		>
			<div class="relative mb-3 h-24 w-24">
				<svg class="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
					<path
						class="stroke-current text-[#151921]"
						d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
						fill="none"
						stroke-width="3"
					></path>
					<path
						class="text-container stroke-current"
						d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
						fill="none"
						stroke-dasharray="30, 100"
						stroke-width="3"
					></path>
				</svg>
				<div
					class="text-container absolute inset-0 flex items-center justify-center text-xl font-bold"
				>
					30%
				</div>
			</div>
			<h3 class="text-sm font-medium text-gray-400">Total Storage</h3>
		</div>

		<!-- Audio Vault -->
		<div class="rounded-2xl border border-[#2A3241] bg-[#151921] p-6">
			<div class="mb-4 flex items-start justify-between">
				<Music class="text-[#4edea3]" size={24} />
				<span class="text-xs font-medium text-gray-400">1.2 GB</span>
			</div>
			<h3 class="mb-1 text-2xl font-bold text-white">Audio Vault</h3>
			<p class="text-sm text-gray-400">342 Tracks</p>
		</div>

		<!-- Visual Media -->
		<div class="rounded-2xl border border-[#2A3241] bg-[#151921] p-6">
			<div class="mb-4 flex items-start justify-between">
				<Video class="text-[#56d9d8]" size={24} />
				<span class="text-xs font-medium text-gray-400">800 MB</span>
			</div>
			<h3 class="mb-1 text-2xl font-bold text-white">Visual Media</h3>
			<p class="text-sm text-gray-400">45 Videos / 120 Photos</p>
		</div>

		<!-- Documents -->
		<div class="rounded-2xl border border-[#2A3241] bg-[#151921] p-6">
			<div class="mb-4 flex items-start justify-between">
				<FileText class="text-primary" size={24} />
				<span class="text-xs font-medium text-gray-400">400 MB</span>
			</div>
			<h3 class="mb-1 text-2xl font-bold text-white">Documents</h3>
			<p class="text-sm text-gray-400">89 Files</p>
		</div>
	</div>

	<!-- Upload Zone -->
	<div
		class="group mb-8 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#2A3241] bg-[#10131a] p-8 transition-colors duration-150 hover:bg-[#151921]"
	>
		<UploadCloud
			class="group-hover:text-container mb-3 text-[#2A3241] transition-colors duration-150"
			size={48}
		/>
		<p class="mb-1 text-base text-white">Drag and drop files here</p>
		<p class="text-xs text-gray-400">or click to browse from your computer</p>
	</div>

	<!-- Recent Files Table -->
	<div class="overflow-hidden rounded-2xl border border-[#2A3241] bg-[#151921]">
		<div class="border-b border-[#2A3241] p-4">
			<h2 class="text-lg font-semibold text-white">Recent Files</h2>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full border-collapse text-left">
				<thead>
					<tr class="border-b border-[#2A3241] bg-[#0B0E14]">
						<th class="p-4 text-xs font-medium tracking-wider text-gray-400 uppercase">Name</th>
						<th class="p-4 text-xs font-medium tracking-wider text-gray-400 uppercase">Type</th>
						<th
							class="p-4 text-right text-xs font-medium tracking-wider text-gray-400 uppercase tabular-nums"
							>Size</th
						>
						<th
							class="p-4 text-right text-xs font-medium tracking-wider text-gray-400 uppercase tabular-nums"
							>Date</th
						>
						<th class="p-4 text-center text-xs font-medium tracking-wider text-gray-400 uppercase"
							>Actions</th
						>
					</tr>
				</thead>
				<tbody class="text-sm text-gray-300">
					<!-- Row 1: Audio -->
					<tr
						class="group border-b border-[#2A3241] transition-colors duration-150 hover:bg-[#1E2430]"
					>
						<td class="flex items-center gap-3 p-4">
							<FileAudio class="text-[#4edea3]" size={20} />
							<span class="text-white">Magnetic - ILLIT.m4a</span>
						</td>
						<td class="p-4 text-gray-400">Audio</td>
						<td class="p-4 text-right text-xs text-gray-400 tabular-nums">8.4 MB</td>
						<td class="p-4 text-right text-xs text-gray-400 tabular-nums">Oct 24, 2024</td>
						<td class="p-4 text-center">
							<div
								class="flex items-center justify-center gap-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
							>
								<button class="text-primary-container hover:text-[#FF8264]"
									><Play size={18} /></button
								>
								<button class="text-gray-400 hover:text-white"><Download size={18} /></button>
								<button class="text-error hover:text-error-container"><Trash2 size={18} /></button>
							</div>
						</td>
					</tr>
					<!-- Row 2: Doc -->
					<tr
						class="group border-b border-[#2A3241] transition-colors duration-150 hover:bg-[#1E2430]"
					>
						<td class="flex items-center gap-3 p-4">
							<FileText class="text-primary" size={20} />
							<span class="text-white">Q3_Financial_Report.pdf</span>
						</td>
						<td class="p-4 text-gray-400">Document</td>
						<td class="p-4 text-right text-xs text-gray-400 tabular-nums">2.1 MB</td>
						<td class="p-4 text-right text-xs text-gray-400 tabular-nums">Oct 23, 2024</td>
						<td class="p-4 text-center">
							<div
								class="flex items-center justify-center gap-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
							>
								<button class="text-container hover:text-[#FF8264]"><Eye size={18} /></button>
								<button class="text-gray-400 hover:text-white"><Download size={18} /></button>
								<button class="text-error hover:text-error-container"><Trash2 size={18} /></button>
							</div>
						</td>
					</tr>
					<!-- Row 3: Video -->
					<tr
						class="group border-b border-[#2A3241] transition-colors duration-150 hover:bg-[#1E2430]"
					>
						<td class="flex items-center gap-3 p-4">
							<FileVideo class="text-[#56d9d8]" size={20} />
							<span class="text-white">Project_Alpha_Demo.mp4</span>
						</td>
						<td class="p-4 text-gray-400">Video</td>
						<td class="p-4 text-right text-xs text-gray-400 tabular-nums">145.2 MB</td>
						<td class="p-4 text-right text-xs text-gray-400 tabular-nums">Oct 21, 2024</td>
						<td class="p-4 text-center">
							<div
								class="flex items-center justify-center gap-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
							>
								<button class="text-container hover:text-[#FF8264]"><Play size={18} /></button>
								<button class="text-gray-400 hover:text-white"><Download size={18} /></button>
								<button class="text-error hover:text-error-container"><Trash2 size={18} /></button>
							</div>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</div>
