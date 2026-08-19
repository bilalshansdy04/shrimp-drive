<script lang="ts">
	import { media } from '$lib/client/mediaState.svelte';
	import { parseLrc, type LyricLine } from '$lib/client/lrcParser';
	import { Disc, Music2, Edit3, Loader2, Search } from 'lucide-svelte';

	import { toast } from 'svelte-sonner';

	let loading = $state(false);
	let status = $state<'loading' | 'found' | 'not_found'>('loading');
	let lyricsSource = $state<string>('');
	let lyricsList = $state<LyricLine[]>([]);
	let romajiLyricsList = $state<LyricLine[]>([]);
	let plainLyrics = $state<string | null>(null);
	let isRomajiMode = $state(false);
	let romanizedType = $state<'romaji' | 'romanized' | null>(null);

	let isEditing = $state(false);
	let editText = $state('');
	let saving = $state(false);
	
	let isSearching = $state(false);
	let searchQuery = $state('');
	let searchResults = $state<any[]>([]);
	let searchLoading = $state(false);
	let searchTimeout: any;

	let currentTrackId = $derived(media.currentTrack?.id);
	
	let activeList = $derived(isRomajiMode && romajiLyricsList.length > 0 ? romajiLyricsList : lyricsList);

	let activeLineIndex = $derived.by(() => {
		if (activeList.length === 0) return -1;
		const time = media.currentTime;
		for (let i = activeList.length - 1; i >= 0; i--) {
			if (time >= activeList[i].time) {
				return i;
			}
		}
		return -1;
	});

	// Auto scroll logic
	let container: HTMLElement;
	
	$effect(() => {
		if (activeLineIndex >= 0 && container && !isEditing) {
			const activeEl = container.querySelector(`[data-index="${activeLineIndex}"]`) as HTMLElement;
			if (activeEl) {
				const containerHeight = container.clientHeight;
				const scrollTarget = activeEl.offsetTop - containerHeight / 2 + activeEl.clientHeight / 2;
				container.scrollTo({ top: scrollTarget, behavior: 'smooth' });
			}
		}
	});

	function formatTime(seconds: number) {
		const m = Math.floor(seconds / 60).toString().padStart(2, '0');
		const s = (seconds % 60).toFixed(2).padStart(5, '0');
		return `${m}:${s}`;
	}

	function startEditing() {
		isEditing = true;
		isSearching = false;
		if (lyricsList.length > 0) {
			editText = lyricsList.map(l => `[${formatTime(l.time)}] ${l.text}`).join('\n');
		} else if (plainLyrics) {
			editText = plainLyrics;
		} else {
			editText = '';
		}
	}

	function startSearch() {
		isSearching = true;
		isEditing = false;
		searchQuery = `${media.currentTrack?.title || ''} ${media.currentTrack?.artist || ''}`.trim();
		performSearch();
	}

	function handleSearchInput() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			performSearch();
		}, 300);
	}

	async function performSearch() {
		if (!searchQuery.trim()) {
			searchResults = [];
			return;
		}
		searchLoading = true;
		try {
			const res = await fetch(`/api/lyrics/search?q=${encodeURIComponent(searchQuery)}`);
			if (res.ok) {
				const data = await res.json();
				searchResults = data.results || [];
			} else {
				searchResults = [];
			}
		} catch (e) {
			console.error('Search error', e);
			searchResults = [];
		} finally {
			searchLoading = false;
		}
	}

	function selectSearchResult(result: any) {
		const text = result.syncedLyrics || result.plainLyrics || '';
		editText = text;
		isSearching = false;
		isEditing = true;
	}

	async function saveLyrics() {
		if (!currentTrackId) return;
		saving = true;
		try {
			const res = await fetch(`/api/files/${currentTrackId}/lyrics`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ lyricsText: editText, clear: false })
			});
			if (res.ok) {
				toast.success('Lyrics saved successfully');
				isEditing = false;
				await fetchLyrics(currentTrackId);
			} else {
				toast.error('Failed to save lyrics');
			}
		} catch (e) {
			toast.error('Error saving lyrics');
		} finally {
			saving = false;
		}
	}

	async function clearLyrics() {
		if (!currentTrackId) return;
		if (!confirm('Are you sure you want to remove lyrics?')) return;
		saving = true;
		try {
			const res = await fetch(`/api/files/${currentTrackId}/lyrics`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ clear: true })
			});
			if (res.ok) {
				toast.success('Lyrics removed');
				isEditing = false;
				await fetchLyrics(currentTrackId);
			} else {
				toast.error('Failed to remove lyrics');
			}
		} catch (e) {
			toast.error('Error removing lyrics');
		} finally {
			saving = false;
		}
	}

	async function fetchLyrics(id: string) {
		loading = true;
		status = 'loading';
		lyricsList = [];
		romajiLyricsList = [];
		plainLyrics = null;
		isEditing = false;
		
		try {
			const res = await fetch(`/api/files/${id}/lyrics`);
			if (res.ok) {
				const data = await res.json();
				if (data.status === 'found') {
					status = 'found';
					lyricsSource = data.source;
					romanizedType = data.romanizedType || null;
					if (data.syncedLyrics) {
						lyricsList = parseLrc(data.syncedLyrics);
					} 
					if (data.romajiLyrics) {
						romajiLyricsList = parseLrc(data.romajiLyrics);
					}
					if (!data.syncedLyrics && data.plainLyrics) {
						plainLyrics = data.plainLyrics;
					}
				} else {
					status = 'not_found';
				}
			} else {
				status = 'not_found';
			}
		} catch (e) {
			console.error('Failed to fetch lyrics', e);
			status = 'not_found';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (currentTrackId) {
			fetchLyrics(currentTrackId);
		}
	});

	function seekTo(time: number) {
		media.currentTime = time;
	}
