<script lang="ts">
	import { Image as ImageIcon, X, ChevronLeft, ChevronRight, Download } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { pushState, replaceState } from '$app/navigation';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
	const photoFiles = $derived(data.photoFiles);

	// Lightbox state
	let selectedIndex = $state<number | null>(null);
	let highResLoaded = $state(false);

	// Derived currently selected photo
	const selectedPhoto = $derived(selectedIndex !== null ? photoFiles[selectedIndex] : null);

	// Handle URL state on mount
	onMount(() => {
		const viewId = $page.url.searchParams.get('view');
		if (viewId) {
			const index = photoFiles.findIndex((p) => p.id === viewId);
			if (index !== -1) {
				selectedIndex = index;
			}
		}

		// Keyboard navigation
		const handleKeydown = (e: KeyboardEvent) => {
			if (selectedIndex === null) return;
			if (e.key === 'Escape') closeLightbox();
			if (e.key === 'ArrowRight') nextPhoto();
			if (e.key === 'ArrowLeft') prevPhoto();
		};

		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});

	// Reset high-res loaded state when selection changes
	$effect(() => {
		if (selectedIndex !== null) {
			highResLoaded = false;
			// Update URL without page reload
			replaceState(`?view=${photoFiles[selectedIndex].id}`, { view: photoFiles[selectedIndex].id });
		} else {
			// Clear URL when closed
			replaceState('?', {});
		}
	});

	function openLightbox(index: number) {
		selectedIndex = index;
	}

	function closeLightbox() {
		selectedIndex = null;
	}

	function nextPhoto() {
		if (selectedIndex !== null && selectedIndex < photoFiles.length - 1) {
			selectedIndex++;
		}
	}

	function prevPhoto() {
		if (selectedIndex !== null && selectedIndex > 0) {
			selectedIndex--;
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
</script>

<div class="flex h-full flex-col overflow-y-auto p-6">
	<!-- Header -->
	<div class="mb-8 flex items-end justify-between">
		<div>
			<h1 class="text-3xl font-bold text-white">Photo Gallery</h1>
			<p class="mt-2 text-gray-400">View and organize your high-resolution memories</p>
		</div>
	</div>

	{#if photoFiles.length === 0}
		<div class="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-[#2A3241] p-12 text-center">
			<div class="mb-4 rounded-full bg-[#151921] p-4 text-gray-400">
				<ImageIcon size={48} />
			</div>
			<h3 class="mb-2 text-xl font-bold text-white">No photos yet</h3>
			<p class="max-w-sm text-gray-400">
				Upload your first photo to start building your gallery.
			</p>
		</div>
	{:else}
		<!-- Masonry Grid Layout -->
		<div class="columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5 space-y-4">
			{#each photoFiles as photo, i}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="group relative cursor-pointer overflow-hidden rounded-xl bg-[#151921] break-inside-avoid"
					onclick={() => openLightbox(i)}
				>
					<img
						src={photo.thumbnailUrl || `/api/files/${photo.id}/download`}
						alt={photo.fileName}
						loading="lazy"
						decoding="async"
						class="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
					/>
					
					<!-- Hover Overlay -->
					<div class="absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-4">
						<p class="truncate text-sm font-medium text-white drop-shadow-md">
							{photo.fileName}
						</p>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Lightbox Modal -->
{#if selectedPhoto && selectedIndex !== null}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div 
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
		onclick={closeLightbox}
	>
		<!-- Close Button -->
		<button
			class="absolute top-6 right-6 z-50 rounded-full bg-black/50 p-3 text-white transition-colors hover:bg-white/20"
			onclick={(e) => { e.stopPropagation(); closeLightbox(); }}
			aria-label="Close"
		>
			<X size={24} />
		</button>

		<!-- Prev Button -->
		{#if selectedIndex > 0}
			<button
				class="absolute left-6 z-50 rounded-full bg-black/50 p-4 text-white transition-colors hover:bg-white/20"
				onclick={(e) => { e.stopPropagation(); prevPhoto(); }}
				aria-label="Previous photo"
			>
				<ChevronLeft size={32} />
			</button>
		{/if}

		<!-- Next Button -->
		{#if selectedIndex < photoFiles.length - 1}
			<button
				class="absolute right-6 z-50 rounded-full bg-black/50 p-4 text-white transition-colors hover:bg-white/20"
				onclick={(e) => { e.stopPropagation(); nextPhoto(); }}
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
				onload={() => highResLoaded = true}
				class="relative z-10 max-h-[90vh] max-w-full object-contain transition-opacity duration-500"
				class:opacity-0={!highResLoaded && selectedPhoto.thumbnailUrl}
				class:opacity-100={highResLoaded || !selectedPhoto.thumbnailUrl}
			/>

			<!-- Photo Details Overlay -->
			<div class="absolute bottom-6 left-0 right-0 z-20 flex justify-center opacity-0 transition-opacity duration-300 hover:opacity-100">
				<div class="flex items-center gap-4 rounded-full bg-black/60 px-6 py-3 text-white backdrop-blur-md">
					<div class="max-w-[200px] sm:max-w-[400px] truncate font-medium">
						{selectedPhoto.fileName}
					</div>
					<div class="h-4 w-px bg-white/30"></div>
					<div class="text-sm text-gray-300">
						{formatDate(selectedPhoto.createdAt)}
					</div>
					<a
						href={`/api/files/${selectedPhoto.id}/download`}
						download={selectedPhoto.fileName}
						class="ml-2 rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20 text-white"
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
