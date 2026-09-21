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
	import { askConfirm } from '$lib/client/confirm.svelte';
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { media, downloadFileClient } from '$lib/client/mediaState.svelte';
	import { confirmDelete } from '$lib/utils/deleteConfirm';

	let { data } = $props<{ data: PageData }>();

	let filter = $state('all');
	let isDragging = $state(false);

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		if (e.dataTransfer?.files?.length) {
			const globalInput = document.getElementById('global-file-upload') as HTMLInputElement;
			if (globalInput) {
				globalInput.files = e.dataTransfer.files;
				globalInput.dispatchEvent(new Event('change', { bubbles: true }));
			}
		}
	}

	function triggerUploadClick() {
		const globalInput = document.getElementById('global-file-upload') as HTMLInputElement;
		if (globalInput) {
			globalInput.click();
		}
	}

	let filteredFiles = $derived(
		filter === 'all' ? data.recentFiles : data.recentFiles.filter((f: any) => f.fileType === filter)
	);

	let percentage = $derived(
		data.user ? data.user.storageLimit === -1 ? 0 : Math.min(100, (data.user.storageUsed / data.user.storageLimit) * 100) : 0
	);

	let circumference = 2 * Math.PI * 15.9155;
	let dashoffset = $derived(circumference - (percentage / 100) * circumference);

	function getFileIcon(type: string) {
		switch (type) {
			case 'audio':
				return FileAudio;
			case 'video':
				return FileVideo;
			case 'image':
				return ImageIcon;
			case 'document':
				return FileText;
			default:
				return File;
		}
	}

	function getIconColor(type: string) {
		switch (type) {
			case 'audio':
				return 'text-[#4edea3]';
			case 'video':
				return 'text-[#56d9d8]';
			case 'image':
				return 'text-[#FFD166]';
			case 'document':
				return 'text-[#FF6B4A]';
			default:
				return 'text-gray-400';
		}
	}
</script>

