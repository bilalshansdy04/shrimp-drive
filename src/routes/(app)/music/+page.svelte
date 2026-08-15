<script lang="ts">
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
		Volume2
	} from 'lucide-svelte';
	import type { PageData } from './$types';
	import { formatBytes, formatDate } from '$lib/utils';

	let { data } = $props<{ data: PageData }>();

	let audioFiles = $derived(data.audioFiles);
	let totalSize = $derived(audioFiles.reduce((acc: any, f: any) => acc + f.fileSize, 0));

	let currentTrackIndex = $state(-1);
	let currentTrack = $derived(currentTrackIndex >= 0 ? audioFiles[currentTrackIndex] : null);

	let audioElement: HTMLAudioElement;
	let isPaused = $state(true);
	let currentTime = $state(0);
	let duration = $state(0);
	let volume = $state(1);

	function playTrack(index: number) {
		currentTrackIndex = index;
		isPaused = false;
	}

	function togglePlay() {
		if (currentTrackIndex === -1 && audioFiles.length > 0) {
			playTrack(0);
		} else if (currentTrackIndex !== -1) {
			isPaused = !isPaused;
		}
	}

	function playNext() {
		if (currentTrackIndex < audioFiles.length - 1) {
			playTrack(currentTrackIndex + 1);
		}
	}

	function playPrev() {
		if (currentTrackIndex > 0) {
			playTrack(currentTrackIndex - 1);
		}
	}

	function handleSeek(e: MouseEvent) {
		const target = e.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const percentage = x / rect.width;
		if (duration > 0 && audioElement) {
			audioElement.currentTime = percentage * duration;
		}
	}

	function handleVolume(e: MouseEvent) {
		const target = e.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		const x = e.clientX - rect.left;
		volume = Math.max(0, Math.min(1, x / rect.width));
	}

	function formatTime(seconds: number) {
		if (!seconds || isNaN(seconds)) return '0:00';
		const m = Math.floor(seconds / 60);
		const s = Math.floor(seconds % 60);
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	function formatBitrate(fileSize: number, duration: number | null) {
		if (!duration || duration <= 0) return 'Unknown';
		// Calculate average bitrate: (bytes * 8) / seconds / 1000 = kbps
		const kbps = Math.round((fileSize * 8) / duration / 1000);
		
		// Snap to standard bitrates if within 15% to account for ID3 tag overhead
		const standardBitrates = [64, 96, 128, 160, 192, 256, 320, 1411];
		for (const std of standardBitrates) {
			if (Math.abs(kbps - std) / std < 0.15) return `${std} kbps`;
		}
		
		return `${kbps} kbps`;
	}
</script>

<audio
	bind:this={audioElement}
	bind:currentTime
	bind:duration
	bind:paused={isPaused}
	bind:volume
	src={currentTrack ? `/api/files/${currentTrack.id}/download` : undefined}
	onended={playNext}
	autoplay
></audio>

<div class="mx-auto max-w-[1280px] pb-24">
	<!-- pb-24 to clear bottom audio player -->
	<!-- Page Header -->
	<div class="mb-6 flex items-end justify-between">
		<div>
			<h1 class="mb-1 text-3xl font-bold text-white">Music Library</h1>
			<p class="text-sm text-gray-400">{audioFiles.length} tracks • {formatBytes(totalSize)}</p>
		</div>
		<div class="flex gap-2">
			<button
				class="flex items-center justify-center rounded-lg border border-[#2A3241] bg-[#151921] p-2 text-gray-400 transition-colors hover:bg-[#1E2430] hover:text-white"
			>
				<Filter size={18} />
			</button>
			<button
				class="flex items-center justify-center rounded-lg border border-[#2A3241] bg-[#151921] p-2 text-gray-400 transition-colors hover:bg-[#1E2430] hover:text-white"
			>
				<List size={18} />
			</button>
		</div>
	</div>

	<!-- Bento Grid Header / Featured -->
	<div class="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
		<!-- Featured Track (Hero) -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="group relative col-span-1 flex min-h-[200px] cursor-pointer flex-col justify-end overflow-hidden rounded-2xl border border-[#2A3241] bg-[#151921] p-6 lg:col-span-2"
			onclick={togglePlay}
		>
			<div
				class="absolute inset-0 z-0 bg-cover bg-center opacity-40 transition-transform duration-700 ease-out group-hover:scale-105"
				style="background-image: url('{currentTrack?.thumbnailUrl ||
					'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=1000'}')"
			></div>
			<div
				class="absolute inset-0 z-10 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/80 to-transparent"
			></div>

			<div class="relative z-20 flex w-full items-end justify-between">
				<div>
					{#if currentTrack && !isPaused}
						<div
							class="mb-2 inline-flex items-center gap-1 rounded border border-[#FF6B4A]/30 bg-[#FF6B4A]/10 px-2 py-0.5 text-[10px] font-medium tracking-wider text-[#FF6B4A] uppercase"
						>
							<Activity size={12} /> Now Playing
						</div>
					{/if}
					<h2 class="text-2xl font-bold text-white drop-shadow-md">
						{currentTrack?.title || currentTrack?.fileName || 'No track selected'}
					</h2>
					<p class="text-sm text-gray-400">
						{currentTrack?.artist || 'Unknown Artist'} • {currentTrack?.album || 'Unknown Album'}
					</p>
				</div>
				<button
					class="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF6B4A] text-[#0B0E14] shadow-[0_0_15px_rgba(255,107,74,0.3)] transition-all hover:scale-105 hover:bg-[#FF8264]"
				>
					{#if isPaused}
						<Play size={24} fill="currentColor" class="ml-1" />
					{:else}
						<Pause size={24} fill="currentColor" />
					{/if}
				</button>
			</div>
		</div>

		<!-- Audio Pipeline Stats -->
		<div class="flex flex-col justify-between rounded-2xl border border-[#2A3241] bg-[#151921] p-6">
			<div>
				<h3 class="mb-4 flex items-center gap-2 text-sm font-medium text-gray-400">
					<SlidersHorizontal size={18} /> Audio Pipeline Stats
				</h3>
				<div class="space-y-4">
					<div>
						<div class="mb-1 flex justify-between text-[11px] font-medium text-gray-400">
							<span>Stream Buffer</span>
							<span class="text-[#10B981]">Optimal</span>
						</div>
						<div
							class="h-1.5 w-full overflow-hidden rounded-full border border-[#2A3241] bg-[#10131a]"
						>
							<div class="h-full w-[85%] bg-[#10B981]"></div>
						</div>
					</div>
					<div>
						<div class="mb-1 flex justify-between text-[11px] font-medium text-gray-400">
							<span>Transcode Queue</span>
							<span>2 pending</span>
						</div>
						<div
							class="h-1.5 w-full overflow-hidden rounded-full border border-[#2A3241] bg-[#10131a]"
						>
							<div class="h-full w-[15%] bg-[#FF6B4A]"></div>
						</div>
					</div>
				</div>
			</div>
			<div class="mt-4 flex items-center justify-between border-t border-[#2A3241] pt-4">
				<span class="text-xs text-gray-400">Current Bitrate</span>
				<span class="text-xs font-medium text-[#FF6B4A]">
					{currentTrack ? formatBitrate(currentTrack.fileSize, currentTrack.duration) : '---'}
				</span>
			</div>
		</div>
	</div>

	<!-- Table Container -->
	<div class="overflow-hidden rounded-2xl border border-[#2A3241] bg-[#151921] shadow-lg">
		<div class="overflow-x-auto">
			<table class="w-full border-collapse text-left">
				<thead>
					<tr class="border-b border-[#2A3241] bg-[#10131a]">
						<th class="w-12 px-4 py-3 text-center text-xs font-medium text-gray-400">#</th>
						<th class="px-4 py-3 text-xs font-medium text-gray-400">Name</th>
						<th class="hidden px-4 py-3 text-xs font-medium text-gray-400 sm:table-cell">Artist</th>
						<th class="w-24 px-4 py-3 text-right text-xs font-medium text-gray-400">Duration</th>
						<th
							class="hidden w-28 px-4 py-3 text-right text-xs font-medium text-gray-400 md:table-cell"
							>Bitrate</th
						>
						<th
							class="hidden w-32 px-4 py-3 text-right text-xs font-medium text-gray-400 lg:table-cell"
							>Added</th
						>
						<th class="w-12 px-4 py-3 text-center"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-[#2A3241]/50 text-sm text-white">
					{#each audioFiles as track, i}
						<tr
							class="group cursor-pointer transition-colors hover:bg-[#1E2430] {currentTrackIndex ===
							i
								? 'relative bg-[#1E2430]/50'
								: ''}"
							onclick={() => playTrack(i)}
						>
							<td class="px-4 py-3 text-center text-xs text-gray-400">
								{#if currentTrackIndex === i}
									{#if isPaused}
										<Pause size={18} class="mx-auto text-[#FF6B4A]" />
									{:else}
										<Activity size={18} class="mx-auto text-[#FF6B4A]" />
									{/if}
								{:else}
									{i + 1}
								{/if}
							</td>
							<td class="px-4 py-3">
								<div class="flex items-center gap-3">
									<div
										class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded border border-[#2A3241] bg-[#10131a]"
									>
										{#if track.thumbnailUrl}
											<img
												class="h-full w-full object-cover"
												alt="Album Cover"
												src={track.thumbnailUrl}
											/>
										{:else}
											<Music size={16} class="text-gray-400" />
										{/if}
									</div>
									<span
										class="font-medium {currentTrackIndex === i
											? 'text-[#FF6B4A]'
											: 'text-gray-300 transition-colors group-hover:text-white'}"
										>{track.title || track.fileName}</span
									>
								</div>
							</td>
							<td class="hidden px-4 py-3 text-gray-400 sm:table-cell"
								>{track.artist || 'Unknown Artist'}</td
							>
							<td class="px-4 py-3 text-right text-xs text-gray-400 tabular-nums"
								>{formatTime(track.duration || 0)}</td
							>
							<td
								class="hidden px-4 py-3 text-right text-xs text-gray-400 tabular-nums md:table-cell"
								>{formatBitrate(track.fileSize, track.duration)}</td
							>
							<td class="hidden px-4 py-3 text-right text-xs text-gray-400 lg:table-cell"
								>{formatDate(track.createdAt)}</td
							>
							<td class="px-4 py-3 text-center">
								<button
									class="text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-white"
								>
									<MoreVertical size={18} />
								</button>
							</td>
							{#if currentTrackIndex === i}
								<!-- Active glow line -->
								<td
									class="absolute top-0 bottom-0 left-0 w-0.5 bg-[#FF6B4A] shadow-[0_0_8px_rgba(255,107,74,0.8)]"
								></td>
							{/if}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

<!-- Bottom Audio Player (Footer) -->
<div
	class="fixed right-0 bottom-0 z-50 flex h-20 w-full flex-col border-t border-[#2A3241] bg-[#151921] shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.5)] md:w-[calc(100%-260px)]"
>
	<!-- Progress Bar (Thin, full width top) -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="group relative h-1 w-full cursor-pointer bg-[#10131a]" onclick={handleSeek}>
		<div
			class="absolute top-0 left-0 h-full bg-[#FF6B4A]"
			style="width: {duration ? (currentTime / duration) * 100 : 0}%"
		></div>
		<!-- Thumb appears on hover -->
		<div
			class="absolute top-1/2 -ml-1.5 h-3 w-3 -translate-y-1/2 rounded-full bg-[#FF6B4A] opacity-0 shadow-[0_0_8px_rgba(255,107,74,0.6)] transition-opacity duration-150 group-hover:opacity-100"
			style="left: {duration ? (currentTime / duration) * 100 : 0}%"
		></div>
		<!-- Expanded hit area -->
		<div class="absolute -top-2 -bottom-2 left-0 w-full bg-transparent"></div>
	</div>

	<div class="flex flex-1 items-center justify-between px-6">
		<!-- Now Playing Info -->
		<div class="flex w-1/3 min-w-[200px] items-center gap-4">
			<div
				class="group relative flex h-12 w-12 cursor-pointer items-center justify-center overflow-hidden rounded border border-[#2A3241] bg-[#10131a]"
			>
				{#if currentTrack?.thumbnailUrl}
					<img
						class="h-full w-full object-cover"
						alt="Album Cover"
						src={currentTrack.thumbnailUrl}
					/>
				{:else}
					<Music size={20} class="text-gray-400" />
				{/if}
				<div
					class="absolute inset-0 hidden items-center justify-center bg-black/50 transition-all group-hover:flex"
				>
					<Maximize2 size={20} class="text-white" />
				</div>
			</div>
			<div class="overflow-hidden">
				<div class="cursor-pointer truncate text-sm font-medium text-white hover:underline">
					{currentTrack?.title || currentTrack?.fileName || 'No track selected'}
				</div>
				<div class="cursor-pointer truncate text-xs text-gray-400 hover:underline">
					{currentTrack?.artist || 'Unknown Artist'}
				</div>
			</div>
			<button class="ml-2 p-1 text-gray-400 transition-colors hover:text-[#FF6B4A]">
				<Heart size={20} />
			</button>
		</div>

		<!-- Playback Controls -->
		<div class="flex w-1/3 flex-1 flex-col items-center justify-center">
			<div class="flex items-center gap-6">
				<button class="text-gray-400 transition-colors hover:text-white active:scale-95">
					<Shuffle size={20} />
				</button>
				<button
					class="text-gray-400 transition-colors hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
					onclick={playPrev}
					disabled={currentTrackIndex <= 0}
				>
					<SkipBack size={24} fill="currentColor" />
				</button>
				<button
					class="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF6B4A] text-[#0B0E14] shadow-[0_0_10px_rgba(255,107,74,0.2)] transition-all hover:bg-[#FF8264] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
					onclick={togglePlay}
					disabled={audioFiles.length === 0}
				>
					{#if isPaused}
						<Play size={24} fill="currentColor" class="ml-1" />
					{:else}
						<Pause size={24} fill="currentColor" />
					{/if}
				</button>
				<button
					class="text-gray-400 transition-colors hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
					onclick={playNext}
					disabled={currentTrackIndex >= audioFiles.length - 1}
				>
					<SkipForward size={24} fill="currentColor" />
				</button>
				<button class="relative text-[#FF6B4A] transition-colors active:scale-95">
					<Repeat size={20} />
					<div
						class="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#FF6B4A]"
					></div>
				</button>
			</div>
		</div>

		<!-- Volume & Extra Actions -->
		<div class="flex w-1/3 min-w-[200px] items-center justify-end gap-4">
			<div class="w-20 text-right font-mono text-xs text-gray-400">
				{formatTime(currentTime)} / {formatTime(duration)}
			</div>
			<div class="mx-1 h-6 w-px bg-[#2A3241]"></div>
			<button class="text-gray-400 transition-colors hover:text-white">
				<ListMusic size={20} />
			</button>
			<div class="group flex items-center gap-2">
				<button
					class="text-gray-400 transition-colors hover:text-white"
					onclick={() => (volume = volume === 0 ? 1 : 0)}
				>
					<Volume2 size={20} />
				</button>
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="h-1 w-16 cursor-pointer overflow-hidden rounded-full border border-[#2A3241] bg-[#10131a]"
					onclick={handleVolume}
				>
					<div
						class="h-full bg-[#FF6B4A] transition-colors group-hover:bg-[#FF8264]"
						style="width: {volume * 100}%"
					></div>
				</div>
			</div>
		</div>
	</div>
</div>
