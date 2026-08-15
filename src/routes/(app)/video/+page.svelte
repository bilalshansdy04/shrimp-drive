<script lang="ts">
	import { Film, Play, Clock } from 'lucide-svelte';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
	const videoFiles = $derived(data.videoFiles);

	function formatTime(seconds: number | null) {
		if (!seconds || isNaN(seconds)) return '0:00';
		const m = Math.floor(seconds / 60);
		const s = Math.floor(seconds % 60);
		return `${m}:${s.toString().padStart(2, '0')}`;
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
	<div class="mb-8 flex items-end justify-between">
		<div>
			<h1 class="text-3xl font-bold text-white">Video Hub</h1>
			<p class="mt-2 text-gray-400">Watch and manage your uploaded videos</p>
		</div>
	</div>

	{#if videoFiles.length === 0}
		<div
			class="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-[#2A3241] p-12 text-center"
		>
			<div class="mb-4 rounded-full bg-[#151921] p-4 text-gray-400">
				<Film size={48} />
			</div>
			<h3 class="mb-2 text-xl font-bold text-white">No videos yet</h3>
			<p class="max-w-sm text-gray-400">
				Upload your first video to start building your personal cinema.
			</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each videoFiles as video}
				<a
					href={`/video/${video.id}`}
					class="group hover:border-primary-container relative flex flex-col overflow-hidden rounded-xl border border-[#2A3241] bg-[#151921] transition-all hover:-translate-y-1 hover:shadow-lg"
				>
					<div class="relative aspect-video w-full overflow-hidden bg-[#0B0E14]">
						{#if video.thumbnailUrl}
							<img
								src={video.thumbnailUrl}
								alt={video.fileName}
								class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
							/>
						{:else}
							<div class="flex h-full w-full items-center justify-center text-gray-500">
								<Film size={32} />
							</div>
						{/if}
						<div
							class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
						>
							<div
								class="bg-primary-container scale-75 transform rounded-full p-3 text-black transition-transform group-hover:scale-100"
							>
								<Play size={24} fill="currentColor" class="ml-1" />
							</div>
						</div>
						<div
							class="absolute right-2 bottom-2 rounded bg-black/80 px-2 py-1 text-xs font-medium text-white shadow backdrop-blur-sm"
						>
							{formatTime(video.duration)}
						</div>
					</div>
					<div class="p-4">
						<h3
							class="mb-1 truncate text-base font-semibold text-white"
							title={video.title || video.fileName}
						>
							{video.title || video.fileName}
						</h3>
						<div class="flex items-center gap-3 text-xs text-gray-400">
							<span>{formatDate(video.createdAt)}</span>
							<span class="h-1 w-1 rounded-full bg-gray-600"></span>
							<span>{(video.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
