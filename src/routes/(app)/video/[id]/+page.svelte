<script lang="ts">
	import { ArrowLeft, Play, Pause, Volume2, Maximize } from 'lucide-svelte';
	import type { PageData } from './$types';
	import { media } from '$lib/client/mediaState.svelte';
	import { onMount } from 'svelte';

	const { data }: { data: PageData } = $props();
	const { videoFile } = data;

	let videoElement: HTMLVideoElement | undefined = $state();
	let containerElement: HTMLDivElement | undefined = $state();
	let isBuffering = $state(true);

	let displayDuration = $derived(
		media.duration && !isNaN(media.duration) ? media.duration : videoFile.duration
	);

	function formatTime(seconds: number | null) {
		if (!seconds || isNaN(seconds)) return '0:00';
		const m = Math.floor(seconds / 60);
		const s = Math.floor(seconds % 60);
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	onMount(() => {
		// Set this video as the current track in the global media state
		if (media.currentTrack?.id !== videoFile.id) {
			media.playTrack(0, [videoFile]);
		}
	});

	function handleSeek(e: Event) {
		const target = e.target as HTMLInputElement;
		media.currentTime = Number(target.value);
	}

	function handleVolume(e: Event) {
		const target = e.target as HTMLInputElement;
		media.volume = Number(target.value);
	}

	function toggleFullscreen() {
		if (!document.fullscreenElement) {
			containerElement?.requestFullscreen().catch((err) => {
				console.error(`Error attempting to enable fullscreen: ${err.message}`);
			});
		} else {
			document.exitFullscreen();
		}
	}
</script>

<div class="group relative flex h-full flex-col bg-[#0B0E14] overflow-hidden rounded-xl" bind:this={containerElement}>
	<!-- Header -->
	<div
		class="absolute left-0 right-0 top-0 z-10 flex items-center gap-4 bg-gradient-to-b from-black/80 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
	>
		<a
			href="/video"
			class="rounded-full bg-black/40 p-2 text-white backdrop-blur-md transition-colors hover:bg-black/60"
			onclick={() => { media.isPaused = true; }}
		>
			<ArrowLeft size={20} />
		</a>
		<div class="min-w-0 flex-1">
			<h1 class="truncate text-lg font-bold text-white drop-shadow-md shadow-black">
				{videoFile.title || videoFile.fileName}
			</h1>
		</div>
	</div>

	<!-- Video Player Area -->
	<div class="relative flex flex-1 items-center justify-center overflow-hidden bg-black">
		<!-- svelte-ignore a11y_media_has_caption -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<video
			bind:this={videoElement}
			bind:currentTime={media.currentTime}
			bind:duration={media.duration}
			bind:paused={media.isPaused}
			bind:volume={media.volume}
			src={`/api/files/${videoFile.id}/download`}
			class="h-full w-full object-contain"
			autoplay
			onclick={() => media.togglePlay()}
			onwaiting={() => isBuffering = true}
			onplaying={() => isBuffering = false}
			oncanplay={() => isBuffering = false}
			onpause={() => isBuffering = false}
			onloadeddata={() => isBuffering = false}
		></video>

		{#if isBuffering}
			<div class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50">
				<div class="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-primary-container shadow-lg"></div>
			</div>
		{/if}

		<!-- Custom Controls Overlay -->
		<div
			class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
		>
			<!-- Progress Bar -->
			<div class="mb-4 flex items-center gap-3">
				<span class="w-12 font-mono text-sm text-white text-right">{formatTime(media.currentTime)}</span>
				<input
					type="range"
					min="0"
					max={displayDuration || 100}
					value={media.currentTime}
					oninput={handleSeek}
					style="background-size: {displayDuration
						? (media.currentTime / displayDuration) * 100
						: 0}% 100%;"
					class="from-primary-container to-primary-container accent-primary-container h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/20 bg-gradient-to-r bg-no-repeat"
				/>
				<span class="w-12 font-mono text-sm text-white">{formatTime(displayDuration)}</span>
			</div>

			<!-- Bottom Controls -->
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-6">
					<button
						class="hover:text-primary-container text-white transition-colors"
						onclick={() => media.togglePlay()}
					>
						{#if media.isPaused}
							<Play size={28} fill="currentColor" />
						{:else}
							<Pause size={28} fill="currentColor" />
						{/if}
					</button>

					<div class="group/vol flex items-center gap-2">
						<button
							class="hover:text-primary-container text-white transition-colors"
							onclick={() => (media.volume = media.volume === 0 ? 1 : 0)}
						>
							<Volume2 size={24} />
						</button>
						<input
							type="range"
							min="0"
							max="1"
							step="0.01"
							value={media.volume}
							oninput={handleVolume}
							style="background-size: {media.volume * 100}% 100%;"
							class="h-1.5 w-24 cursor-pointer appearance-none rounded-full bg-white/20 bg-gradient-to-r from-white to-white bg-no-repeat accent-white opacity-0 transition-opacity group-hover/vol:opacity-100"
						/>
					</div>
				</div>

				<button
					class="hover:text-primary-container text-white transition-colors"
					onclick={toggleFullscreen}
				>
					<Maximize size={24} />
				</button>
			</div>
		</div>
	</div>
</div>
