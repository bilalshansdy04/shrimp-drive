<script lang="ts">
	import { 
		FileText, 
		FileSpreadsheet, 
		Presentation, 
		Archive, 
		File, 
		Download, 
		ExternalLink, 
		Search,
		FileCode
	} from 'lucide-svelte';
	import type { PageData } from './$types';
	import { formatBytes } from '$lib/utils';

	const { data }: { data: PageData } = $props();
	const docFiles = $derived(data.docFiles);

	let searchQuery = $state('');

	const filteredDocs = $derived(
		docFiles.filter((file) => file.fileName.toLowerCase().includes(searchQuery.toLowerCase()))
	);

	function getFileExtension(filename: string): string {
		return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
	}

	function getIconAndColor(filename: string) {
		const ext = getFileExtension(filename);
		
		switch (ext) {
			case 'pdf':
				return { component: FileText, color: 'text-rose-500', bg: 'bg-rose-500/10' };
			case 'doc':
			case 'docx':
				return { component: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' };
			case 'xls':
			case 'xlsx':
			case 'csv':
				return { component: FileSpreadsheet, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
			case 'ppt':
			case 'pptx':
				return { component: Presentation, color: 'text-amber-500', bg: 'bg-amber-500/10' };
			case 'zip':
			case 'rar':
			case '7z':
			case 'tar':
			case 'gz':
				return { component: Archive, color: 'text-purple-500', bg: 'bg-purple-500/10' };
			case 'txt':
			case 'md':
			case 'json':
			case 'js':
			case 'ts':
			case 'html':
			case 'css':
				return { component: FileCode, color: 'text-slate-400', bg: 'bg-slate-500/10' };
			default:
				return { component: File, color: 'text-slate-400', bg: 'bg-slate-500/10' };
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
	<!-- Header & Search -->
	<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold text-white">Document Hub</h1>
			<p class="mt-2 text-gray-400">Manage all your files, archives, and documents</p>
		</div>
		<div class="relative w-full sm:w-72">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
			<input
				type="text"
				placeholder="Search documents..."
				bind:value={searchQuery}
				class="w-full rounded-full border border-[#2A3241] bg-[#151921] py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-primary-container"
			/>
		</div>
	</div>

	{#if docFiles.length === 0}
		<div class="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-[#2A3241] p-12 text-center">
			<div class="mb-4 rounded-full bg-[#151921] p-4 text-gray-400">
				<FileText size={48} />
			</div>
			<h3 class="mb-2 text-xl font-bold text-white">No documents yet</h3>
			<p class="max-w-sm text-gray-400">
				Upload your first PDF, Word, or Archive file to start managing them here.
			</p>
		</div>
	{:else if filteredDocs.length === 0}
		<div class="flex py-12 flex-col items-center justify-center text-center">
			<div class="mb-4 rounded-full bg-[#151921] p-4 text-gray-500">
				<Search size={32} />
			</div>
			<p class="text-gray-400">No documents found matching "{searchQuery}"</p>
		</div>
	{:else}
		<!-- List View -->
		<div class="flex flex-col gap-2">
			<!-- Table Header -->
			<div class="hidden grid-cols-12 gap-4 rounded-lg bg-[#151921]/50 px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 sm:grid">
				<div class="col-span-6 md:col-span-7">Name</div>
				<div class="col-span-2 hidden md:block">Date</div>
				<div class="col-span-3 md:col-span-2">Size</div>
				<div class="col-span-3 md:col-span-1 text-right">Action</div>
			</div>

			<!-- List Items -->
			{#each filteredDocs as doc (doc.id)}
				{@const IconInfo = getIconAndColor(doc.fileName)}
				<div class="group flex flex-col gap-2 rounded-xl border border-[#2A3241] bg-[#151921] p-4 transition-all hover:border-primary-container hover:bg-[#1A202A] sm:grid sm:grid-cols-12 sm:items-center sm:gap-4 sm:px-4 sm:py-3">
					
					<!-- Name & Icon -->
					<div class="col-span-6 flex items-center gap-4 md:col-span-7 overflow-hidden">
						<div class={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${IconInfo.bg}`}>
							<IconInfo.component size={20} class={IconInfo.color} />
						</div>
						<div class="min-w-0 flex-1">
							<h3 class="truncate text-sm font-medium text-white" title={doc.fileName}>
								{doc.fileName}
							</h3>
						</div>
					</div>

					<!-- Date -->
					<div class="col-span-2 hidden text-sm text-gray-400 md:block">
						{formatDate(doc.createdAt)}
					</div>

					<!-- Size -->
					<div class="col-span-3 text-sm text-gray-400 md:col-span-2">
						{formatBytes(doc.fileSize)}
					</div>

					<!-- Actions -->
					<div class="col-span-3 flex items-center justify-start sm:justify-end gap-1 md:col-span-1">
						<!-- Preview in New Tab (Inline) -->
						<a
							href={`/api/files/${doc.id}/download`}
							target="_blank"
							rel="noopener noreferrer"
							class="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
							title="Preview"
						>
							<ExternalLink size={18} />
						</a>
						
						<!-- Force Download (Attachment) -->
						<a
							href={`/api/files/${doc.id}/download?download=1`}
							download={doc.fileName}
							class="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
							title="Download"
						>
							<Download size={18} />
						</a>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
