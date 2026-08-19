<script lang="ts">
	import { Film, Play, Clock, List, Grid2x2, Check, Download, X } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
	const videoFiles = $derived(data.videoFiles);

	let viewMode = $state<'list' | 'grid'>('grid');
	let selectionMode = $state(false);
	let selectedIds = $state<string[]>([]);

	function formatTime(seconds: number | null) {
		if (!seconds || isNaN(seconds)) return '0:00';
		const m = Math.floor(seconds / 60);
		const s = Math.floor(seconds % 60);
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	function formatDate(date: Date | string | null) {
		if (!date) return 'Unknown date';
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatSize(bytes: number) {
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

	function toggleSelection(id: string) {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter((i) => i !== id);
		} else {
			selectedIds = [...selectedIds, id];
		}
	}

	function toggleSelectionMode() {
		selectionMode = !selectionMode;
		if (!selectionMode) selectedIds = [];
	}

	function downloadFile(id: string) {
		const link = document.createElement('a');
		link.href = `/api/files/${id}/download`;
		link.download = '';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	function downloadSelected() {
		selectedIds.forEach((id, index) => {
			setTimeout(() => {
				downloadFile(id);
			}, index * 500);
		});
		toggleSelectionMode();
	}

	function handleItemClick(id: string) {
		if (selectionMode) {
			toggleSelection(id);
		} else {
			goto(`/video/${id}`);
		}
	}

	function longpress(
		node: HTMLElement,
		{ duration, callback }: { duration: number; callback: () => void }
	) {
		let timer: ReturnType<typeof setTimeout>;

		const handleMousedown = () => {
			timer = setTimeout(() => {
				callback();
			}, duration);
		};

		const handleMouseup = () => {
			clearTimeout(timer);
		};

		node.addEventListener('mousedown', handleMousedown);
		node.addEventListener('mouseup', handleMouseup);
		node.addEventListener('touchstart', handleMousedown);
		node.addEventListener('touchend', handleMouseup);
		node.addEventListener('touchcancel', handleMouseup);

		return {
			destroy() {
				node.removeEventListener('mousedown', handleMousedown);
				node.removeEventListener('mouseup', handleMouseup);
				node.removeEventListener('touchstart', handleMousedown);
				node.removeEventListener('touchcancel', handleMouseup);
			}
		};
	}
</script>

<div class="flex h-full flex-col overflow-y-auto p-6">
	<div class="mb-8">
		<div class="flex items-center justify-between">
			<h1 class="text-3xl font-bold text-white">Video Hub</h1>
			{#if videoFiles.length > 0}
				<div class="flex items-center gap-2">
					<button
						onclick={toggleSelectionMode}
						class="flex items-center gap-2 rounded-lg border {selectionMode ? 'border-[#FF6B4A] bg-[#FF6B4A]/10 text-[#FF6B4A]' : 'border-[#2A3241] bg-[#151921] text-gray-400 hover:bg-[#1E2430] hover:text-white'} px-3 py-2 text-sm font-medium transition-colors"
						title={selectionMode ? 'Cancel Selection' : 'Select Items'}
					>
						<Check size={16} /> <span class="hidden sm:inline">{selectionMode ? 'Cancel' : 'Select'}</span>
					</button>
					<button
						onclick={() => (viewMode = viewMode === 'list' ? 'grid' : 'list')}
						class="flex items-center justify-center rounded-lg border border-[#2A3241] bg-[#151921] p-2 text-gray-400 transition-colors hover:bg-[#1E2430] hover:text-white"
						title="Toggle View"
					>
						{#if viewMode === 'list'}
							<List size={18} />
						{:else}
							<Grid2x2 size={18} />
						{/if}
					</button>
				</div>
			{/if}
		</div>
		<p class="mt-2 text-gray-400">Watch and manage your uploaded videos</p>
	</div>

	{#if videoFiles.length === 0}
		<div
			class="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-[#2A3241] p-12 text-center"
		>
			<div class="mb-4 rounded-full bg-[#151921] p-4 text-gray-400">
				<Film size={48} />
			</div>
			<h3 class="mb-2 text-xl font-bold text-white">No videos yet</h3>
			<p class="max-w-sm text-gray-400">
				Upload your first video to start building your personal cinema.
			</p>
		</div>
	{:else}
		{#if selectionMode && viewMode === 'grid'}
			<div
				class="mb-4 flex items-center justify-between rounded-xl border border-[#FF6B4A] bg-[#FF6B4A]/10 px-4 py-3"
			>
				<div class="flex items-center gap-4 text-[#FF6B4A]">
					<button onclick={toggleSelectionMode}><X size={20} /></button>
					<span class="font-medium">{selectedIds.length} Selected</span>
				</div>
				<div class="flex items-center gap-3">
					<button
						onclick={() => (selectedIds = videoFiles.map((f) => f.id))}
						class="text-sm font-medium text-[#FF6B4A] hover:underline">Select All</button
					>
					<button
						onclick={downloadSelected}
						class="flex items-center gap-1 rounded bg-[#FF6B4A] px-3 py-1.5 text-sm font-medium text-black disabled:opacity-50"
						disabled={selectedIds.length === 0}
					>
						<Download size={16} /> <span class="hidden sm:inline">Download</span>
					</button>
				</div>
			</div>
		{/if}

		{#if viewMode === 'grid'}
			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each videoFiles as video}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border {selectionMode &&
						selectedIds.includes(video.id)
							? 'border-[#FF6B4A] ring-2 ring-[#FF6B4A]'
							: 'border-[#2A3241]'} bg-[#151921] transition-all hover:-translate-y-1 hover:shadow-lg"
						use:longpress={{
							duration: 500,
							callback: () => {
								if (!selectionMode) {
									selectionMode = true;
									selectedIds = [video.id];
								}
							}
						}}
						onclick={() => handleItemClick(video.id)}
					>
						{#if selectionMode}
							<div
								class="absolute top-3 right-3 z-20 flex h-5 w-5 items-center justify-center rounded-full border {selectedIds.includes(
									video.id
								)
									? 'border-[#FF6B4A] bg-[#FF6B4A]'
									: 'border-white bg-black/50'}"
							>
								{#if selectedIds.includes(video.id)}
									<Check size={14} class="text-black" />
								{/if}
							</div>
						{/if}
						<div class="relative aspect-video w-full overflow-hidden bg-[#0B0E14]">
							{#if video.thumbnailUrl}
								<img
									src={video.thumbnailUrl}
									alt={video.fileName}
									class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
								/>
							{:else}
								<div class="flex h-full w-full items-center justify-center text-gray-500">
									<Film size={32} />
								</div>
							{/if}

							{#if !selectionMode}
								<div
									class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
								>
									<div
										class="bg-primary-container scale-75 transform rounded-full p-3 text-black transition-transform group-hover:scale-100"
									>
										<Play size={24} fill="currentColor" class="ml-1" />
									</div>
								</div>
							{/if}
							<div
								class="absolute right-2 bottom-2 rounded bg-black/80 px-2 py-1 text-xs font-medium text-white shadow backdrop-blur-sm"
							>
								{formatTime(video.duration)}
							</div>
						</div>
						<div class="p-4 flex items-start justify-between">
							<div class="min-w-0 flex-1">
								<h3
									class="group-hover:text-primary-container mb-1 truncate text-base font-semibold text-white transition-colors"
									title={video.title || video.fileName}
								>
									{video.title || video.fileName}
								</h3>
								<div class="flex items-center gap-3 text-xs text-gray-400">
									<span>{formatDate(video.createdAt)}</span>
									<span class="h-1 w-1 rounded-full bg-gray-600"></span>
									<span>{formatSize(video.fileSize)}</span>
								</div>
							</div>
							{#if !selectionMode}
								<button
									onclick={(e) => {
										e.stopPropagation();
										downloadFile(video.id);
									}}
									class="ml-3 shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-[#2A3241] hover:text-white"
									title="Download"
								>
									<Download size={18} />
								</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="overflow-hidden rounded-2xl border border-[#2A3241] bg-[#151921] shadow-lg">
				<div class="w-full">
					<table class="w-full table-fixed border-collapse text-left">
						<thead>
							<tr
								class="border-b {selectionMode
									? 'border-[#FF6B4A] bg-[#FF6B4A]/10'
									: 'border-[#2A3241] bg-[#10131a]'}"
							>
								<th
									class="w-10 px-2 py-3 text-center text-xs font-medium sm:w-12 sm:px-4 {selectionMode
										? 'text-[#FF6B4A]'
										: 'text-gray-400'}"
								>
									{#if selectionMode}
										<button onclick={toggleSelectionMode}><X size={20} class="mx-auto" /></button>
									{:else}
										#
									{/if}
								</th>
								<th class="px-2 py-3 text-xs font-medium text-gray-400 sm:px-4">
									{#if selectionMode}
										<div class="flex flex-1 items-center justify-start text-[#FF6B4A]">
											<div class="flex items-center gap-3 sm:gap-4">
												<span class="text-sm font-medium sm:text-base"
													>{selectedIds.length} Selected</span
												>
												<button
													onclick={() => (selectedIds = videoFiles.map((f) => f.id))}
													class="text-sm font-medium hover:underline">Select All</button
												>
											</div>
										</div>
									{:else}
										Name
									{/if}
								</th>
								<th
									class="hidden w-24 px-4 py-3 text-right text-xs font-medium text-gray-400 sm:table-cell"
								>
									{#if !selectionMode}Duration{/if}
								</th>
								<th
									class="hidden w-28 px-4 py-3 text-right text-xs font-medium text-gray-400 md:table-cell"
								>
									{#if !selectionMode}Size{/if}
								</th>
								<th
									class="hidden w-32 px-4 py-3 text-right text-xs font-medium text-gray-400 lg:table-cell"
								>
									{#if !selectionMode}Added{/if}
								</th>
								<th class="w-12 px-2 py-3 text-center sm:w-16">
									{#if selectionMode}
										<button
											onclick={downloadSelected}
											class="mx-auto flex h-7 w-7 items-center justify-center rounded bg-[#FF6B4A] text-black transition-opacity hover:opacity-90 disabled:opacity-50 sm:h-8 sm:w-8"
											disabled={selectedIds.length === 0}
											title="Download Selected"
										>
											<Download size={16} />
										</button>
									{/if}
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-[#2A3241]/50 text-sm text-white">
							{#each videoFiles as video, index}
								<tr
									class="group cursor-pointer transition-colors hover:bg-[#1E2430] {selectionMode &&
									selectedIds.includes(video.id)
										? 'bg-[#FF6B4A]/10'
										: ''}"
									use:longpress={{
										duration: 500,
										callback: () => {
											if (!selectionMode) {
												selectionMode = true;
												selectedIds = [video.id];
											}
										}
									}}
									onclick={() => handleItemClick(video.id)}
								>
									<td class="px-2 py-3 text-center text-xs text-gray-400 sm:px-4">
										{#if selectionMode}
											<div
												class="h-4 w-4 rounded border {selectedIds.includes(video.id)
													? 'border-[#FF6B4A] bg-[#FF6B4A]'
													: 'border-[#2A3241]'} mx-auto flex items-center justify-center"
											>
												{#if selectedIds.includes(video.id)}
													<Check size={12} class="text-black" />
												{/if}
											</div>
										{:else}
											<span class="text-xs text-gray-500 group-hover:hidden">{index + 1}</span>
											<Play
												size={14}
												class="mx-auto hidden text-gray-400 group-hover:block group-hover:text-white"
											/>
										{/if}
									</td>
									<td class="px-2 py-3 sm:px-4">
										<div class="flex items-center gap-3">
											<div
												class="flex h-10 w-16 shrink-0 items-center justify-center overflow-hidden rounded bg-[#0B0E14]"
											>
												{#if video.thumbnailUrl}
													<img
														class="h-full w-full object-cover"
														alt="Thumbnail"
														src={video.thumbnailUrl}
													/>
												{:else}
													<Film size={16} class="text-gray-500" />
												{/if}
											</div>
											<span
												class="max-w-[150px] truncate font-medium text-gray-300 transition-colors group-hover:text-white sm:max-w-xs"
												>{video.title || video.fileName}</span
											>
										</div>
									</td>
									<td
										class="hidden px-4 py-3 text-right text-xs text-gray-400 tabular-nums sm:table-cell"
										>{formatTime(video.duration)}</td
									>
									<td
										class="hidden px-4 py-3 text-right text-xs text-gray-400 tabular-nums md:table-cell"
										>{formatSize(video.fileSize)}</td
									>
									<td class="hidden px-4 py-3 text-right text-xs text-gray-400 lg:table-cell"
										>{formatDate(video.createdAt)}</td
									>
									<td class="px-2 py-3 text-center">
										<button
											onclick={(e) => {
												e.stopPropagation();
												downloadFile(video.id);
											}}
											class="text-gray-400 opacity-100 transition-opacity group-hover:opacity-100 hover:text-[#FF6B4A] sm:opacity-0"
											title="Download"><Download size={18} /></button
										>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	{/if}
</div>
