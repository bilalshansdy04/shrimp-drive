<script lang="ts">
	import {
		Search,
		Filter,
		UploadCloud,
		HardDrive,
		Folder,
		Music,
		Video,
		Image,
		FileText,
		Settings,
		LogOut
	} from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast, Toaster } from 'svelte-sonner';
	import { formatBytes } from '$lib/utils';
	import { media } from '$lib/client/mediaState.svelte';
	import { page } from '$app/stores';
	import '../../app.css';

	let isMusicRoute = $derived($page.url.pathname === '/music');
	let isTheatreRoute = $derived($page.url.pathname.startsWith('/video/') && $page.url.pathname.length > 7);
	let hideMiniPlayer = $derived(
		media.currentTrack
			? (media.currentTrack.fileType === 'audio' && isMusicRoute) ||
				(media.currentTrack.fileType === 'video' && isTheatreRoute)
			: true
	);

	let { data, children } = $props();

	let fileInput: HTMLInputElement;
	let isUploading = $state(false);
	let uploadProgress = $state(0);
	let toastId: string | number | undefined;

	let storagePercentage = $derived(
		data.user ? Math.min(100, (data.user.storageUsed / data.user.storageLimit) * 100) : 0
	);

	async function handleUpload(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		if (file.size > 20 * 1024 * 1024) {
			toast.error('File exceeds 20MB limit.');
			target.value = '';
			return;
		}

		const formData = new FormData();
		formData.append('file', file);
		
		const currentFolderId = $page.url.searchParams.get('folder');
		if (currentFolderId) {
			formData.append('folderId', currentFolderId);
		}

		if (file.type.startsWith('video/')) {
			toastId = toast.loading('Extracting thumbnail...', { description: 'Processing video frame' });
			try {
				const videoInfo = await new Promise<{ dataUrl: string | null; duration: number }>((resolve) => {
					const video = document.createElement('video');
					video.preload = 'metadata';
					video.muted = true;
					video.src = URL.createObjectURL(file);
					
					video.onloadedmetadata = () => {
						// Wait for duration to be valid
						if (video.duration === Infinity) {
							video.currentTime = 1e101;
							video.ontimeupdate = () => {
								video.ontimeupdate = null;
								video.currentTime = 0;
								// Now duration is known
							};
						}
					};

					video.onloadeddata = () => {
						// Ensure it's a valid number before seeking
						const safeDuration = isFinite(video.duration) && !isNaN(video.duration) ? video.duration : 0;
						video.currentTime = Math.min(1, safeDuration / 2 || 0);
					};

					video.onseeked = () => {
						const canvas = document.createElement('canvas');
						const ctx = canvas.getContext('2d');
						const safeDuration = isFinite(video.duration) && !isNaN(video.duration) ? video.duration : 0;
						if (!ctx) return resolve({ dataUrl: null, duration: safeDuration });

						const maxWidth = 320;
						const scale = Math.min(1, maxWidth / video.videoWidth);
						canvas.width = video.videoWidth * scale;
						canvas.height = video.videoHeight * scale;

						ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
						const dataUrl = canvas.toDataURL('image/webp', 0.8);
						URL.revokeObjectURL(video.src);
						resolve({ dataUrl, duration: safeDuration });
					};

					video.onerror = () => {
						URL.revokeObjectURL(video.src);
						resolve({ dataUrl: null, duration: 0 });
					};
				});

				if (videoInfo.dataUrl) {
					formData.append('videoThumbnail', videoInfo.dataUrl);
				}
				if (videoInfo.duration > 0) {
					formData.append('videoDuration', videoInfo.duration.toString());
				}
			} catch (e) {
				console.error('Thumbnail extraction failed', e);
			}
		} else if (file.type.startsWith('image/')) {
			toastId = toast.loading('Creating thumbnail...', { description: 'Compressing image' });
			try {
				const imageThumbnail = await new Promise<string | null>((resolve) => {
					const img = new window.Image();
					img.onload = () => {
						const canvas = document.createElement('canvas');
						const ctx = canvas.getContext('2d');
						if (!ctx) return resolve(null);

						const maxWidth = 320;
						const scale = Math.min(1, maxWidth / img.width);
						canvas.width = img.width * scale;
						canvas.height = img.height * scale;

						ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
						const dataUrl = canvas.toDataURL('image/webp', 0.8);
						URL.revokeObjectURL(img.src);
						resolve(dataUrl);
					};
					img.onerror = () => {
						// Fallback for unsupported formats like HEIC
						URL.revokeObjectURL(img.src);
						resolve(null);
					};
					img.src = URL.createObjectURL(file);
				});

				if (imageThumbnail) {
					formData.append('imageThumbnail', imageThumbnail);
				}
			} catch (e) {
				console.error('Image thumbnail extraction failed', e);
			}
		}

		isUploading = true;
		uploadProgress = 0;
		if (!toastId) {
			toastId = toast.loading('Starting upload...', { description: '0%' });
		} else {
			toast.loading('Starting upload...', { id: toastId, description: '0%' });
		}

		const xhr = new XMLHttpRequest();
		let lastProgress = -1;
        
		xhr.upload.addEventListener('progress', (event) => {
			if (event.lengthComputable) {
				const currentProgress = Math.round((event.loaded / event.total) * 100);
				if (currentProgress !== lastProgress) {
					lastProgress = currentProgress;
					
					if (currentProgress < 100) {
						toast.loading('Uploading to server...', {
							id: toastId,
							description: `${currentProgress}% - Sending file...`
						});
					} else {
						toast.loading('Processing...', {
							id: toastId,
							description: `100% - Saving to secure vault (Telegram). This might take a moment...`
						});
					}
				}
			}
		});

		xhr.addEventListener('load', async () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				toast.success('Upload complete!', { id: toastId, description: 'File saved successfully.' });
				await invalidateAll();
			} else {
				try {
					const responseData = JSON.parse(xhr.responseText);
					toast.error(responseData.error || 'Upload failed', { id: toastId, description: '' });
				} catch {
					toast.error('Upload failed', { id: toastId, description: '' });
				}
			}
			isUploading = false;
			target.value = '';
		});

		xhr.addEventListener('error', () => {
			toast.error('Connection timeout or network error.', { id: toastId, description: '' });
			isUploading = false;
			target.value = '';
		});

		xhr.open('POST', '/api/files/upload');
		xhr.send(formData);
	}