<div class="mx-auto max-w-7xl">
	<!-- Filters -->
	<div class="flex gap-3 mb-8 pb-2 overflow-x-auto">
		<button
			class="rounded-full border border-[#2A3241] px-4 py-1.5 text-sm font-medium transition-colors duration-150 {filter ===
			'all'
				? 'bg-[#1E2430] text-[#FF6B4A]'
				: 'bg-transparent text-gray-300 hover:bg-[#1E2430]'}"
			onclick={() => (filter = 'all')}>All</button
		>
		<button
			class="rounded-full border border-[#2A3241] px-4 py-1.5 text-sm font-medium transition-colors duration-150 {filter ===
			'audio'
				? 'bg-[#1E2430] text-[#FF6B4A]'
				: 'bg-transparent text-gray-300 hover:bg-[#1E2430]'}"
			onclick={() => (filter = 'audio')}>Audio</button
		>
		<button
			class="rounded-full border border-[#2A3241] px-4 py-1.5 text-sm font-medium transition-colors duration-150 {filter ===
			'video'
				? 'bg-[#1E2430] text-[#FF6B4A]'
				: 'bg-transparent text-gray-300 hover:bg-[#1E2430]'}"
			onclick={() => (filter = 'video')}>Video</button
		>
		<button
			class="rounded-full border border-[#2A3241] px-4 py-1.5 text-sm font-medium transition-colors duration-150 {filter ===
			'document'
				? 'bg-[#1E2430] text-[#FF6B4A]'
				: 'bg-transparent text-gray-300 hover:bg-[#1E2430]'}"
			onclick={() => (filter = 'document')}>Docs</button
		>
		<button
			class="rounded-full border border-[#2A3241] px-4 py-1.5 text-sm font-medium transition-colors duration-150 {filter ===
			'image'
				? 'bg-[#1E2430] text-[#FF6B4A]'
				: 'bg-transparent text-gray-300 hover:bg-[#1E2430]'}"
			onclick={() => (filter = 'image')}>Images</button
		>
	</div>

	<!-- Analytics Grid -->
	<div class="gap-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-8">
		<!-- Total Storage -->
		<div
			class="flex flex-col justify-center items-center bg-[#151921] p-6 border border-[#2A3241] rounded-2xl"
		>
			<div class="relative mb-3 w-24 h-24">
				<svg class="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
					<path
						class="stroke-current text-[#1E2430]"
						d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
						fill="none"
						stroke-width="3"
					></path>
					<path
						class="stroke-current text-[#FF6B4A] transition-all duration-1000 ease-out"
						d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
						fill="none"
						stroke-dasharray={circumference}
						stroke-dashoffset={dashoffset}
						stroke-width="3"
					></path>
				</svg>
				<div class="absolute inset-0 flex justify-center items-center font-bold text-white text-xl">
					{Math.round(percentage)}%
				</div>
			</div>
			<h3 class="font-medium text-gray-400 text-sm">Total Storage</h3>
			<p class="mt-1 text-gray-500 text-xs">
				{formatBytes(data.user?.storageUsed || 0)} / {data.user?.storageLimit === -1 ? 'Unlimited' : formatBytes(data.user?.storageLimit || 0)}
			</p>
		</div>

		<!-- Audio Vault -->
		<div class="bg-[#151921] p-6 border border-[#2A3241] rounded-2xl">
			<div class="flex justify-between items-start mb-4">
				<Music class="text-[#4edea3]" size={24} />
				<span class="font-medium text-gray-400 text-xs">{formatBytes(data.stats.audio.size)}</span>
			</div>
			<h3 class="mb-1 font-bold text-white text-2xl">Audio Vault</h3>
			<p class="text-gray-400 text-sm">{data.stats.audio.count} Tracks</p>
		</div>

		<!-- Visual Media -->
		<div class="bg-[#151921] p-6 border border-[#2A3241] rounded-2xl">
			<div class="flex justify-between items-start mb-4">
				<Video class="text-[#56d9d8]" size={24} />
				<span class="font-medium text-gray-400 text-xs"
					>{formatBytes(data.stats.video.size + data.stats.image.size)}</span
				>
			</div>
			<h3 class="mb-1 font-bold text-white text-2xl">Visual Media</h3>
			<p class="text-gray-400 text-sm">
				{data.stats.video.count} Videos / {data.stats.image.count} Photos
			</p>
		</div>

		<!-- Documents -->
		<div class="bg-[#151921] p-6 border border-[#2A3241] rounded-2xl">
			<div class="flex justify-between items-start mb-4">
				<FileText class="text-[#FF6B4A]" size={24} />
				<span class="font-medium text-gray-400 text-xs"
					>{formatBytes(data.stats.document.size)}</span
				>
			</div>
			<h3 class="mb-1 font-bold text-white text-2xl">Documents</h3>
			<p class="text-gray-400 text-sm">{data.stats.document.count} Files</p>
		</div>
	</div>

	<!-- Upload Zone -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		role="region"
		class="group mb-8 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#2A3241] bg-[#10131a] p-8 transition-colors duration-150 hover:border-[#FF6B4A] hover:bg-[#151921] {isDragging
			? 'border-[#FF6B4A] bg-[#151921]'
			: ''}"
		ondrop={handleDrop}
		ondragover={(e) => {
			e.preventDefault();
			isDragging = true;
		}}
		ondragleave={(e) => {
			e.preventDefault();
			isDragging = false;
		}}
		onclick={triggerUploadClick}
	>
		<UploadCloud
			class="mb-3 text-[#2A3241] group-hover:text-[#FF6B4A] transition-colors duration-150"
			size={48}
		/>
		<p class="mb-1 font-medium text-white text-base">Drag and drop files here</p>
		<p class="text-gray-400 text-xs">or click to browse from your computer</p>
	</div>

	<!-- Recent Files Table -->
	<div class="bg-[#151921] border border-[#2A3241] rounded-2xl overflow-hidden">
		<div class="flex justify-between items-center p-4 border-[#2A3241] border-b">
			<h2 class="font-semibold text-white text-lg">Recent Files</h2>
			{#if filter !== 'all'}
				<span class="text-gray-400 text-xs capitalize">{filter} only</span>
			{/if}
		</div>

		{#if filteredFiles.length === 0}
			<div class="flex flex-col justify-center items-center p-12 text-center">
				<div class="bg-[#1E2430] mb-4 p-4 rounded-full">
					<UploadCloud class="text-gray-400" size={32} />
				</div>
				<h3 class="mb-2 font-medium text-white text-lg">Belum ada file yang diunggah</h3>
				<p class="max-w-sm text-gray-400 text-sm">
					Mulai seret file ke Dropzone di atas untuk menyimpan file Anda secara aman di Shrimp
					Drive!
				</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-left border-collapse">
					<thead>
						<tr class="bg-[#0B0E14] border-[#2A3241] border-b">
							<th
								class="p-4 font-medium text-gray-400 text-xs uppercase tracking-wider whitespace-nowrap"
								>Name</th
							>
							<th
								class="p-4 font-medium text-gray-400 text-xs uppercase tracking-wider whitespace-nowrap"
								>Type</th
							>
							<th
								class="p-4 font-medium tabular-nums text-gray-400 text-xs text-right uppercase tracking-wider whitespace-nowrap"
								>Size</th
							>
							<th
								class="p-4 font-medium tabular-nums text-gray-400 text-xs text-right uppercase tracking-wider whitespace-nowrap"
								>Date</th
							>
							<th
								class="p-4 font-medium text-gray-400 text-xs text-center uppercase tracking-wider whitespace-nowrap"
								>Actions</th
							>
						</tr>
					</thead>
					<tbody class="text-gray-300 text-sm">
						{#each filteredFiles as file}
							{@const Icon = getFileIcon(file.fileType)}
							<tr
								class="group hover:bg-[#1E2430] border-[#2A3241] last:border-0 border-b transition-colors duration-150"
							>
								<td class="flex items-center gap-3 p-4 whitespace-nowrap">
									<Icon class={getIconColor(file.fileType)} size={20} />
									<span
										class="max-w-[200px] sm:max-w-[300px] text-white truncate"
										title={file.fileName}>{file.fileName}</span
									>
								</td>
								<td class="p-4 text-gray-400 capitalize whitespace-nowrap">{file.fileType}</td>
								<td class="p-4 tabular-nums text-gray-400 text-xs text-right whitespace-nowrap"
									>{formatBytes(file.fileSize)}</td
								>
								<td class="p-4 tabular-nums text-gray-400 text-xs text-right whitespace-nowrap"
									>{formatDate(file.createdAt)}</td
								>
								<td class="p-4 text-center whitespace-nowrap">
									<div
										class="flex justify-center items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
									>
										{#if file.fileType === 'audio'}
											<button
												onclick={() => media.playTrack(0, [file])}
												class="text-[#FF6B4A] hover:text-[#FF8264]"
												title="Play"><Play size={18} /></button
											>
										{:else if file.fileType === 'video'}
											<a
												href="/video/{file.id}"
												class="text-[#FF6B4A] hover:text-[#FF8264]"
												title="Play"><Play size={18} /></a
											>
										{:else if file.fileType === 'photo' || file.fileType === 'image'}
											<a
												href="/photo?view={file.id}"
												class="text-[#FF6B4A] hover:text-[#FF8264]"
												title="View"><Eye size={18} /></a
											>
										{:else}
											<button
												onclick={() => downloadFileClient(file)}
												class="text-[#FF6B4A] hover:text-[#FF8264]"
												title="View"><Eye size={18} /></button
											>
										{/if}
										<button
											onclick={() => downloadFileClient(file)}
											class="flex justify-center items-center text-gray-400 hover:text-white"
											title="Download"><Download size={18} /></button
										>
										<button
											onclick={async () => {
												if (await askConfirm('Delete this file? This cannot be undone.')) {
													const tid = toast.loading('Deleting file...');
													const res = await fetch('/api/bulk/delete', {
														method: 'POST',
														headers: { 'Content-Type': 'application/json' },
														body: JSON.stringify({ files: [file.id], folders: [] })
													});
													if (res.ok) {
														toast.success('File deleted successfully', { id: tid });
														await invalidateAll();
													} else {
														toast.error('Failed to delete file', { id: tid });
													}
												}
											}}
											class="text-[#EF4444] hover:text-[#F87171]"
											title="Delete"><Trash2 size={18} /></button
										>
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
