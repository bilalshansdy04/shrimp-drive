<script lang="ts">
	import defaultMusicCover from '$lib/assets/default-music.webp';
	import {
		Filter,
		List,
		Activity,
		Play,
		Pause,
		SlidersHorizontal,
		MoreVertical,
		Music,
		Maximize2,
		Heart,
		Shuffle,
		SkipBack,
		SkipForward,
		Repeat,
		ListMusic,
		Volume2,
		Mic2,
		ArrowUpDown,
		Check,
		Download,
		X
	} from 'lucide-svelte';
	import type { PageData } from './$types';
	import { media } from '$lib/client/mediaState.svelte';
	import LyricsPanel from '$lib/components/music/LyricsPanel.svelte';

	let { data } = $props<{ data: PageData }>();

	let showLyrics = $state(false);
	let showSortMenu = $state(false);
	let viewMode = $state<'list' | 'grid'>('list');
	let sortBy = $state<'date' | 'name' | 'artist' | 'album'>('date');
	let sortOrder = $state<'asc' | 'desc'>('desc');
	
	let selectionMode = $state(false);
	let selectedIds = $state<string[]>([]);

	function toggleSelection(id: string) {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter(i => i !== id);
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

	function longpress(node: HTMLElement, { duration, callback }: { duration: number, callback: () => void }) {
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
				node.removeEventListener('touchend', handleMouseup);
				node.removeEventListener('touchcancel', handleMouseup);
			}
		};
	}

	let audioFiles = $derived(
		[...data.audioFiles].sort((a: any, b: any) => {
			let valA, valB;
			if (sortBy === 'name') {
				valA = (a.title || a.fileName).toLowerCase();
				valB = (b.title || b.fileName).toLowerCase();
			} else if (sortBy === 'artist') {
				valA = (a.artist || 'Unknown Artist').toLowerCase();
				valB = (b.artist || 'Unknown Artist').toLowerCase();
			} else if (sortBy === 'album') {
				valA = (a.album || 'Unknown Album').toLowerCase();
				valB = (b.album || 'Unknown Album').toLowerCase();
			} else {
				// 'date'
				valA = new Date(a.createdAt || 0).getTime();
				valB = new Date(b.createdAt || 0).getTime();
			}

			if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
			if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
			return 0;
		})
	);
	let totalSize = $derived(audioFiles.reduce((acc: number, f: any) => acc + f.fileSize, 0));

	function formatBytes(bytes: number) {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	function formatDate(dateString: Date | string | null) {
		if (!dateString) return 'Unknown';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function handleSeek(e: Event) {
		const target = e.target as HTMLInputElement;
		media.currentTime = Number(target.value);
	}

	function handleVolume(e: Event) {
		const target = e.target as HTMLInputElement;
		media.volume = Number(target.value);
	}

	function formatTime(seconds: number) {
		if (!seconds || isNaN(seconds)) return '0:00';
		const m = Math.floor(seconds / 60);
		const s = Math.floor(seconds % 60);
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	function formatBitrate(fileSize: number, duration: number | null) {
		if (!duration || duration <= 0) return 'Unknown';
		const kbps = Math.round((fileSize * 8) / duration / 1000);
		const standardBitrates = [64, 96, 128, 160, 192, 256, 320, 1411];
		for (const std of standardBitrates) {
			if (Math.abs(kbps - std) / std < 0.15) return `${std} kbps`;
		}
		return `${kbps} kbps`;
	}
</script>

<div class="mx-auto max-w-[1280px] pb-24">
	<div class="mb-6 flex items-end justify-between">
		<div>
			<h1 class="mb-1 text-3xl font-bold text-white">Music Library</h1>
			<p class="text-sm text-gray-400">{audioFiles.length} tracks • {formatBytes(totalSize)}</p>
		</div>
		
		<div class="flex items-center gap-2">
			<button class="md:hidden flex items-center justify-center rounded-lg border border-[#2A3241] bg-[#151921] p-2 text-gray-400 transition-colors hover:bg-[#1E2430] hover:text-white" onclick={() => selectionMode = !selectionMode} title="Select Items" class:bg-[#FF6B4A]={selectionMode} class:text-black={selectionMode} class:border-[#FF6B4A]={selectionMode}>
				<Check size={18} />
			</button>
			<div class="relative">
				<button
					onclick={() => (showSortMenu = !showSortMenu)}
					class="flex items-center justify-center gap-2 rounded-lg border border-[#2A3241] bg-[#151921] px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-[#1E2430] hover:text-white {showSortMenu
						? 'border-[#FF6B4A] text-white'
						: ''}"
					title="Sort By"
				>
					<Filter size={16} />
				</button>

				{#if showSortMenu}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="fixed inset-0 z-40" onclick={() => (showSortMenu = false)}></div>
					<div
						class="absolute top-full right-0 z-50 mt-2 w-48 rounded-xl border border-[#2A3241] bg-[#151921] p-1 shadow-xl"
					>
						<div class="px-3 py-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
							SORT BY
						</div>

						<button
							class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-gray-300 hover:bg-[#1E2430] hover:text-white"
							class:text-[#FF6B4A]={sortBy === 'date'}
							onclick={() => {
								sortBy = 'date';
								showSortMenu = false;
							}}
						>
							Date Added
							{#if sortBy === 'date'}<Check size={14} />{/if}
						</button>
						<button
							class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-gray-300 hover:bg-[#1E2430] hover:text-white"
							class:text-[#FF6B4A]={sortBy === 'name'}
							onclick={() => {
								sortBy = 'name';
								showSortMenu = false;
							}}
						>
							Title
							{#if sortBy === 'name'}<Check size={14} />{/if}
						</button>
						<button
							class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-gray-300 hover:bg-[#1E2430] hover:text-white"
							class:text-[#FF6B4A]={sortBy === 'artist'}
							onclick={() => {
								sortBy = 'artist';
								showSortMenu = false;
							}}
						>
							Artist
							{#if sortBy === 'artist'}<Check size={14} />{/if}
						</button>
						<button
							class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-gray-300 hover:bg-[#1E2430] hover:text-white"
							class:text-[#FF6B4A]={sortBy === 'album'}
							onclick={() => {
								sortBy = 'album';
								showSortMenu = false;
							}}
						>
							Album
							{#if sortBy === 'album'}<Check size={14} />{/if}
						</button>

						<div class="my-1 border-t border-[#2A3241]"></div>

						<button
							class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-gray-300 hover:bg-[#1E2430] hover:text-white"
							class:text-[#FF6B4A]={sortOrder === 'asc'}
							onclick={() => {
								sortOrder = 'asc';
								showSortMenu = false;
							}}
						>
							Ascending
							{#if sortOrder === 'asc'}<Check size={14} />{/if}
						</button>
						<button
							class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-gray-300 hover:bg-[#1E2430] hover:text-white"
							class:text-[#FF6B4A]={sortOrder === 'desc'}
							onclick={() => {
								sortOrder = 'desc';
								showSortMenu = false;
							}}
						>
							Descending
							{#if sortOrder === 'desc'}<Check size={14} />{/if}
						</button>
					</div>
				{/if}
			</div>
			<button
				onclick={() => (viewMode = viewMode === 'list' ? 'grid' : 'list')}
				class="flex items-center justify-center rounded-lg border border-[#2A3241] bg-[#151921] p-2 text-gray-400 transition-colors hover:bg-[#1E2430] hover:text-white"
				title="Toggle View"
			>
				{#if viewMode === 'list'}
					<List size={18} />
				{:else}
					<Activity size={18} />
				{/if}
			</button>
		</div>
	</div>

	{#if showLyrics}
		<div
			class="mb-6 h-[calc(100vh-16rem)] min-h-[400px] overflow-hidden rounded-2xl border border-[#2A3241]"
		>
			<LyricsPanel />
		</div>
	{:else}
		<div class="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
			<div
				class="bg-primary-container col-span-1 flex flex-col items-center gap-6 rounded-2xl p-6 text-black md:flex-row lg:col-span-2"
			>
				<div
					class="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl shadow-lg md:h-32 md:w-32"
				>
					{#if media.currentTrack && media.currentTrack.thumbnailUrl}
						<img
							src={media.currentTrack.thumbnailUrl}
							alt="Cover"
							class="h-full w-full object-cover"
						/>
					{:else}
						<div class="flex h-full w-full items-center justify-center bg-black/20 text-black/50">
							<Music size={40} />
						</div>
					{/if}
				</div>
				<div class="flex-1 text-center md:text-left">
					<div class="mb-2 text-xs font-semibold tracking-wider text-black/70 uppercase">
						Now Playing
					</div>
					<h2 class="mb-1 text-2xl font-bold md:text-3xl">
						{media.currentTrack
							? media.currentTrack.title || media.currentTrack.fileName
							: 'No Track Selected'}
					</h2>
					<p class="font-medium text-black/70">
						{media.currentTrack ? media.currentTrack.artist || 'Unknown Artist' : '---'}
					</p>
				</div>
				<button
					onclick={() => media.togglePlay()}
					class="flex h-16 w-16 items-center justify-center rounded-full bg-black text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
				>
					{#if media.isPaused}
						<Play size={24} fill="currentColor" class="ml-1" />
					{:else}
						<Pause size={24} fill="currentColor" />
					{/if}
				</button>
			</div>

			<div
				class="flex flex-col justify-between rounded-2xl border border-[#2A3241] bg-[#151921] p-6"
			>
				<div>
					<h3 class="mb-4 flex items-center gap-2 text-sm font-medium text-gray-400">
						<ListMusic size={18} /> Up Next
					</h3>

					{#if media.currentIndex !== -1 && media.currentIndex < media.playlist.length - 1}
						{@const nextTrack = media.playlist[media.currentIndex + 1]}
						<div
							class="flex items-center gap-4 rounded-lg border border-[#2A3241] bg-[#0B0E14] p-3"
						>
							<div class="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-[#2A3241]">
								{#if nextTrack.thumbnailUrl}
									<img
										src={nextTrack.thumbnailUrl || defaultMusicCover}
										onerror={(e) => ((e.currentTarget as HTMLImageElement).src = defaultMusicCover)}
										alt="Cover"
										class="h-full w-full object-cover"
									/>
								{:else}
									<div class="flex h-full w-full items-center justify-center text-gray-500">
										<Music size={20} />
									</div>
								{/if}
							</div>
							<div class="flex min-w-0 flex-1 flex-col">
								<span class="truncate text-sm font-medium text-white"
									>{nextTrack.title || nextTrack.fileName}</span
								>
								<span class="truncate text-xs text-gray-400"
									>{nextTrack.artist || 'Unknown Artist'}</span
								>
							</div>
						</div>
					{:else}
						<div
							class="flex h-20 items-center justify-center rounded-lg border border-dashed border-[#2A3241] text-xs text-gray-500"
						>
							End of playlist
						</div>
					{/if}
				</div>
				<div class="mt-4 flex items-center justify-between border-t border-[#2A3241] pt-4">
					<span class="text-xs text-gray-400">Current Bitrate</span>
					<span class="text-xs font-medium text-[#FF6B4A]">
						{media.currentTrack
							? formatBitrate(media.currentTrack.fileSize, media.currentTrack.duration)
							: '---'}
					</span>
				</div>
			</div>
		</div>

		<div class="overflow-hidden rounded-2xl border border-[#2A3241] bg-[#151921] shadow-lg">
			<div class="flex items-center justify-between border-b border-[#2A3241] p-4">
				{#if selectionMode && viewMode === 'grid'}
					<div class="flex flex-1 items-center justify-between">
						<div class="flex items-center gap-3 text-[#FF6B4A]">
							<button onclick={toggleSelectionMode}><X size={20} /></button>
							<span class="font-medium text-sm sm:text-base">{selectedIds.length} Selected</span>
						</div>
						<div class="flex items-center gap-3">
							<button onclick={() => selectedIds = audioFiles.map(f => f.id)} class="text-sm font-medium text-[#FF6B4A] hover:underline">Select All</button>
							<button onclick={downloadSelected} class="flex items-center gap-1 rounded bg-[#FF6B4A] px-3 py-1.5 text-sm font-medium text-black disabled:opacity-50" disabled={selectedIds.length === 0}>
								<Download size={16} /> <span class="hidden sm:inline">Download</span>
							</button>
						</div>
					</div>
				{:else}
					<button
						onclick={() => media.playTrack(0, audioFiles)}
						class="bg-primary-container flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-black transition-transform hover:scale-105"
					>
						<Play size={18} fill="currentColor" /> Play All
					</button>
					<span class="text-xs text-gray-400">{audioFiles.length} items</span>
				{/if}
			</div>
			{#if audioFiles.length === 0}
				<div class="flex flex-col items-center justify-center p-12 text-center text-gray-400">
					<Music size={32} class="mb-4 opacity-50" />
					<p>No tracks found.</p>
				</div>
			{:else if viewMode === 'list'}
				<div class="w-full">
					<table class="w-full border-collapse text-left table-fixed">
						<thead>
							<tr class="border-b {selectionMode ? 'border-[#FF6B4A] bg-[#FF6B4A]/10' : 'border-[#2A3241] bg-[#10131a]'}">
								<th class="w-10 sm:w-12 px-2 sm:px-4 py-3 text-center text-xs font-medium {selectionMode ? 'text-[#FF6B4A]' : 'text-gray-400'}">
									{#if selectionMode}
										<button onclick={toggleSelectionMode}><X size={20} class="mx-auto" /></button>
									{:else}
										#
									{/if}
								</th>
								<th class="px-2 sm:px-4 py-3 text-xs font-medium text-gray-400">
									{#if selectionMode}
										<div class="flex flex-1 items-center justify-start text-[#FF6B4A]">
											<div class="flex items-center gap-3 sm:gap-4">
												<span class="font-medium text-sm sm:text-base">{selectedIds.length} Selected</span>
												<button onclick={() => selectedIds = audioFiles.map(f => f.id)} class="text-sm font-medium hover:underline">Select All</button>
											</div>
										</div>
									{:else}
										Name
									{/if}
								</th>
								<th class="hidden px-4 py-3 text-xs font-medium text-gray-400 sm:table-cell">
									{#if !selectionMode}Artist{/if}
								</th>
								<th class="hidden w-24 px-4 py-3 text-right text-xs font-medium text-gray-400 sm:table-cell">
									{#if !selectionMode}Duration{/if}
								</th>
								<th class="hidden w-28 px-4 py-3 text-right text-xs font-medium text-gray-400 md:table-cell">
									{#if !selectionMode}Bitrate{/if}
								</th>
								<th class="hidden w-32 px-4 py-3 text-right text-xs font-medium text-gray-400 lg:table-cell">
									{#if !selectionMode}Added{/if}
								</th>
								<th class="w-12 sm:w-16 px-2 py-3 text-center">
									{#if selectionMode}
										<button onclick={downloadSelected} class="mx-auto flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded bg-[#FF6B4A] text-black transition-opacity hover:opacity-90 disabled:opacity-50" disabled={selectedIds.length === 0} title="Download Selected">
											<Download size={16} />
										</button>
									{/if}
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-[#2A3241]/50 text-sm text-white">
							{#each audioFiles as track, index}
								<tr
									class="group cursor-pointer transition-colors hover:bg-[#1E2430] {selectionMode && selectedIds.includes(track.id) ? 'bg-[#FF6B4A]/10' : ''}"
									use:longpress={{
										duration: 500,
										callback: () => {
											if (!selectionMode) {
												selectionMode = true;
												selectedIds = [track.id];
											}
										}
									}}
									onclick={() => {
										if (selectionMode) {
											toggleSelection(track.id);
										} else {
											media.playTrack(index, audioFiles);
										}
									}}
								>
									<td class="px-2 sm:px-4 py-3 text-center text-xs text-gray-400">
										{#if selectionMode}
											<div class="h-4 w-4 rounded border {selectedIds.includes(track.id) ? 'bg-[#FF6B4A] border-[#FF6B4A]' : 'border-[#2A3241]'} mx-auto flex items-center justify-center">
												{#if selectedIds.includes(track.id)}
													<Check size={12} class="text-black" />
												{/if}
											</div>
										{:else if media.currentTrack?.id === track.id && !media.isPaused}
											<div class="text-primary-container mx-auto h-3 w-3">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 24 24"
													fill="currentColor"
												>
													<polygon points="5 3 19 12 5 21 5 3"></polygon>
												</svg>
											</div>
										{:else}
											<span class="text-xs text-gray-500 group-hover:hidden">{index + 1}</span>
											<Play
												size={14}
												class="mx-auto hidden text-gray-400 group-hover:block group-hover:text-white"
											/>
										{/if}
									</td>
									<td class="px-2 sm:px-4 py-3">
										<div class="flex items-center gap-3">
											<div
												class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded border border-[#2A3241] bg-[#10131a]"
											>
												<img
													class="h-full w-full object-cover"
													alt="Cover"
													src={track.thumbnailUrl || defaultMusicCover}
													onerror={(e) =>
														((e.currentTarget as HTMLImageElement).src = defaultMusicCover)}
												/>
											</div>
											<span
												class="max-w-[150px] truncate font-medium text-gray-300 transition-colors group-hover:text-white sm:max-w-xs"
												>{track.title || track.fileName}</span
											>
										</div>
									</td>
									<td class="hidden max-w-[120px] truncate px-4 py-3 text-gray-400 sm:table-cell"
										>{track.artist || 'Unknown Artist'}</td
									>
									<td class="hidden px-4 py-3 text-right text-xs text-gray-400 tabular-nums sm:table-cell"
										>{formatTime(track.duration || 0)}</td
									>
									<td
										class="hidden px-4 py-3 text-right text-xs text-gray-400 tabular-nums md:table-cell"
										>{formatBitrate(track.fileSize, track.duration)}</td
									>
									<td class="hidden px-4 py-3 text-right text-xs text-gray-400 lg:table-cell"
										>{formatDate(track.createdAt)}</td
									>
									<td class="px-2 py-3 text-center">
										<button
											onclick={(e) => {
												e.stopPropagation();
												downloadFile(track.id);
											}}
											class="text-gray-400 opacity-100 sm:opacity-0 transition-opacity group-hover:opacity-100 hover:text-[#FF6B4A]"
											title="Download"
											><Download size={18} /></button
										>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
					{#each audioFiles as track, index}
						<div
							class="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-[#2A3241] bg-[#10131a] transition-colors hover:border-[#FF6B4A] {selectionMode && selectedIds.includes(track.id) ? 'border-[#FF6B4A] ring-2 ring-[#FF6B4A]' : ''}"
							use:longpress={{
								duration: 500,
								callback: () => {
									if (!selectionMode) {
										selectionMode = true;
										selectedIds = [track.id];
									}
								}
							}}
							onclick={() => {
								if (selectionMode) {
									toggleSelection(track.id);
								} else {
									media.playTrack(index, audioFiles);
								}
							}}
						>
							{#if selectionMode}
								<div class="absolute top-2 right-2 z-20 h-5 w-5 rounded-full border flex items-center justify-center bg-black/50 {selectedIds.includes(track.id) ? 'bg-[#FF6B4A] border-[#FF6B4A]' : 'border-white'}">
									{#if selectedIds.includes(track.id)}
										<Check size={14} class="text-black" />
									{/if}
								</div>
							{/if}
							<div class="relative aspect-square w-full overflow-hidden bg-black/40">
								<img
									src={track.thumbnailUrl || defaultMusicCover}
									onerror={(e) => ((e.currentTarget as HTMLImageElement).src = defaultMusicCover)}
									alt="Cover"
									class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
								/>
								<div
									class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
								>
									<div
										class="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF6B4A] text-black shadow-lg"
									>
										{#if media.currentTrack?.id === track.id && !media.isPaused}
											<Pause size={24} fill="currentColor" />
										{:else}
											<Play size={24} fill="currentColor" class="ml-1" />
										{/if}
									</div>
								</div>
							</div>
							<div class="flex flex-col p-3">
								<span class="truncate text-sm font-medium text-white"
									>{track.title || track.fileName}</span
								>
								<span class="truncate text-xs text-gray-400"
									>{track.artist || 'Unknown Artist'}</span
								>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

{#if media.currentTrack}
	<div
		class="fixed right-0 bottom-0 left-0 z-50 flex h-auto flex-col items-center justify-between border-t border-[#2A3241] bg-[#0B0E14]/95 p-3 backdrop-blur md:left-[260px] md:h-24 md:flex-row md:p-0 md:px-6"
	>
		<!-- Mobile Progress Bar -->
		<div class="absolute top-0 right-0 left-0 h-1 bg-[#2A3241] md:hidden">
			<div
				class="h-full bg-[#FF6B4A]"
				style="width: {media.duration ? (media.currentTime / media.duration) * 100 : 0}%;"
			></div>
			<input
				type="range"
				min="0"
				max={media.duration || 100}
				value={media.currentTime}
				oninput={handleSeek}
				class="absolute inset-0 w-full cursor-pointer opacity-0"
			/>
		</div>

		<!-- Left: Cover & Info -->
		<div class="flex w-full min-w-0 items-center justify-between gap-4 md:w-1/3 md:justify-start">
			<div class="flex min-w-0 flex-1 items-center gap-3">
				<div
					class="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#2A3241] shadow-md md:h-14 md:w-14"
				>
					<img
						src={media.currentTrack.thumbnailUrl || defaultMusicCover}
						onerror={(e) => ((e.currentTarget as HTMLImageElement).src = defaultMusicCover)}
						alt="Cover"
						class="h-full w-full object-cover"
					/>
				</div>
				<div class="flex min-w-0 flex-col">
					<span class="truncate text-sm font-medium text-white md:text-base"
						>{media.currentTrack.title || media.currentTrack.fileName}</span
					>
					<span class="truncate text-xs text-gray-400 md:text-sm"
						>{media.currentTrack.artist || 'Unknown Artist'}</span
					>
				</div>
			</div>

			<button class="ml-2 hidden text-gray-400 hover:text-white md:block">
				<Heart size={18} />
			</button>

			<!-- Mobile Controls -->
			<div class="flex shrink-0 items-center gap-3 md:hidden">
				<button
					class="text-gray-400 transition-colors hover:text-white"
					class:text-[#FF6B4A]={showLyrics}
					onclick={() => (showLyrics = !showLyrics)}
					title="Toggle Lyrics"
				>
					<Mic2 size={20} />
				</button>
				<button
					class="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105"
					onclick={() => media.togglePlay()}
				>
					{#if media.isPaused}
						<Play size={18} fill="currentColor" class="ml-0.5" />
					{:else}
						<Pause size={18} fill="currentColor" />
					{/if}
				</button>
				<button class="text-gray-400 hover:text-white" onclick={() => media.playNext()}>
					<SkipForward size={22} fill="currentColor" />
				</button>
			</div>
		</div>

		<!-- Center: Controls (Desktop) -->
		<div class="hidden max-w-lg flex-1 flex-col items-center gap-2 md:flex">
			<div class="flex items-center gap-6">
				<button class="text-gray-400 hover:text-white"><Repeat size={18} /></button>
				<button class="text-gray-400 hover:text-white" onclick={() => media.playPrev()}
					><SkipBack size={20} fill="currentColor" /></button
				>
				<button
					class="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105"
					onclick={() => media.togglePlay()}
				>
					{#if media.isPaused}
						<Play size={18} fill="currentColor" class="ml-0.5" />
					{:else}
						<Pause size={18} fill="currentColor" />
					{/if}
				</button>
				<button class="text-gray-400 hover:text-white" onclick={() => media.playNext()}
					><SkipForward size={20} fill="currentColor" /></button
				>
				<button class="text-gray-400 hover:text-white"><Shuffle size={18} /></button>
			</div>
			<div class="flex w-full items-center gap-3">
				<span class="w-10 text-right text-xs text-gray-400 tabular-nums"
					>{formatTime(media.currentTime)}</span
				>
				<input
					type="range"
					min="0"
					max={media.duration || 100}
					value={media.currentTime}
					oninput={handleSeek}
					style="background-size: {media.duration
						? (media.currentTime / media.duration) * 100
						: 0}% 100%;"
					class="accent-primary-container from-primary-container to-primary-container h-1 flex-1 cursor-pointer appearance-none rounded-full bg-[#2A3241] bg-gradient-to-r bg-no-repeat"
				/>
				<span class="w-10 text-xs text-gray-400 tabular-nums">{formatTime(media.duration)}</span>
			</div>
		</div>

		<!-- Right: Volume & Extras (Desktop) -->
		<div class="hidden w-1/3 justify-end gap-4 pr-2 md:flex">
			<button
				class="text-gray-400 transition-colors hover:text-white"
				class:text-[#FF6B4A]={showLyrics}
				onclick={() => (showLyrics = !showLyrics)}
				title="Toggle Lyrics"
			>
				<Mic2 size={18} />
			</button>
			<button class="text-gray-400 hover:text-white"><ListMusic size={18} /></button>
			<div class="group flex items-center gap-2">
				<button
					class="text-gray-400 hover:text-white"
					onclick={() => (media.volume = media.volume === 0 ? 1 : 0)}
				>
					<Volume2 size={18} />
				</button>
				<input
					type="range"
					min="0"
					max="1"
					step="0.01"
					value={media.volume}
					oninput={handleVolume}
					style="background-size: {media.volume * 100}% 100%;"
					class="h-1 w-24 cursor-pointer appearance-none rounded-full bg-[#2A3241] bg-gradient-to-r from-white to-white bg-no-repeat accent-white opacity-0 transition-opacity group-hover:opacity-100"
				/>
			</div>
		</div>
	</div>
{/if}
