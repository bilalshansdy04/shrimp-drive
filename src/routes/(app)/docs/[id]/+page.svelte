<script lang="ts">
	import { onMount, tick } from 'svelte';
	import type { PageData } from './$types';
	import { getFileBlobUrl, downloadFileClient } from '$lib/client/mediaState.svelte';
	import { FileText, Download, ArrowLeft, Loader2 } from 'lucide-svelte';
	import { formatBytes } from '$lib/utils';
	import { page } from '$app/stores';

	let { data } = $props<{ data: PageData }>();
	let { doc } = data;

	let blobUrl = $state('');
	let isLoading = $state(true);
	let error = $state('');

	let isPdf = doc.fileName.toLowerCase().endsWith('.pdf');
	let isMd = doc.fileName.toLowerCase().endsWith('.md');
	let isTxt = doc.fileName.toLowerCase().endsWith('.txt') || doc.fileName.toLowerCase().endsWith('.csv');

	let textContent = $state('');
	let pdfPages = $state(0);
	let pdfContainer = $state<HTMLDivElement>();

	onMount(async () => {
		try {
			const url = await getFileBlobUrl(doc);
			if (!url) throw new Error('Failed to get blob URL');
			blobUrl = url;

			if (isTxt || isMd) {
				const res = await fetch(blobUrl);
				textContent = await res.text();
				isLoading = false;
			} else if (isPdf) {
				isLoading = false; // Set to false to mount pdfContainer
				// Use setTimeout or tick to allow DOM to update
				setTimeout(async () => {
					try {
						await loadPdf();
					} catch (err: any) {
						error = err.message || 'Failed to load PDF preview';
					}
				}, 50);
			} else {
				isLoading = false;
			}
		} catch (err: any) {
			error = err.message || 'Failed to load preview';
			isLoading = false;
		}
	});

	async function loadPdf() {
		await tick();
		if (!pdfContainer) {
			throw new Error("Preview container not found");
		}
		
		// @ts-ignore
		if (!window.pdfjsLib) {
			// Load pdf.js dynamically
			await new Promise<void>((resolve, reject) => {
				const script = document.createElement('script');
				script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
				script.onload = () => {
					// @ts-ignore
					window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
					// Fallback to main thread if worker fails
					resolve();
				};
				script.onerror = reject;
				document.head.appendChild(script);
			});
		}

		try {
			// @ts-ignore
			const loadingTask = window.pdfjsLib.getDocument({
				url: blobUrl,
				disableWorker: true // Bypass worker completely to prevent hanging
			});
			const pdf = await loadingTask.promise;
		pdfPages = pdf.numPages;

		for (let pageNum = 1; pageNum <= pdfPages; pageNum++) {
			const page = await pdf.getPage(pageNum);
			const viewport = page.getViewport({ scale: 1.5 });
			
			const canvas = document.createElement('canvas');
			const context = canvas.getContext('2d');
			canvas.height = viewport.height;
			canvas.width = viewport.width;
			canvas.className = 'w-full max-w-4xl mx-auto bg-white mb-6 shadow-lg rounded-sm';
			
			pdfContainer.appendChild(canvas);
			
			await page.render({ canvasContext: context, viewport: viewport }).promise;
		}
		} catch (e: any) {
			console.error("PDF load error:", e);
			throw new Error("Failed to render PDF: " + e.message);
		}
	}
</script>

<svelte:head>
	<title>{doc.fileName} - Shrimp Drive</title>
	{#if isMd}
		<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
	{/if}
</svelte:head>

<div class="flex h-screen flex-col bg-[#0B0E14] text-white">
	<!-- Topbar -->
	<div class="flex h-16 shrink-0 items-center justify-between border-b border-[#2A3241] bg-[#0B0E14] px-6">
		<div class="flex items-center gap-4">
			<button 
				onclick={() => history.back()} 
				class="rounded-full p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
			>
				<ArrowLeft size={20} />
			</button>
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FF6B4A]/20">
					<FileText size={20} class="text-[#FF6B4A]" />
				</div>
				<div>
					<h1 class="font-bold text-white max-w-[200px] sm:max-w-md truncate" title={doc.fileName}>{doc.fileName}</h1>
					<p class="text-xs text-gray-400">{formatBytes(doc.fileSize)}</p>
				</div>
			</div>
		</div>
		<div class="flex items-center gap-3">
			<button
				onclick={() => downloadFileClient(doc, false)}
				class="flex items-center gap-2 rounded-xl bg-[#FF6B4A]/20 px-4 py-2 text-sm font-medium text-[#FF6B4A] transition-colors hover:bg-[#FF6B4A]/30"
			>
				<Download size={16} /> Download
			</button>
		</div>
	</div>

	<!-- Main Content Area -->
	<div class="flex-1 overflow-y-auto bg-[#151921] p-4 sm:p-8">
		{#if isLoading}
			<div class="flex h-full items-center justify-center">
				<Loader2 size={32} class="animate-spin text-primary" />
			</div>
		{:else if error}
			<div class="flex h-full flex-col items-center justify-center text-center">
				<FileText size={48} class="mb-4 text-gray-600" />
				<h2 class="mb-2 text-xl font-bold text-white">Preview Unavailable</h2>
				<p class="text-gray-400">{error}</p>
				<button
					onclick={() => downloadFileClient(doc, false)}
					class="mt-6 flex items-center gap-2 rounded-xl bg-[#FF6B4A]/20 px-4 py-2 font-medium text-[#FF6B4A] hover:bg-[#FF6B4A]/30"
				>
					<Download size={18} /> Download Instead
				</button>
			</div>
		{:else}
			{#if isTxt}
				<div class="mx-auto max-w-5xl overflow-x-auto rounded-xl border border-[#2A3241] bg-[#0B0E14] p-6 shadow-2xl">
					<pre class="whitespace-pre-wrap font-mono text-sm text-gray-300">{textContent}</pre>
				</div>
			{:else if isMd}
				<div class="mx-auto max-w-4xl rounded-xl border border-[#2A3241] bg-white p-8 text-black shadow-2xl prose prose-slate">
					<!-- @ts-ignore -->
					{@html window.marked ? window.marked.parse(textContent) : textContent}
				</div>
			{:else if isPdf}
				<div bind:this={pdfContainer} class="mx-auto w-full max-w-4xl pb-10">
					{#if pdfPages === 0 && !error}
						<div class="flex flex-col items-center justify-center py-20 text-gray-400">
							<Loader2 size={32} class="mb-4 animate-spin text-primary" />
							<p>Rendering PDF...</p>
						</div>
					{/if}
					<!-- Canvases will be injected here -->
				</div>
			{:else}
				<div class="flex h-full flex-col items-center justify-center text-center">
					<FileText size={48} class="mb-4 text-gray-600" />
					<h2 class="mb-2 text-xl font-bold text-white">No Preview Available</h2>
					<p class="text-gray-400">Preview is not supported for this file type.</p>
					<button
						onclick={() => downloadFileClient(doc, false)}
						class="mt-6 flex items-center gap-2 rounded-xl bg-[#FF6B4A]/20 px-4 py-2 font-medium text-[#FF6B4A] hover:bg-[#FF6B4A]/30"
					>
						<Download size={18} /> Download File
					</button>
				</div>
			{/if}
		{/if}
	</div>
</div>
