<script lang="ts">
	import { ArrowLeft, Play, Pause, Volume2, Maximize } from 'lucide-svelte';
	import type { PageData } from './$types';
	import { media } from '$lib/client/mediaState.svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	let { data }: { data: PageData } = $props();
	let videoFile = $derived(data.videoFile);

	let videoElement: HTMLVideoElement | undefined = $state();
	let containerElement: HTMLDivElement | undefined = $state();
	let isBuffering = $state(true);

	let currentTime = $state(0);
	let duration = $state(0);
	let isPaused = $state(false); // Autoplay is true, so initially not paused? Wait, video starts playing if possible.
	let volume = $state(1);

	let displayDuration = $derived(duration && !isNaN(duration) ? duration : videoFile.duration);

	let videoSrc = $state<string | undefined>(undefined);

	function formatTime(seconds: number | null) {
		if (!seconds || isNaN(seconds)) return '0:00';
		const m = Math.floor(seconds / 60);
		const s = Math.floor(seconds % 60);
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	onMount(() => {
		// Pause any globally playing music when opening a video
		if (!media.isPaused) {
			media.isPaused = true;
		}
	});

	
	let showWarning = $state(true);
	let streamConfirmed = $state(false);

	$effect(() => {
		if (videoFile && streamConfirmed) {
			let cancelled = false;
			media.loadTrack(videoFile).then((src) => {
				if (!cancelled) videoSrc = src || undefined;
			});
			return () => {
				cancelled = true;
			};
		} else {
			videoSrc = undefined;
		}
	});

	function handleStream() {
		showWarning = false;
		streamConfirmed = true;
	}

	function handleDownload() {
		import('$lib/client/mediaState.svelte').then(({ downloadFileClient }) => {
			downloadFileClient(videoFile, false);
		});
	}

	function handleCancel() {
		history.back();
	}


	function handleSeek(e: Event) {
		const target = e.target as HTMLInputElement;
		currentTime = Number(target.value);
	}

	function handleVolume(e: Event) {
		const target = e.target as HTMLInputElement;
		volume = Number(target.value);
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


{#if showWarning}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
		<div class="bg-[#151921] border border-[#2A3241] rounded-2xl p-6 max-w-md w-full shadow-2xl">
			<div class="flex items-center gap-3 mb-4 text-amber-500">
				<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
				<h2 class="text-xl font-bold text-white">Peringatan Streaming</h2>
			</div>
			<p class="text-gray-300 text-sm mb-6 leading-relaxed">
				Proses streaming video terkadang <strong>sangat berat dan lemot (buffering)</strong>. Hal ini dikarenakan web ini berjalan di atas sistem <em>Serverless (Vercel)</em>, dan file video Anda dipecah menjadi banyak <em>chunk</em> kecil di balik layar untuk mengatasi limitasi server gratis.
				<br><br>
				Untuk pengalaman menonton yang mulus, disarankan mengunduh (download) video ini terlebih dahulu.
			</p>
			
			<div class="flex flex-col gap-3">
				<button onclick={handleStream} class="w-full bg-[#FF6B4A]/20 hover:bg-[#FF6B4A]/30 text-[#FF6B4A] font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
					Lanjut Nonton (Stream)
				</button>
				<button onclick={handleDownload} class="w-full bg-[#56d9d8]/20 hover:bg-[#56d9d8]/30 text-[#56d9d8] font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
					Download Saja
				</button>
				<button onclick={handleCancel} class="w-full bg-transparent hover:bg-white/5 text-gray-400 font-medium py-3 px-4 rounded-xl transition-colors">
					Batal & Kembali
				</button>
			</div>
		</div>
	</div>
{/if}

<div
	class="group relative flex h-full flex-col overflow-hidden rounded-xl bg-[#0B0E14]"

	bind:this={containerElement}
>
	<!-- Header -->
	<div
		class="absolute top-0 right-0 left-0 z-10 flex items-center gap-4 bg-gradient-to-b from-black/80 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
	>
		<a
			href="/video"
			class="rounded-full bg-black/40 p-2 text-white backdrop-blur-md transition-colors hover:bg-black/60"
			onclick={() => {
				isPaused = true;
			}}
		>
			<ArrowLeft size={20} />
		</a>
		<div class="min-w-0 flex-1">
			<h1 class="truncate text-lg font-bold text-white shadow-black drop-shadow-md">
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
			bind:currentTime
			bind:duration
			bind:paused={isPaused}
			bind:volume
			src={videoSrc}
			class="h-full w-full object-contain"
			autoplay
			onclick={() => (isPaused = !isPaused)}
			onwaiting={() => (isBuffering = true)}
			onplaying={() => (isBuffering = false)}
			oncanplay={() => (isBuffering = false)}
			onpause={() => (isBuffering = false)}
			onloadeddata={() => (isBuffering = false)}
			onerror={() => {
				if (videoFile.isEncrypted && videoSrc) {
					toast.error(
						'File video rusak atau kunci dekripsi tidak cocok. Disarankan hapus file dan upload ulang'
					);
				}
			}}
		></video>

		{#if isBuffering}
			<div
				class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50"
			>
				<div
					class="border-t-primary-container h-12 w-12 animate-spin rounded-full border-4 border-white/20 shadow-lg"
				></div>
			</div>
		{/if}

		<!-- Custom Controls Overlay -->
		<div
			class="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
		>
			<!-- Progress Bar -->
			<div class="mb-4 flex items-center gap-3">
				<span class="w-12 text-right font-mono text-sm text-white">{formatTime(currentTime)}</span>
				<input
					type="range"
					min="0"
					max={displayDuration || 100}
					value={currentTime}
					oninput={handleSeek}
					style="background-size: {displayDuration
						? (currentTime / displayDuration) * 100
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
						onclick={() => (isPaused = !isPaused)}
					>
						{#if isPaused}
							<Play size={28} fill="currentColor" />
						{:else}
							<Pause size={28} fill="currentColor" />
						{/if}
					</button>

					<div class="group/vol flex items-center gap-2">
						<button
							class="hover:text-primary-container text-white transition-colors"
							onclick={() => (volume = volume === 0 ? 1 : 0)}
						>
							<Volume2 size={24} />
						</button>
						<input
							type="range"
							min="0"
							max="1"
							step="0.01"
							value={volume}
							oninput={handleVolume}
							style="background-size: {volume * 100}% 100%;"
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