</script>

<Toaster theme="dark" position="top-right" offset="80px" />

<div class="flex h-screen w-full overflow-hidden bg-[#0B0E14] text-white">
	<!-- Sidebar -->
	<aside class="flex h-full w-[260px] shrink-0 flex-col border-r border-[#2A3241] bg-[#151921]">
		<!-- Brand -->
		<div class="flex h-[64px] items-center border-b border-[#2A3241] px-6">
			<div class="flex items-center gap-2 text-xl font-bold text-[#FF6B4A]">
				<span>🍤</span>
				<span class="text-white">Shrimp Drive</span>
			</div>
		</div>

		<!-- Navigation -->
		<div class="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-4">
			<!-- Main Links -->
			<nav class="flex flex-col gap-1">
				<a
					href="/dashboard"
					class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-[#2A3241] hover:text-white"
				>
					<HardDrive size={18} />
					Overview
				</a>
				<a
					href="/drive"
					class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-[#2A3241] hover:text-white"
				>
					<Folder size={18} />
					File Manager
				</a>
			</nav>

			<!-- Media Hubs -->
			<div>
				<h3 class="mb-2 px-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">
					Media Hubs
				</h3>
				<nav class="flex flex-col gap-1">
					<a
						href="/music"
						class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-[#2A3241] hover:text-white"
					>
						<Music size={18} />
						Music
					</a>
					<a
						href={media.currentTrack?.fileType === 'video' ? `/video/${media.currentTrack.id}` : "/video"}
						class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-[#2A3241] hover:text-white"
					>
						<Video size={18} />
						Video
					</a>
					<a
						href="/photo"
						class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-[#2A3241] hover:text-white"
					>
						<Image size={18} />
						Photo
					</a>
					<a
						href="/docs"
						class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-[#2A3241] hover:text-white"
					>
						<FileText size={18} />
						Docs
					</a>
				</nav>
			</div>
		</div>

		<!-- Footer Sidebar -->
		<div class="border-t border-[#2A3241] p-4">
			<div class="mb-4">
				<div class="mb-2 flex justify-between text-xs text-gray-400">
					<span>Storage (Telegram)</span>
					<span>{formatBytes(data.user?.storageUsed || 0)} / {formatBytes(data.user?.storageLimit || 0)}</span>
				</div>
				<div class="h-1.5 w-full overflow-hidden rounded-full bg-[#0B0E14]">
					<div class="h-full rounded-full bg-[#FF6B4A] transition-all duration-1000 ease-out" style="width: {storagePercentage}%;"></div>
				</div>
			</div>

			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-[#FF6B4A] to-purple-500 text-lg font-bold text-white uppercase">
					{data.user?.displayName?.[0] || 'U'}
				</div>
				<div class="flex-1 overflow-hidden">
					<p class="truncate text-sm font-medium">{data.user?.displayName || 'User Account'}</p>
				</div>
				<button class="p-1 text-gray-400 transition-colors hover:text-white" title="Settings">
					<Settings size={16} />
				</button>
				<form action="/logout" method="POST" use:enhance class="flex">
					<button class="p-1 text-gray-400 transition-colors hover:text-white" type="submit" title="Log Out">
						<LogOut size={16} />
					</button>
				</form>
			</div>
		</div>
	</aside>

	<!-- Main Canvas -->
	<main class="flex min-w-0 flex-1 flex-col overflow-hidden">
		<!-- Header -->
		<header
			class="z-10 flex h-[64px] shrink-0 items-center justify-between border-b border-[#2A3241] bg-[#0B0E14]/80 px-6 backdrop-blur"
		>
			<div class="flex flex-1 items-center gap-4">
				<div class="relative w-96">
					<Search size={18} class="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
					<input
						type="text"
						placeholder="Search files, metadata..."
						class="h-10 w-full rounded-full border border-[#2A3241] bg-[#151921] pr-4 pl-10 text-sm text-white placeholder-gray-500 focus:border-[#FF6B4A] focus:ring-1 focus:ring-[#FF6B4A] focus:outline-none"
					/>
				</div>

				<div class="hidden items-center gap-2 lg:flex">
					{#if media.currentTrack && !hideMiniPlayer}
						<!-- Mini Player -->
						<div class="flex items-center gap-3 rounded-full border border-[#2A3241] bg-[#151921] px-4 py-1.5 shadow-sm">
							{#if media.currentTrack.thumbnailUrl}
								<img 
									src={media.currentTrack.thumbnailUrl} 
									alt="Cover" 
									class="h-6 w-6 rounded object-cover"
								/>
							{:else}
								<div class="flex h-6 w-6 items-center justify-center rounded bg-[#2A3241] text-gray-500">
									{#if media.currentTrack.fileType === 'video'}
										<Video size={12} />
									{:else}
										<Music size={12} />
									{/if}
								</div>
							{/if}
							
							<div class="flex max-w-[120px] flex-col overflow-hidden">
								<span class="truncate text-xs font-medium text-white">{media.currentTrack.title || media.currentTrack.fileName}</span>
							</div>

							<div class="ml-2 flex items-center gap-2 border-l border-[#2A3241] pl-3">
								<button 
									onclick={() => media.togglePlay()}
									class="flex h-6 w-6 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105"
								>
									{#if media.isPaused}
										<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-0.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
									{:else}
										<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
									{/if}
								</button>
								<button 
									onclick={() => media.playNext()}
									class="text-gray-400 transition-colors hover:text-white"
								>
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
								</button>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<div class="ml-auto flex items-center gap-4 pl-4">
				<input type="file" id="global-file-upload" class="hidden" bind:this={fileInput} onchange={handleUpload} />
				<button
					onclick={() => fileInput.click()}
					disabled={isUploading}
					class="flex items-center gap-2 rounded-lg bg-[#FF6B4A] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#FF8266] disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<UploadCloud size={18} />
					{isUploading ? 'Uploading...' : 'Upload File'}
				</button>
			</div>
		</header>

		<!-- Dynamic Canvas -->
		<div class="flex-1 overflow-y-auto p-6">
			{@render children()}
		</div>
	</main>
</div>

<!-- Global Audio Element (Muted/Unmounted if on dedicated video route to prevent overlap) -->
{#if !($page.url.pathname.startsWith('/video/') && $page.url.pathname.length > 7)}
<audio
	bind:currentTime={media.currentTime}
	bind:duration={media.duration}
	bind:paused={media.isPaused}
	bind:volume={media.volume}
	src={media.currentTrack ? `/api/files/${media.currentTrack.id}/download` : undefined}
	onended={() => media.playNext()}
	autoplay
></audio>
{/if}
