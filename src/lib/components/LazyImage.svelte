<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { lazyLoad } from '$lib/client/lazyLoad';
	import { saveThumbnail, getThumbnail } from '$lib/client/idb';
	import { Image as ImageIcon, Video, Music } from 'lucide-svelte';

	let {
		id,
		url,
		alt = 'Image',
		class: className = '',
		type = 'image',
		videoSrc = ''
	} = $props<{
		id: string;
		url: string;
		alt?: string;
		class?: string;
		type?: 'image' | 'video' | 'music';
		videoSrc?: string;
	}>();

	let loaded = $state(false);
	let error = $state(false);
	let imageSrc = $state<string | undefined>(undefined);
	let objectUrl = $state<string | undefined>(undefined);

	// Load from IDB or Network
	async function loadImage() {
		if (loaded || error) return;

		try {
			// 1. Check IDB
			const cachedBlob = await getThumbnail(id);
			if (cachedBlob) {
				objectUrl = URL.createObjectURL(cachedBlob);
				imageSrc = objectUrl;
				loaded = true;
				return;
			}

			// 2. Not in IDB, if no URL but it's a video and we have videoSrc, generate frame
			let blobToSave: Blob;

			if (!url && type === 'video' && videoSrc) {
				blobToSave = await generateVideoThumbnail(videoSrc);
			} else if (url) {
				// Fetch from network
				const res = await fetch(url);
				if (!res.ok) throw new Error('Failed to fetch image');
				blobToSave = await res.blob();
			} else {
				throw new Error('No URL provided');
			}

			// 3. Save to IDB
			await saveThumbnail(id, blobToSave);

			// 4. Display
			objectUrl = URL.createObjectURL(blobToSave);
			imageSrc = objectUrl;
			loaded = true;
		} catch (e) {
			console.error('LazyImage error:', e);
			error = true;
		}
	}

	function generateVideoThumbnail(src: string): Promise<Blob> {
		return new Promise((resolve, reject) => {
			const video = document.createElement('video');
			video.muted = true;
			video.crossOrigin = 'anonymous';
			video.src = src;

			video.onloadeddata = () => {
				video.currentTime = 0.1; // Seek to first frame
			};

			video.onseeked = () => {
				const canvas = document.createElement('canvas');
				canvas.width = video.videoWidth;
				canvas.height = video.videoHeight;
				const ctx = canvas.getContext('2d');
				if (ctx) {
					ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
					canvas.toBlob((blob) => {
						if (blob) resolve(blob);
						else reject(new Error('Canvas to Blob failed'));
					}, 'image/jpeg', 0.8);
				} else {
					reject(new Error('Canvas context failed'));
				}
			};

			video.onerror = (e) => reject(e);
		});
	}

	onDestroy(() => {
		if (objectUrl) {
			URL.revokeObjectURL(objectUrl);
		}
	});
</script>

<div
	class="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#0B0E14] {className}"
	use:lazyLoad
	onintersect={loadImage}
>
	{#if !loaded && !error}
		<!-- Skeleton Loader -->
		<div class="absolute inset-0 animate-pulse bg-[#1E2430]"></div>
	{/if}

	{#if error}
		<!-- Error State -->
		<div class="flex h-full w-full flex-col items-center justify-center bg-[#151921] text-gray-500">
			{#if type === 'video'}
				<Video size={24} />
			{:else if type === 'music'}
				<Music size={24} />
			{:else}
				<ImageIcon size={24} />
			{/if}
		</div>
	{:else if imageSrc}
		<img
			src={imageSrc}
			{alt}
			class="h-full w-full object-cover transition-opacity duration-300 {loaded ? 'opacity-100' : 'opacity-0'} {className}"
			onload={() => (loaded = true)}
		/>
	{/if}
</div>
