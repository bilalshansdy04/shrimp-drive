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
		Eye,
		Image as ImageIcon,
		File
	} from 'lucide-svelte';
	import { formatBytes, formatDate } from '$lib/utils';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	let filter = $state('all');

	let filteredFiles = $derived(
		filter === 'all'
			? data.recentFiles
			: data.recentFiles.filter((f) => f.fileType === filter)
	);

	let percentage = $derived(
		data.user ? Math.min(100, (data.user.storageUsed / data.user.storageLimit) * 100) : 0
	);

	let circumference = 2 * Math.PI * 15.9155;
	let dashoffset = $derived(circumference - (percentage / 100) * circumference);

	function getFileIcon(type: string) {
		switch (type) {
			case 'audio': return FileAudio;
			case 'video': return FileVideo;
			case 'image': return ImageIcon;
			case 'document': return FileText;
			default: return File;
		}
	}

	function getIconColor(type: string) {
		switch (type) {
			case 'audio': return 'text-[#4edea3]';
			case 'video': return 'text-[#56d9d8]';
			case 'image': return 'text-[#FFD166]';
			case 'document': return 'text-[#FF6B4A]';
			default: return 'text-gray-400';
		}
	}
</script>

<div class="mx-auto max-w-7xl">
	<!-- Filters -->
	<div class="mb-8 flex gap-3 overflow-x-auto pb-2">
		<button
			class="rounded-full border border-[#2A3241] px-4 py-1.5 text-sm font-medium transition-colors duration-150 {filter === 'all' ? 'bg-[#1E2430] text-[#FF6B4A]' : 'bg-transparent text-gray-300 hover:bg-[#1E2430]'}"
			onclick={() => filter = 'all'}
			>All</button
		>
		<button
			class="rounded-full border border-[#2A3241] px-4 py-1.5 text-sm font-medium transition-colors duration-150 {filter === 'audio' ? 'bg-[#1E2430] text-[#FF6B4A]' : 'bg-transparent text-gray-300 hover:bg-[#1E2430]'}"
			onclick={() => filter = 'audio'}
			>Audio</button
		>
		<button
			class="rounded-full border border-[#2A3241] px-4 py-1.5 text-sm font-medium transition-colors duration-150 {filter === 'video' ? 'bg-[#1E2430] text-[#FF6B4A]' : 'bg-transparent text-gray-300 hover:bg-[#1E2430]'}"
			onclick={() => filter = 'video'}
			>Video</button
		>
		<button
			class="rounded-full border border-[#2A3241] px-4 py-1.5 text-sm font-medium transition-colors duration-150 {filter === 'document' ? 'bg-[#1E2430] text-[#FF6B4A]' : 'bg-transparent text-gray-300 hover:bg-[#1E2430]'}"
			onclick={() => filter = 'document'}
			>Docs</button
		>
		<button
			class="rounded-full border border-[#2A3241] px-4 py-1.5 text-sm font-medium transition-colors duration-150 {filter === 'image' ? 'bg-[#1E2430] text-[#FF6B4A]' : 'bg-transparent text-gray-300 hover:bg-[#1E2430]'}"
			onclick={() => filter = 'image'}
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
						class="stroke-current text-[#1E2430]"
						d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
						fill="none"
						stroke-width="3"
					></path>
					<path
						class="text-[#FF6B4A] stroke-current transition-all duration-1000 ease-out"
						d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
						fill="none"
						stroke-dasharray={circumference}
						stroke-dashoffset={dashoffset}
						stroke-width="3"
					></path>
				</svg>
				<div
					class="absolute inset-0 flex items-center justify-center text-xl font-bold text-white"
				>
					{Math.round(percentage)}%
				</div>
			</div>
			<h3 class="text-sm font-medium text-gray-400">Total Storage</h3>
			<p class="text-xs text-gray-500 mt-1">{formatBytes(data.user?.storageUsed || 0)} / {formatBytes(data.user?.storageLimit || 0)}</p>
		</div>

		<!-- Audio Vault -->
		<div class="rounded-2xl border border-[#2A3241] bg-[#151921] p-6">
			<div class="mb-4 flex items-start justify-between">
				<Music class="text-[#4edea3]" size={24} />
				<span class="text-xs font-medium text-gray-400">{formatBytes(data.stats.audio.size)}</span>
			</div>
			<h3 class="mb-1 text-2xl font-bold text-white">Audio Vault</h3>
			<p class="text-sm text-gray-400">{data.stats.audio.count} Tracks</p>
		</div>

		<!-- Visual Media -->
		<div class="rounded-2xl border border-[#2A3241] bg-[#151921] p-6">
			<div class="mb-4 flex items-start justify-between">
				<Video class="text-[#56d9d8]" size={24} />
				<span class="text-xs font-medium text-gray-400">{formatBytes(data.stats.video.size + data.stats.image.size)}</span>
			</div>
			<h3 class="mb-1 text-2xl font-bold text-white">Visual Media</h3>
			<p class="text-sm text-gray-400">{data.stats.video.count} Videos / {data.stats.image.count} Photos</p>
		</div>

		<!-- Documents -->
		<div class="rounded-2xl border border-[#2A3241] bg-[#151921] p-6">
			<div class="mb-4 flex items-start justify-between">
				<FileText class="text-[#FF6B4A]" size={24} />
				<span class="text-xs font-medium text-gray-400">{formatBytes(data.stats.document.size)}</span>
			</div>
			<h3 class="mb-1 text-2xl font-bold text-white">Documents</h3>
			<p class="text-sm text-gray-400">{data.stats.document.count} Files</p>
		</div>
	</div>

	<!-- Upload Zone -->
	<div
		class="group mb-8 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#2A3241] bg-[#10131a] p-8 transition-colors duration-150 hover:bg-[#151921] hover:border-[#FF6B4A]"
	>
		<UploadCloud
			class="mb-3 text-[#2A3241] transition-colors duration-150 group-hover:text-[#FF6B4A]"
			size={48}
		/>
		<p class="mb-1 text-base font-medium text-white">Drag and drop files here</p>
		<p class="text-xs text-gray-400">or click to browse from your computer</p>
	</div>

	<!-- Recent Files Table -->
	<div class="overflow-hidden rounded-2xl border border-[#2A3241] bg-[#151921]">
		<div class="border-b border-[#2A3241] p-4 flex justify-between items-center">
			<h2 class="text-lg font-semibold text-white">Recent Files</h2>
			{#if filter !== 'all'}
				<span class="text-xs text-gray-400 capitalize">{filter} only</span>
			{/if}
		</div>
		
		{#if filteredFiles.length === 0}
			<div class="flex flex-col items-center justify-center p-12 text-center">
				<div class="mb-4 rounded-full bg-[#1E2430] p-4">
					<UploadCloud class="text-gray-400" size={32} />
				</div>
				<h3 class="mb-2 text-lg font-medium text-white">Belum ada file yang diunggah</h3>
				<p class="text-sm text-gray-400 max-w-sm">Mulai seret file ke Dropzone di atas untuk menyimpan file Anda secara aman di Shrimp Drive!</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full border-collapse text-left">
					<thead>
						<tr class="border-b border-[#2A3241] bg-[#0B0E14]">
							<th class="p-4 text-xs font-medium tracking-wider text-gray-400 uppercase">Name</th>
							<th class="p-4 text-xs font-medium tracking-wider text-gray-400 uppercase">Type</th>
							<th class="p-4 text-right text-xs font-medium tracking-wider text-gray-400 uppercase tabular-nums">Size</th>
							<th class="p-4 text-right text-xs font-medium tracking-wider text-gray-400 uppercase tabular-nums">Date</th>
							<th class="p-4 text-center text-xs font-medium tracking-wider text-gray-400 uppercase">Actions</th>
						</tr>
					</thead>
					<tbody class="text-sm text-gray-300">
						{#each filteredFiles as file}
							{@const Icon = getFileIcon(file.fileType)}
							<tr class="group border-b border-[#2A3241] transition-colors duration-150 hover:bg-[#1E2430] last:border-0">
								<td class="flex items-center gap-3 p-4">
									<Icon class={getIconColor(file.fileType)} size={20} />
									<span class="text-white truncate max-w-[200px] sm:max-w-[300px]" title={file.fileName}>{file.fileName}</span>
								</td>
								<td class="p-4 text-gray-400 capitalize">{file.fileType}</td>
								<td class="p-4 text-right text-xs text-gray-400 tabular-nums">{formatBytes(file.fileSize)}</td>
								<td class="p-4 text-right text-xs text-gray-400 tabular-nums">{formatDate(file.createdAt)}</td>
								<td class="p-4 text-center">
									<div class="flex items-center justify-center gap-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
										{#if file.fileType === 'audio' || file.fileType === 'video'}
											<button class="text-[#FF6B4A] hover:text-[#FF8264]" title="Play"><Play size={18} /></button>
										{:else}
											<button class="text-[#FF6B4A] hover:text-[#FF8264]" title="View"><Eye size={18} /></button>
										{/if}
										<button class="text-gray-400 hover:text-white" title="Download"><Download size={18} /></button>
										<button class="text-[#EF4444] hover:text-[#F87171]" title="Delete"><Trash2 size={18} /></button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
