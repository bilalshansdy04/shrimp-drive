<script lang="ts">
	import {
		Image as ImageIcon,
		X,
		ChevronLeft,
		ChevronRight,
		Download,
		List,
		Grid2x2,
		Check
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { pushState, replaceState } from '$app/navigation';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
	const photoFiles = $derived(data.photoFiles);

	let viewMode = $state<'list' | 'grid'>('grid');
	let selectionMode = $state(false);
	let selectedIds = $state<string[]>([]);

	// Lightbox state
	let lightboxIndex = $state<number | null>(null);
	let highResLoaded = $state(false);
	const selectedPhoto = $derived(lightboxIndex !== null ? photoFiles[lightboxIndex] : null);

	onMount(() => {
		const viewId = $page.url.searchParams.get('view');
		if (viewId) {
			const index = photoFiles.findIndex((p) => p.id === viewId);
			if (index !== -1) {
				lightboxIndex = index;
			}
		}

		const handleKeydown = (e: KeyboardEvent) => {
			if (lightboxIndex === null) return;
			if (e.key === 'Escape') closeLightbox();
			if (e.key === 'ArrowRight') nextPhoto();
			if (e.key === 'ArrowLeft') prevPhoto();
		};

		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});

	$effect(() => {
		if (lightboxIndex !== null) {
			highResLoaded = false;
			replaceState(`?view=${photoFiles[lightboxIndex].id}`, { view: photoFiles[lightboxIndex].id });
		} else {
			replaceState('?', {});
		}
	});

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

	function handleItemClick(index: number) {
		const photo = photoFiles[index];
		if (selectionMode) {
			toggleSelection(photo.id);
		} else {
			lightboxIndex = index;
		}
	}

	function closeLightbox() {
		lightboxIndex = null;
	}

	function nextPhoto() {
		if (lightboxIndex !== null && lightboxIndex < photoFiles.length - 1) {
			lightboxIndex++;
		}
	}

	function prevPhoto() {
		if (lightboxIndex !== null && lightboxIndex > 0) {
			lightboxIndex--;
		}
	}

	function formatDate(date: Date | string | null) {
		if (!date) return 'Unknown date';
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatSize(bytes: number) {
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

	function longpress(
		node: HTMLElement,
		{ duration, callback }: { duration: number; callback: () => void }
	) {
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
				node.removeEventListener('touchcancel', handleMouseup);
			}
		};
	}
</script>

<div class="flex h-full flex-col overflow-y-auto p-6">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex items-center justify-between">
			<h1 class="text-3xl font-bold text-white">Photo Gallery</h1>
			{#if photoFiles.length > 0}
				<div class="flex items-center gap-2">
					<button
						onclick={toggleSelectionMode}
						class="flex items-center gap-2 rounded-lg border {selectionMode ? 'border-[#FF6B4A] bg-[#FF6B4A]/10 text-[#FF6B4A]' : 'border-[#2A3241] bg-[#151921] text-gray-400 hover:bg-[#1E2430] hover:text-white'} px-3 py-2 text-sm font-medium transition-colors"
						title={selectionMode ? 'Cancel Selection' : 'Select Items'}
					>
						<Check size={16} /> <span class="hidden sm:inline">{selectionMode ? 'Cancel' : 'Select'}</span>
					</button>
					<button
						onclick={() => (viewMode = viewMode === 'list' ? 'grid' : 'list')}
						class="flex items-center justify-center rounded-lg border border-[#2A3241] bg-[#151921] p-2 text-gray-400 transition-colors hover:bg-[#1E2430] hover:text-white"
						title="Toggle View"
					>
						{#if viewMode === 'list'}
							<List size={18} />
						{:else}
							<Grid2x2 size={18} />
						{/if}
					</button>
				</div>
			{/if}
		</div>
		<p class="mt-2 text-gray-400">View and organize your high-resolution memories</p>
	</div>

	{#if photoFiles.length === 0}
		<div
			class="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-[#2A3241] p-12 text-center"
		>
			<div class="mb-4 rounded-full bg-[#151921] p-4 text-gray-400">
				<ImageIcon size={48} />
			</div>
			<h3 class="mb-2 text-xl font-bold text-white">No photos yet</h3>
			<p class="max-w-sm text-gray-400">Upload your first photo to start building your gallery.</p>
		</div>
	{:else}
		{#if selectionMode && viewMode === 'grid'}
			<div
				class="mb-4 flex items-center justify-between rounded-xl border border-[#FF6B4A] bg-[#FF6B4A]/10 px-4 py-3"
			>
				<div class="flex items-center gap-4 text-[#FF6B4A]">
					<button onclick={toggleSelectionMode}><X size={20} /></button>
					<span class="font-medium">{selectedIds.length} Selected</span>
				</div>
				<div class="flex items-center gap-3">
					<button
						onclick={() => (selectedIds = photoFiles.map((f) => f.id))}
						class="text-sm font-medium text-[#FF6B4A] hover:underline">Select All</button
					>
					<button
						onclick={downloadSelected}
						class="flex items-center gap-1 rounded bg-[#FF6B4A] px-3 py-1.5 text-sm font-medium text-black disabled:opacity-50"
						disabled={selectedIds.length === 0}
					>
						<Download size={16} /> <span class="hidden sm:inline">Download</span>
					</button>
				</div>
			</div>
		{/if}

		{#if viewMode === 'grid'}
			<!-- Masonry Grid Layout -->
			<div class="columns-2 gap-4 space-y-4 sm:columns-3 lg:columns-4 xl:columns-5">
				{#each photoFiles as photo, i}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="group relative cursor-pointer break-inside-avoid overflow-hidden rounded-xl border bg-[#151921] {selectionMode &&
						selectedIds.includes(photo.id)
							? 'border-[#FF6B4A] ring-2 ring-[#FF6B4A]'
							: 'border-transparent'}"
						use:longpress={{
							duration: 500,
							callback: () => {
								if (!selectionMode) {
									selectionMode = true;
									selectedIds = [photo.id];
								}
							}
						}}
						onclick={() => handleItemClick(i)}
					>
						{#if selectionMode}
							<div
								class="absolute top-3 right-3 z-20 flex h-5 w-5 items-center justify-center rounded-full border {selectedIds.includes(
									photo.id
								)
									? 'border-[#FF6B4A] bg-[#FF6B4A]'
									: 'border-white bg-black/50'}"
							>
								{#if selectedIds.includes(photo.id)}
									<Check size={14} class="text-black" />
								{/if}
							</div>
						{/if}
						<img
							src={photo.thumbnailUrl || `/api/files/${photo.id}/download`}
							alt={photo.fileName}
							loading="lazy"
							decoding="async"
							class="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-105"
						/>

						<!-- Hover Overlay / Action -->
						{#if !selectionMode}
							<div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-100 transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100"></div>
							
							<div class="absolute bottom-0 left-0 right-0 z-10 flex items-end justify-between p-3 opacity-100 transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100">
								<p class="pointer-events-none mr-2 truncate text-sm font-medium text-white drop-shadow-md">
									{photo.fileName}
								</p>
								<button
									onclick={(e) => {
										e.stopPropagation();
										downloadFile(photo.id);
									}}
									class="shrink-0 rounded-full bg-white/20 p-2 text-white backdrop-blur transition-colors hover:bg-[#FF6B4A]"
									title="Download"
								>
									<Download size={14} />
								</button>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<div class="overflow-hidden rounded-2xl border border-[#2A3241] bg-[#151921] shadow-lg">
				<div class="w-full">
					<table class="w-full table-fixed border-collapse text-left">
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
								<th class="px-2 py-3 text-xs font-medium text-gray-400 sm:px-4">
									{#if selectionMode}
										<div class="flex flex-1 items-center justify-start text-[#FF6B4A]">
											<div class="flex items-center gap-3 sm:gap-4">
												<span class="text-sm font-medium sm:text-base"
													>{selectedIds.length} Selected</span
												>
												<button
													onclick={() => (selectedIds = photoFiles.map((f) => f.id))}
													class="text-sm font-medium hover:underline">Select All</button
												>
											</div>
										</div>
									{:else}
										Name
									{/if}
								</th>
								<th
									class="hidden w-28 px-4 py-3 text-right text-xs font-medium text-gray-400 sm:table-cell"
								>
									{#if !selectionMode}Size{/if}
								</th>
								<th
									class="hidden w-32 px-4 py-3 text-right text-xs font-medium text-gray-400 md:table-cell"
								>
									{#if !selectionMode}Added{/if}
								</th>
								<th class="w-12 px-2 py-3 text-center sm:w-16">
									{#if selectionMode}
										<button
											onclick={downloadSelected}
											class="mx-auto flex h-7 w-7 items-center justify-center rounded bg-[#FF6B4A] text-black transition-opacity hover:opacity-90 disabled:opacity-50 sm:h-8 sm:w-8"
											disabled={selectedIds.length === 0}
											title="Download Selected"
										>
											<Download size={16} />
										</button>
									{/if}
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-[#2A3241]/50 text-sm text-white">
							{#each photoFiles as photo, index}
								<tr
									class="group cursor-pointer transition-colors hover:bg-[#1E2430] {selectionMode &&
									selectedIds.includes(photo.id)
										? 'bg-[#FF6B4A]/10'
										: ''}"
									use:longpress={{
										duration: 500,
										callback: () => {
											if (!selectionMode) {
												selectionMode = true;
												selectedIds = [photo.id];
											}
										}
									}}
									onclick={() => handleItemClick(index)}
								>
									<td class="px-2 py-3 text-center text-xs text-gray-400 sm:px-4">
										{#if selectionMode}
											<div
												class="h-4 w-4 rounded border {selectedIds.includes(photo.id)
													? 'border-[#FF6B4A] bg-[#FF6B4A]'
													: 'border-[#2A3241]'} mx-auto flex items-center justify-center"
											>
												{#if selectedIds.includes(photo.id)}
													<Check size={12} class="text-black" />
												{/if}
											</div>
										{:else}
											<span class="text-xs text-gray-500 group-hover:hidden">{index + 1}</span>
											<ImageIcon
												size={14}
												class="mx-auto hidden text-gray-400 group-hover:block group-hover:text-white"
											/>
										{/if}
									</td>
									<td class="px-2 py-3 sm:px-4">
										<div class="flex items-center gap-3">
											<div
												class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-[#0B0E14]"
											>
												<img
													class="h-full w-full object-cover"
													alt="Thumbnail"
													src={photo.thumbnailUrl || `/api/files/${photo.id}/download`}
												/>
											</div>
											<span
												class="max-w-[150px] truncate font-medium text-gray-300 transition-colors group-hover:text-white sm:max-w-xs"
												>{photo.fileName}</span
											>
										</div>
									</td>
									<td
										class="hidden px-4 py-3 text-right text-xs text-gray-400 tabular-nums sm:table-cell"
										>{formatSize(photo.fileSize)}</td
									>
									<td class="hidden px-4 py-3 text-right text-xs text-gray-400 md:table-cell"
										>{formatDate(photo.createdAt)}</td
									>
									<td class="px-2 py-3 text-center">
										<button
											onclick={(e) => {
												e.stopPropagation();
												downloadFile(photo.id);
											}}
											class="text-gray-400 opacity-100 transition-opacity group-hover:opacity-100 hover:text-[#FF6B4A] sm:opacity-0"
											title="Download"><Download size={18} /></button
										>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	{/if}
</div>

<!-- Lightbox Modal -->
{#if selectedPhoto && lightboxIndex !== null}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
		onclick={closeLightbox}
	>
		<!-- Close Button -->
		<button
			class="absolute top-6 right-6 z-50 rounded-full bg-black/50 p-3 text-white transition-colors hover:bg-white/20"
			onclick={(e) => {
				e.stopPropagation();
				closeLightbox();
			}}
			aria-label="Close"
		>
			<X size={24} />
		</button>

		<!-- Prev Button -->
		{#if lightboxIndex > 0}
			<button
				class="absolute left-6 z-50 rounded-full bg-black/50 p-4 text-white transition-colors hover:bg-white/20"
				onclick={(e) => {
					e.stopPropagation();
					prevPhoto();
				}}
				aria-label="Previous photo"
			>
				<ChevronLeft size={32} />
			</button>
		{/if}

		<!-- Next Button -->
		{#if lightboxIndex < photoFiles.length - 1}
			<button
				class="absolute right-6 z-50 rounded-full bg-black/50 p-4 text-white transition-colors hover:bg-white/20"
				onclick={(e) => {
					e.stopPropagation();
					nextPhoto();
				}}
				aria-label="Next photo"
			>
				<ChevronRight size={32} />
			</button>
		{/if}

		<!-- Image Container -->
		<div
			class="relative flex h-full w-full max-w-[90vw] items-center justify-center p-8"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Progressive Loading: Show thumbnail first, then high-res -->
			{#if !highResLoaded && selectedPhoto.thumbnailUrl}
				<img
					src={selectedPhoto.thumbnailUrl}
					alt="Thumbnail"
					class="absolute max-h-[90vh] max-w-full object-contain blur-md transition-all duration-300"
				/>
			{/if}

			<img
				src={`/api/files/${selectedPhoto.id}/download`}
				alt={selectedPhoto.fileName}
				onload={() => (highResLoaded = true)}
				class="relative z-10 max-h-[90vh] max-w-full object-contain transition-opacity duration-500"
				class:opacity-0={!highResLoaded && selectedPhoto.thumbnailUrl}
				class:opacity-100={highResLoaded || !selectedPhoto.thumbnailUrl}
			/>

			<!-- Photo Details Overlay -->
			<div
				class="absolute right-0 bottom-6 left-0 z-20 flex justify-center opacity-0 transition-opacity duration-300 hover:opacity-100"
			>
				<div
					class="flex items-center gap-4 rounded-full bg-black/60 px-6 py-3 text-white backdrop-blur-md"
				>
					<div class="max-w-[200px] truncate font-medium sm:max-w-[400px]">
						{selectedPhoto.fileName}
					</div>
					<div class="h-4 w-px bg-white/30"></div>
					<div class="text-sm text-gray-300">
						{formatDate(selectedPhoto.createdAt)}
					</div>
					<a
						href={`/api/files/${selectedPhoto.id}/download`}
						download={selectedPhoto.fileName}
						class="ml-2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
						title="Download High-Res"
						onclick={(e) => e.stopPropagation()}
					>
						<Download size={16} />
					</a>
				</div>
			</div>
		</div>
	</div>
{/if}