</script>

<div class="flex h-full w-full flex-col overflow-hidden bg-[#0B0E14] p-6 text-white">
	<div class="mb-6 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<h2 class="text-xl font-bold">Lyrics</h2>
			{#if status === 'found'}
				<div class="flex items-center gap-3">
					<p class="text-xs text-gray-500 capitalize">Source: {lyricsSource}</p>
					{#if !isEditing}
						<button class="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors" onclick={startEditing} title="Edit Lyrics">
							<Edit3 size={12} /> Edit
						</button>
					{/if}
				</div>
			{/if}
		</div>
		
		{#if romajiLyricsList.length > 0 && romanizedType}
			<div class="flex w-full sm:w-auto items-center rounded-lg bg-[#151921] p-1 border border-[#2A3241]">
				<button 
					class="flex-1 px-3 py-1 text-xs font-medium rounded-md transition-colors"
					class:bg-[#2A3241]={!isRomajiMode}
					class:text-white={!isRomajiMode}
					class:text-gray-400={isRomajiMode}
					onclick={() => isRomajiMode = false}
				>
					Original
				</button>
				<button 
					class="flex-1 px-3 py-1 text-xs font-medium rounded-md transition-colors"
					class:bg-[#2A3241]={isRomajiMode}
					class:text-white={isRomajiMode}
					class:text-gray-400={!isRomajiMode}
					onclick={() => isRomajiMode = true}
				>
					{romanizedType === 'romaji' ? 'Romaji' : 'Romanized'}
				</button>
			</div>
		{/if}
	</div>

	<div 
		bind:this={container}
		class="relative flex-1 overflow-y-auto no-scrollbar scroll-smooth pb-32"
	>
		{#if isSearching}
			<div class="flex h-full flex-col">
				<div class="mb-4 flex items-center gap-3">
					<div class="relative flex-1">
						<Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
						<input 
							type="text" 
							bind:value={searchQuery}
							oninput={handleSearchInput}
							placeholder="Search track or artist..."
							class="w-full rounded-md border border-[#2A3241] bg-[#151921] py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 focus:border-[#FF6B4A] focus:outline-none focus:ring-1 focus:ring-[#FF6B4A]"
						/>
					</div>
					<button 
						class="rounded-md px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:text-white"
						onclick={() => {
							isSearching = false;
							if (lyricsList.length === 0 && !plainLyrics && !editText) {
								isEditing = false;
							} else {
								isEditing = true;
							}
						}}
					>
						Cancel
					</button>
				</div>
				<div class="flex-1 overflow-y-auto rounded-lg border border-[#2A3241] bg-[#151921] p-2 no-scrollbar">
					{#if searchLoading}
						<div class="flex h-32 items-center justify-center">
							<Loader2 size={24} class="animate-spin text-[#FF6B4A]" />
						</div>
					{:else if searchResults.length === 0}
						<div class="flex h-32 items-center justify-center text-sm text-gray-500">
							No results found.
						</div>
					{:else}
						<div class="space-y-1">
							{#each searchResults as result}
								<button 
									class="flex w-full flex-col items-start rounded-md p-3 text-left transition-colors hover:bg-[#2A3241]"
									onclick={() => selectSearchResult(result)}
								>
									<div class="flex w-full items-center justify-between">
										<span class="font-medium text-white line-clamp-1">{result.trackName}</span>
										{#if result.syncedLyrics}
											<span class="shrink-0 rounded bg-green-500/20 px-1.5 py-0.5 text-[10px] font-medium text-green-400">Synced LRC</span>
										{:else}
											<span class="shrink-0 rounded bg-gray-500/20 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">Plain Text</span>
										{/if}
									</div>
									<div class="mt-1 flex items-center gap-2 text-xs text-gray-400">
										<span class="line-clamp-1">{result.artistName}</span>
										<span class="shrink-0 text-gray-600">•</span>
										<span class="shrink-0">{formatTime(result.duration)}</span>
									</div>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{:else if isEditing}
			<div class="flex h-full flex-col">
				<textarea
					bind:value={editText}
					class="w-full flex-1 resize-none rounded-lg border border-[#2A3241] bg-[#151921] p-4 text-sm font-mono text-gray-300 focus:border-[#FF6B4A] focus:outline-none focus:ring-1 focus:ring-[#FF6B4A]"
					placeholder="Paste LRC format lyrics here...&#10;[00:12.34] Example line 1&#10;[00:15.67] Example line 2&#10;&#10;Or plain text without time tags."
					disabled={saving}
				></textarea>
				<div class="mt-4 flex items-center justify-between gap-4">
					<button 
						class="rounded-md border border-red-900/50 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/20 disabled:opacity-50"
						onclick={clearLyrics}
						disabled={saving}
					>
						Remove Lyrics
					</button>
					<div class="flex gap-3">
						<button 
							class="flex items-center justify-center rounded-md border border-[#2A3241] bg-[#151921] px-3 py-2 text-gray-300 transition-colors hover:bg-[#1A202A] hover:text-white disabled:opacity-50"
							onclick={startSearch}
							disabled={saving}
							title="Search Online"
						>
							<Search size={16} />
						</button>
						<button 
							class="rounded-md px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:text-white disabled:opacity-50"
							onclick={() => isEditing = false}
							disabled={saving}
						>
							Cancel
						</button>
						<button 
							class="flex items-center gap-2 rounded-md bg-[#FF6B4A] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#ff5733] disabled:opacity-50"
							onclick={saveLyrics}
							disabled={saving}
						>
							{#if saving}
								<Loader2 size={16} class="animate-spin" />
							{/if}
							Save Changes
						</button>
					</div>
				</div>
			</div>
		{:else if status === 'loading'}
			<div class="flex h-full flex-col items-center justify-center space-y-4 opacity-50">
				<Loader2 size={32} class="animate-spin text-[#FF6B4A]" />
				<p class="text-sm">Loading lyrics...</p>
			</div>
		{:else if status === 'found'}
			{#if activeList.length > 0}
				<div class="space-y-6 px-4">
					{#each activeList as line, index}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div 
							data-index={index}
							class="cursor-pointer text-xl sm:text-2xl font-bold transition-all duration-300 hover:text-white"
							class:text-[#FF6B4A]={index === activeLineIndex}
							class:opacity-100={index === activeLineIndex}
							class:text-gray-500={index !== activeLineIndex}
							class:opacity-50={index !== activeLineIndex}
							onclick={() => seekTo(line.time)}
						>
							{line.text || '♪'}
						</div>
					{/each}
				</div>
			{:else if plainLyrics}
				<div class="whitespace-pre-wrap text-lg font-medium leading-relaxed text-gray-300">
					{plainLyrics}
				</div>
			{/if}
		{:else if status === 'not_found'}
			<div class="flex h-full flex-col items-center justify-center text-center">
				<div class="mb-6 relative">
					<div class="absolute -inset-4 rounded-full bg-[#FF6B4A]/10 animate-pulse"></div>
					<Disc size={64} class="text-gray-600" />
				</div>
				<h3 class="mb-2 text-xl font-semibold text-white">Lyrics not available</h3>
				<p class="mb-6 max-w-sm text-sm text-gray-400">
					We couldn't find synced lyrics for this track automatically.
				</p>
				<div class="flex items-center gap-3">
					<button 
						class="flex items-center gap-2 rounded-full bg-[#FF6B4A] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#ff5733]"
						onclick={startSearch}
					>
						<Search size={16} /> Search Online
					</button>
					<button 
						class="flex items-center gap-2 rounded-full border border-[#2A3241] bg-[#151921] px-6 py-3 text-sm font-medium transition-colors hover:bg-[#1A202A]"
						onclick={startEditing}
					>
						<Edit3 size={16} /> Add Manually
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	/* Hide scrollbar for Chrome, Safari and Opera */
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}

	/* Hide scrollbar for IE, Edge and Firefox */
	.no-scrollbar {
		-ms-overflow-style: none;  /* IE and Edge */
		scrollbar-width: none;  /* Firefox */
	}
</style>
