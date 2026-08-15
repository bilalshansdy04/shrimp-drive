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
	import '../../app.css';

	let { data, children } = $props();

	let fileInput: HTMLInputElement;
	let isUploading = $state(false);
	let uploadProgress = $state(0);
	let toastId: string | number | undefined;

	let storagePercentage = $derived(
		data.user ? Math.min(100, (data.user.storageUsed / data.user.storageLimit) * 100) : 0
	);

	function handleUpload(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		if (file.size > 20 * 1024 * 1024) {
			toast.error('File exceeds 20MB limit.');
			target.value = '';
			return;
		}

		isUploading = true;
		uploadProgress = 0;
		toastId = toast.loading('Starting upload...', { 
			description: '0%'
		});

		const formData = new FormData();
		formData.append('file', file);

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
						href="/video"
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
					<button
						class="flex items-center gap-1 rounded-full border border-[#2A3241] bg-[#151921] px-3 py-1.5 text-xs text-gray-300 transition-colors hover:text-white"
					>
						All
					</button>
					<button
						class="flex items-center gap-1 rounded-full border border-[#2A3241] bg-[#151921] px-3 py-1.5 text-xs text-gray-300 transition-colors hover:text-white"
					>
						Audio
					</button>
					<button
						class="flex items-center gap-1 rounded-full border border-[#2A3241] bg-[#151921] px-3 py-1.5 text-xs text-gray-300 transition-colors hover:text-white"
					>
						Video
					</button>
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
