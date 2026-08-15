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
	import { media } from '$lib/client/mediaState.svelte';

	let { data } = $props<{ data: PageData }>();

	let audioFiles = $derived(data.audioFiles);
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

	<div class="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
		<div
			class="bg-primary-container col-span-1 flex flex-col items-center gap-6 rounded-2xl p-6 text-black md:flex-row lg:col-span-2"
		>
			<div class="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl shadow-lg md:h-32 md:w-32">
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

		<div class="flex flex-col justify-between rounded-2xl border border-[#2A3241] bg-[#151921] p-6">
			<div>
				<h3 class="mb-4 flex items-center gap-2 text-sm font-medium text-gray-400">
					<ListMusic size={18} /> Up Next
				</h3>

				{#if media.currentIndex !== -1 && media.currentIndex < media.playlist.length - 1}
					{@const nextTrack = media.playlist[media.currentIndex + 1]}
					<div class="flex items-center gap-4 rounded-lg border border-[#2A3241] bg-[#0B0E14] p-3">
						<div class="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-[#2A3241]">
							{#if nextTrack.thumbnailUrl}
								<img src={nextTrack.thumbnailUrl} alt="Cover" class="h-full w-full object-cover" />
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
		<div class="border-b border-[#2A3241] p-4">
			<button
				onclick={() => media.playTrack(0, audioFiles)}
				class="bg-primary-container flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-black transition-transform hover:scale-105"
			>
				<Play size={18} fill="currentColor" /> Play All
			</button>
		</div>
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
					{#each audioFiles as track, index}
						<tr
							class="group cursor-pointer transition-colors hover:bg-[#1E2430]"
							onclick={() => media.playTrack(index, audioFiles)}
						>
							<td class="px-4 py-3 text-center text-xs text-gray-400">
								{#if media.currentTrack === track && !media.isPaused}
									<div class="text-primary-container h-3 w-3">
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
											<polygon points="5 3 19 12 5 21 5 3"></polygon>
										</svg>
									</div>
								{:else}
									<span class="text-xs text-gray-500 group-hover:hidden">{index + 1}</span>
									<Play
										size={14}
										class="hidden text-gray-400 group-hover:block group-hover:text-white"
									/>
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
									<span class="font-medium text-gray-300 transition-colors group-hover:text-white"
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
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

{#if media.currentTrack}
	<div
		class="fixed right-0 bottom-0 left-0 z-50 flex h-24 items-center justify-between border-t border-[#2A3241] bg-[#0B0E14]/95 px-6 backdrop-blur md:left-[260px]"
	>
		<div class="flex w-1/3 min-w-0 items-center gap-4">
			<div class="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#2A3241] shadow-md">
				{#if media.currentTrack.thumbnailUrl}
					<img
						src={media.currentTrack.thumbnailUrl}
						alt="Cover"
						class="h-full w-full object-cover"
					/>
				{:else}
					<div class="flex h-full w-full items-center justify-center text-gray-500">
						<Music size={24} />
					</div>
				{/if}
			</div>
			<div class="flex min-w-0 flex-col">
				<span class="truncate font-medium text-white"
					>{media.currentTrack.title || media.currentTrack.fileName}</span
				>
				<span class="truncate text-sm text-gray-400"
					>{media.currentTrack.artist || 'Unknown Artist'}</span
				>
			</div>
			<button class="ml-2 text-gray-400 hover:text-white">
				<Heart size={18} />
			</button>
		</div>

		<!-- Center: Controls -->
		<div class="flex max-w-lg flex-1 flex-col items-center gap-2">
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

		<!-- Right: Volume & Extras -->
		<div class="flex w-1/3 justify-end gap-4 pr-2">
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
