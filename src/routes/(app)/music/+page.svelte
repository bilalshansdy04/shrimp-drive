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
		X,
		Loader2,
		Trash2
	} from 'lucide-svelte';
	import type { PageData } from './$types';
	import { media, downloadFileClient } from '$lib/client/mediaState.svelte';
	import { invalidateAll } from '$app/navigation';
	import LyricsPanel from '$lib/components/music/LyricsPanel.svelte';
	import { confirmDelete, confirmDeleteMultiple } from '$lib/utils/deleteConfirm';
	import { askConfirm } from '$lib/client/confirm.svelte';
	import { toast } from 'svelte-sonner';

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
		const track = audioFiles.find((t: any) => t.id === id);
		if (track) {
			downloadFileClient(track);
		}
	}

	function downloadSelected() {
		selectedIds.forEach((id, index) => {
			setTimeout(() => {
				downloadFile(id);
			}, index * 500);
		});
		toggleSelectionMode();
	}

	async function deleteSelected() {
		if (selectedIds.length === 0) return;
		await confirmDeleteMultiple(selectedIds.length, async () => {
			const res = await fetch('/api/bulk/delete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ files: Array.from(selectedIds), folders: [] })
			});

			if (res.ok) {
				selectedIds = [];
				if (selectionMode) selectionMode = false;
				await invalidateAll();
				return true;
			} else {
				console.error('Failed to delete selected tracks:', await res.text());
				return false;
			}
		});
	}

	function longpress(
		node: HTMLElement,
		{ duration, callback }: { duration: number; callback: () => void }
	) {
		let timer: ReturnType<typeof setTimeout>;
		let startX = 0;
		let startY = 0;

		const handleMousedown = (e: MouseEvent | TouchEvent) => {
			if (e instanceof TouchEvent) {
				startX = e.touches[0].clientX;
				startY = e.touches[0].clientY;
			} else {
				startX = e.clientX;
				startY = e.clientY;
			}
			timer = setTimeout(() => {
				callback();
			}, duration);
		};

		const handleMousemove = (e: MouseEvent | TouchEvent) => {
			let currentX = 0;
			let currentY = 0;
			if (e instanceof TouchEvent) {
				currentX = e.touches[0].clientX;
				currentY = e.touches[0].clientY;
			} else {
				currentX = e.clientX;
				currentY = e.clientY;
			}
			const diffX = Math.abs(currentX - startX);
			const diffY = Math.abs(currentY - startY);

			if (diffX > 10 || diffY > 10) {
				clearTimeout(timer);
			}
		};

		const handleMouseup = () => {
			clearTimeout(timer);
		};

		node.addEventListener('mousedown', handleMousedown);
		node.addEventListener('mousemove', handleMousemove);
		node.addEventListener('mouseup', handleMouseup);
		node.addEventListener('touchstart', handleMousedown, { passive: true });
		node.addEventListener('touchmove', handleMousemove, { passive: true });
		node.addEventListener('touchend', handleMouseup);
		node.addEventListener('touchcancel', handleMouseup);

		return {
			destroy() {
				node.removeEventListener('mousedown', handleMousedown);
				node.removeEventListener('mousemove', handleMousemove);
				node.removeEventListener('mouseup', handleMouseup);
				node.removeEventListener('touchstart', handleMousedown);
				node.removeEventListener('touchmove', handleMousemove);
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

<div class="mx-auto pb-24 max-w-[1280px]">
	<div class="flex justify-between items-end mb-6">
		<div>
			<h1 class="mb-1 font-bold text-white text-3xl">Music Library</h1>
			<p class="text-gray-400 text-sm">{audioFiles.length} tracks • {formatBytes(totalSize)}</p>
		</div>

		<div class="flex items-center gap-2">
			<button
				onclick={toggleSelectionMode}
				class="flex items-center gap-2 rounded-lg border {selectionMode
					? 'border-[#FF6B4A] bg-[#FF6B4A]/10 text-[#FF6B4A]'
					: 'border-[#2A3241] bg-[#151921] text-gray-400 hover:bg-[#1E2430] hover:text-white'} px-3 py-2 text-sm font-medium transition-colors"
				title={selectionMode ? 'Cancel Selection' : 'Select Items'}
			>
				<Check size={16} />
				<span class="hidden sm:inline">{selectionMode ? 'Cancel' : 'Select'}</span>
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
					<div class="z-40 fixed inset-0" onclick={() => (showSortMenu = false)}></div>
					<div
						class="top-full right-0 z-50 absolute bg-[#151921] shadow-xl mt-2 p-1 border border-[#2A3241] rounded-xl w-48"
					>
						<div class="px-3 py-2 font-semibold text-gray-500 text-xs uppercase tracking-wider">
							SORT BY
						</div>

						<button
							class="flex justify-between items-center hover:bg-[#1E2430] px-3 py-2 rounded-lg w-full text-gray-300 hover:text-white text-sm text-left"
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
							class="flex justify-between items-center hover:bg-[#1E2430] px-3 py-2 rounded-lg w-full text-gray-300 hover:text-white text-sm text-left"
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
							class="flex justify-between items-center hover:bg-[#1E2430] px-3 py-2 rounded-lg w-full text-gray-300 hover:text-white text-sm text-left"
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
							class="flex justify-between items-center hover:bg-[#1E2430] px-3 py-2 rounded-lg w-full text-gray-300 hover:text-white text-sm text-left"
							class:text-[#FF6B4A]={sortBy === 'album'}
							onclick={() => {
								sortBy = 'album';
								showSortMenu = false;
							}}
						>
							Album
							{#if sortBy === 'album'}<Check size={14} />{/if}
						</button>

						<div class="my-1 border-[#2A3241] border-t"></div>

						<button
							class="flex justify-between items-center hover:bg-[#1E2430] px-3 py-2 rounded-lg w-full text-gray-300 hover:text-white text-sm text-left"
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
							class="flex justify-between items-center hover:bg-[#1E2430] px-3 py-2 rounded-lg w-full text-gray-300 hover:text-white text-sm text-left"
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
				class="flex justify-center items-center bg-[#151921] hover:bg-[#1E2430] p-2 border border-[#2A3241] rounded-lg text-gray-400 hover:text-white transition-colors"
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
			class="mb-6 border border-[#2A3241] rounded-2xl h-[calc(100vh-16rem)] min-h-[400px] overflow-hidden"
		>
			<LyricsPanel />
		</div>
	{:else}
		<div class="gap-4 grid grid-cols-1 lg:grid-cols-3 mb-6">
			<div
				class="flex md:flex-row flex-col items-center gap-6 col-span-1 lg:col-span-2 bg-primary-container p-6 rounded-2xl text-black"
			>
				<div
					class="relative shadow-lg rounded-xl w-24 md:w-32 h-24 md:h-32 overflow-hidden shrink-0"
				>
					{#if media.currentTrack && media.currentTrack.thumbnailUrl}
						<img
							src={media.currentTrack.thumbnailUrl}
							alt="Cover"
							class="w-full h-full object-cover"
						/>
					{:else}
						<div class="flex justify-center items-center bg-black/20 w-full h-full text-black/50">
							<Music size={40} />
						</div>
					{/if}
				</div>
				<div class="flex-1 md:text-left text-center">
					<div class="mb-2 font-semibold text-black/70 text-xs uppercase tracking-wider">
						Now Playing
					</div>
					<h2 class="mb-1 font-bold text-2xl md:text-3xl">
						{media.currentTrack
							? media.currentTrack.title || media.currentTrack.fileName
							: 'No Track Selected'}
					</h2>
					<p class="font-medium text-black/70">
						{media.currentTrack ? media.currentTrack.artist || 'Unknown Artist' : '---'}
					</p>
				</div>
				<button
					onclick={() => {
						if (!media.isLoadingTrack) media.togglePlay();
					}}
					class="flex justify-center items-center bg-black shadow-xl rounded-full w-16 h-16 text-white hover:scale-105 active:scale-95 transition-transform"
				>
					{#if media.isLoadingTrack}
						<Loader2 size={24} class="text-white animate-spin" />
					{:else if media.isPaused}
						<Play size={24} fill="currentColor" class="ml-1" />
					{:else}
						<Pause size={24} fill="currentColor" />
					{/if}
				</button>
			</div>

			<div
				class="flex flex-col justify-between bg-[#151921] p-6 border border-[#2A3241] rounded-2xl"
			>
				<div>
					<h3 class="flex items-center gap-2 mb-4 font-medium text-gray-400 text-sm">
						<ListMusic size={18} /> Up Next
					</h3>

					{#if media.currentIndex !== -1 && media.currentIndex < media.playlist.length - 1}
						{@const nextTrack = media.playlist[media.currentIndex + 1]}
						<div
							class="flex items-center gap-4 bg-[#0B0E14] p-3 border border-[#2A3241] rounded-lg"
						>
							<div class="bg-[#2A3241] rounded-md w-12 h-12 overflow-hidden shrink-0">
								{#if nextTrack.thumbnailUrl}
									<img
										src={nextTrack.thumbnailUrl || defaultMusicCover}
										onerror={(e) => ((e.currentTarget as HTMLImageElement).src = defaultMusicCover)}
										alt="Cover"
										class="w-full h-full object-cover"
									/>
								{:else}
									<div class="flex justify-center items-center w-full h-full text-gray-500">
										<Music size={20} />
									</div>
								{/if}
							</div>
							<div class="flex flex-col flex-1 min-w-0">
								<span class="font-medium text-white text-sm truncate"
									>{nextTrack.title || nextTrack.fileName}</span
								>
								<span class="text-gray-400 text-xs truncate"
									>{nextTrack.artist || 'Unknown Artist'}</span
								>
							</div>
						</div>
					{:else}
						<div
							class="flex justify-center items-center border border-[#2A3241] border-dashed rounded-lg h-20 text-gray-500 text-xs"
						>
							End of playlist
						</div>
					{/if}
				</div>
				<div class="flex justify-between items-center mt-4 pt-4 border-[#2A3241] border-t">
					<span class="text-gray-400 text-xs">Current Bitrate</span>
					<span class="font-medium text-[#FF6B4A] text-xs">
						{media.currentTrack
							? formatBitrate(media.currentTrack.fileSize, media.currentTrack.duration)
							: '---'}
					</span>
				</div>
			</div>
		</div>

		<div class="bg-[#151921] shadow-lg border border-[#2A3241] rounded-2xl overflow-hidden">
			<div class="flex justify-between items-center p-4 border-[#2A3241] border-b">
				{#if selectionMode && viewMode === 'grid'}
					<div class="flex flex-1 justify-between items-center">
						<div class="flex items-center gap-3 text-[#FF6B4A]">
							<button onclick={toggleSelectionMode}><X size={20} /></button>
							<span class="font-medium text-sm sm:text-base">{selectedIds.length} Selected</span>
						</div>
						<div class="flex items-center gap-3">
							<button
								onclick={() => (selectedIds = audioFiles.map((f) => f.id))}
								class="font-medium text-[#FF6B4A] text-sm hover:underline">Select All</button
							>
							<button
								onclick={downloadSelected}
								class="flex items-center gap-1 bg-[#FF6B4A] disabled:opacity-50 px-3 py-1.5 rounded font-medium text-black text-sm"
								disabled={selectedIds.length === 0}
							>
								<Download size={16} /> <span class="hidden sm:inline">Download</span>
							</button>
						</div>
					</div>
				{:else}
					<button
						onclick={() => media.playTrack(0, audioFiles)}
						class="flex items-center gap-2 bg-primary-container px-5 py-2.5 rounded-full font-medium text-black text-sm hover:scale-105 transition-transform"
					>
						<Play size={18} fill="currentColor" /> Play All
					</button>
					<span class="text-gray-400 text-xs">{audioFiles.length} items</span>
				{/if}
			</div>
			{#if audioFiles.length === 0}
				<div class="flex flex-col justify-center items-center p-12 text-gray-400 text-center">
					<Music size={32} class="opacity-50 mb-4" />
					<p>No tracks found.</p>
				</div>
			{:else if viewMode === 'list'}
				<div class="w-full">
					<table class="w-full text-left border-collapse table-fixed">
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
								<th class="px-2 sm:px-4 py-3 font-medium text-gray-400 text-xs">
									{#if selectionMode}
										<div class="flex flex-1 justify-start items-center text-[#FF6B4A]">
											<div class="flex items-center gap-3 sm:gap-4">
												<span class="font-medium text-sm sm:text-base"
													>{selectedIds.length} Selected</span
												>
												<button
													onclick={() => (selectedIds = audioFiles.map((f) => f.id))}
													class="font-medium text-sm hover:underline">Select All</button
												>
											</div>
										</div>
									{:else}
										Name
									{/if}
								</th>
								<th class="hidden sm:table-cell px-4 py-3 font-medium text-gray-400 text-xs">
									{#if !selectionMode}Artist{/if}
								</th>
								<th
									class="hidden sm:table-cell px-4 py-3 w-24 font-medium text-gray-400 text-xs text-right"
								>
									{#if !selectionMode}Duration{/if}
								</th>
								<th
									class="hidden md:table-cell px-4 py-3 w-28 font-medium text-gray-400 text-xs text-right"
								>
									{#if !selectionMode}Bitrate{/if}
								</th>
								<th
									class="hidden lg:table-cell px-4 py-3 w-32 font-medium text-gray-400 text-xs text-right"
								>
									{#if !selectionMode}Added{/if}
								</th>
								<th class="px-2 py-3 w-12 sm:w-16 text-center">
									{#if selectionMode}
										<div class="flex justify-center gap-1">
											<button
												onclick={downloadSelected}
												class="flex justify-center items-center bg-[#FF6B4A] hover:opacity-90 disabled:opacity-50 mx-auto rounded w-7 sm:w-8 h-7 sm:h-8 text-black transition-opacity"
												disabled={selectedIds.length === 0}
												title="Download Selected"
											>
												<Download size={16} />
											</button>
										</div>
									{/if}
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-[#2A3241]/50 text-white text-sm">
							{#each audioFiles as track, index}
								<tr
									class="group cursor-pointer transition-colors hover:bg-[#1E2430] {selectionMode &&
									selectedIds.includes(track.id)
										? 'bg-[#FF6B4A]/10'
										: ''}"
									use:longpress={{
										duration: 400,
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
									<td class="px-2 sm:px-4 py-3 text-gray-400 text-xs text-center">
										{#if selectionMode}
											<div
												class="h-4 w-4 rounded border {selectedIds.includes(track.id)
													? 'border-[#FF6B4A] bg-[#FF6B4A]'
													: 'border-[#2A3241]'} mx-auto flex items-center justify-center"
											>
												{#if selectedIds.includes(track.id)}
													<Check size={12} class="text-black" />
												{/if}
											</div>
										{:else if media.currentTrack?.id === track.id}
											{#if media.isLoadingTrack}
												<div class="flex justify-center items-center mx-auto h-full text-primary">
													<Loader2 size={14} class="animate-spin" />
												</div>
											{:else if !media.isPaused}
												<div class="mx-auto w-3 h-3 text-primary-container">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														viewBox="0 0 24 24"
														fill="currentColor"
													>
														<polygon points="5 3 19 12 5 21 5 3"></polygon>
													</svg>
												</div>
											{:else}
												<div class="mx-auto w-3 h-3 text-gray-400">
													<span class="font-mono font-bold text-xs"
														>{(index + 1).toString().padStart(2, '0')}</span
													>
												</div>
											{/if}
										{:else}
											<span class="group-hover:hidden text-gray-500 text-xs">{index + 1}</span>
											<Play
												size={14}
												class="hidden group-hover:block mx-auto text-gray-400 group-hover:text-white"
											/>
										{/if}
									</td>
									<td class="px-2 sm:px-4 py-3">
										<div class="flex items-center gap-3">
											<div
												class="flex justify-center items-center bg-[#10131a] border border-[#2A3241] rounded w-8 h-8 overflow-hidden shrink-0"
											>
												<img
													class="w-full h-full object-cover"
													alt="Cover"
													src={track.thumbnailUrl || defaultMusicCover}
													onerror={(e) =>
														((e.currentTarget as HTMLImageElement).src = defaultMusicCover)}
												/>
											</div>
											<span
												class="max-w-[150px] sm:max-w-xs font-medium text-gray-300 group-hover:text-white truncate transition-colors"
												>{track.title || track.fileName}</span
											>
										</div>
									</td>
									<td class="hidden sm:table-cell px-4 py-3 max-w-[120px] text-gray-400 truncate"
										>{track.artist || 'Unknown Artist'}</td
									>
									<td
										class="hidden sm:table-cell px-4 py-3 tabular-nums text-gray-400 text-xs text-right"
										>{formatTime(track.duration || 0)}</td
									>
									<td
										class="hidden md:table-cell px-4 py-3 tabular-nums text-gray-400 text-xs text-right"
										>{formatBitrate(track.fileSize, track.duration)}</td
									>
									<td class="hidden lg:table-cell px-4 py-3 text-gray-400 text-xs text-right"
										>{formatDate(track.createdAt)}</td
									>
									<td class="px-2 py-3 text-center">
										<div class="flex justify-center items-center gap-1">
											<button
												onclick={(e) => {
													e.stopPropagation();
													downloadFile(track.id);
												}}
												class="opacity-100 sm:opacity-0 group-hover:opacity-100 text-gray-400 hover:text-[#FF6B4A] transition-opacity"
												title="Download"><Download size={18} /></button
											>
											<button
												onclick={async (e) => {
													e.stopPropagation();
													if (await askConfirm('Delete this track? This cannot be undone.')) {
														const tid = toast.loading('Deleting track...');
														const res = await fetch('/api/bulk/delete', {
															method: 'POST',
															headers: { 'Content-Type': 'application/json' },
															body: JSON.stringify({ files: [track.id], folders: [] })
														});
														if (res.ok) {
															toast.success('Track deleted successfully', { id: tid });
															await invalidateAll();
														} else {
															toast.error('Failed to delete track', { id: tid });
														}
													}
												}}
												class="opacity-100 sm:opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
												title="Delete"><Trash2 size={18} /></button
											>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="gap-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 p-6">
					{#each audioFiles as track, index}
						<div
							class="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-[#2A3241] bg-[#10131a] transition-colors hover:border-[#FF6B4A] {selectionMode &&
							selectedIds.includes(track.id)
								? 'border-[#FF6B4A] ring-2 ring-[#FF6B4A]'
								: ''}"
							use:longpress={{
								duration: 400,
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
								<div
									class="absolute top-2 right-2 z-20 flex h-5 w-5 items-center justify-center rounded-full border {selectedIds.includes(
										track.id
									)
										? 'border-[#FF6B4A] bg-[#FF6B4A]'
										: 'border-white bg-black/50'}"
								>
									{#if selectedIds.includes(track.id)}
										<Check size={14} class="text-black" />
									{/if}
								</div>
							{/if}
							<div class="relative bg-black/40 w-full aspect-square overflow-hidden">
								<img
									src={track.thumbnailUrl || defaultMusicCover}
									onerror={(e) => ((e.currentTarget as HTMLImageElement).src = defaultMusicCover)}
									alt="Cover"
									class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
								/>
								<div
									class="absolute inset-0 flex justify-center items-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
								>
									<div
										class="flex justify-center items-center bg-[#FF6B4A] shadow-lg rounded-full w-12 h-12 text-black"
									>
										{#if media.currentTrack?.id === track.id && media.isLoadingTrack}
											<Loader2 size={24} class="text-black animate-spin" />
										{:else if media.currentTrack?.id === track.id && !media.isPaused}
											<Pause size={24} fill="currentColor" />
										{:else}
											<Play size={24} fill="currentColor" class="ml-1" />
										{/if}
									</div>
								</div>
							</div>
							<div class="flex flex-col p-3">
								<span class="font-medium text-white text-sm truncate"
									>{track.title || track.fileName}</span
								>
								<span class="text-gray-400 text-xs truncate"
									>{track.artist || 'Unknown Artist'}</span
								>
							</div>
							<div class="right-2 bottom-2 z-10 absolute flex items-center gap-1">
								<button
									onclick={(e) => {
										e.stopPropagation();
										downloadFile(track.id);
									}}
									class="flex justify-center items-center bg-[#FF6B4A] hover:opacity-90 rounded-full w-7 h-7 text-black transition-opacity"
									title="Download"
								>
									<Download size={14} />
								</button>
								<button
									onclick={async (e) => {
										e.stopPropagation();
										if (await askConfirm('Delete this track? This cannot be undone.')) {
											const tid = toast.loading('Deleting track...');
											const res = await fetch('/api/bulk/delete', {
												method: 'POST',
												headers: { 'Content-Type': 'application/json' },
												body: JSON.stringify({ files: [track.id], folders: [] })
											});
											if (res.ok) {
												toast.success('Track deleted successfully', { id: tid });
												await invalidateAll();
											} else {
												toast.error('Failed to delete track', { id: tid });
											}
										}
									}}
									class="flex justify-center items-center bg-red-600 hover:opacity-90 rounded-full w-7 h-7 text-white transition-opacity"
									title="Delete"
								>
									<Trash2 size={14} />
								</button>
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
		class="right-0 bottom-0 left-0 md:left-[260px] z-50 fixed flex md:flex-row flex-col justify-between items-center bg-[#0B0E14]/95 backdrop-blur p-3 md:p-0 md:px-6 border-[#2A3241] border-t h-auto md:h-24"
	>
		<!-- Mobile Progress Bar -->
		<div class="md:hidden top-0 right-0 left-0 absolute bg-[#2A3241] h-1">
			<div
				class="bg-[#FF6B4A] h-full"
				style="width: {media.duration ? (media.currentTime / media.duration) * 100 : 0}%;"
			></div>
			<input
				type="range"
				min="0"
				max={media.duration || 100}
				value={media.currentTime}
				oninput={handleSeek}
				class="absolute inset-0 opacity-0 w-full cursor-pointer"
			/>
		</div>

		<!-- Left: Cover & Info -->
		<div class="flex justify-between md:justify-start items-center gap-4 w-full md:w-1/3 min-w-0">
			<div class="flex flex-1 items-center gap-3 min-w-0">
				<div
					class="bg-[#2A3241] shadow-md rounded-lg w-12 md:w-14 h-12 md:h-14 overflow-hidden shrink-0"
				>
					<img
						src={media.currentTrack.thumbnailUrl || defaultMusicCover}
						onerror={(e) => ((e.currentTarget as HTMLImageElement).src = defaultMusicCover)}
						alt="Cover"
						class="w-full h-full object-cover"
					/>
				</div>
				<div class="flex flex-col min-w-0">
					<span class="font-medium text-white text-sm md:text-base truncate"
						>{media.currentTrack.title || media.currentTrack.fileName}</span
					>
					<span class="text-gray-400 text-xs md:text-sm truncate"
						>{media.currentTrack.artist || 'Unknown Artist'}</span
					>
				</div>
			</div>

			<button class="hidden md:block ml-2 text-gray-400 hover:text-white">
				<Heart size={18} />
			</button>

			<!-- Mobile Controls -->
			<div class="md:hidden flex items-center gap-3 shrink-0">
				<button
					class="text-gray-400 hover:text-white transition-colors"
					class:text-[#FF6B4A]={showLyrics}
					onclick={() => (showLyrics = !showLyrics)}
					title="Toggle Lyrics"
				>
					<Mic2 size={20} />
				</button>
				<button
					class="flex justify-center items-center bg-white rounded-full w-10 h-10 text-black hover:scale-105 transition-transform"
					onclick={() => {
						if (!media.isLoadingTrack) media.togglePlay();
					}}
				>
					{#if media.isLoadingTrack}
						<Loader2 size={18} class="text-black animate-spin" />
					{:else if media.isPaused}
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
		<div class="hidden md:flex flex-col flex-1 items-center gap-2 max-w-lg">
			<div class="flex items-center gap-6">
				<button class="text-gray-400 hover:text-white"><Repeat size={18} /></button>
				<button class="text-gray-400 hover:text-white" onclick={() => media.playPrev()}
					><SkipBack size={20} fill="currentColor" /></button
				>
				<button
					class="flex justify-center items-center bg-white rounded-full w-10 h-10 text-black hover:scale-105 transition-transform"
					onclick={() => {
						if (!media.isLoadingTrack) media.togglePlay();
					}}
				>
					{#if media.isLoadingTrack}
						<Loader2 size={18} class="text-black animate-spin" />
					{:else if media.isPaused}
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
			<div class="flex items-center gap-3 w-full">
				<span class="w-10 tabular-nums text-gray-400 text-xs text-right"
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
					class="flex-1 bg-[#2A3241] bg-gradient-to-r from-primary-container to-primary-container bg-no-repeat rounded-full h-1 accent-primary-container appearance-none cursor-pointer"
				/>
				<span class="w-10 tabular-nums text-gray-400 text-xs">{formatTime(media.duration)}</span>
			</div>
		</div>

		<!-- Right: Volume & Extras (Desktop) -->
		<div class="hidden md:flex justify-end gap-4 pr-2 w-1/3">
			<button
				class="text-gray-400 hover:text-white transition-colors"
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
					class="bg-[#2A3241] bg-gradient-to-r from-white to-white bg-no-repeat opacity-0 group-hover:opacity-100 rounded-full w-24 h-1 transition-opacity accent-white appearance-none cursor-pointer"
				/>
			</div>
		</div>
	</div>
{/if}
