<script lang="ts">
	import {
		Folder,
		FolderPlus,
		MoreVertical,
		UploadCloud,
		FileAudio,
		FileVideo,
		Image as ImageIcon,
		FileText,
		Play,
		Eye,
		Trash2,
		CornerDownRight,
		Edit2,
		Home,
		ChevronRight
	} from 'lucide-svelte';
	import { formatBytes, formatDate } from '$lib/utils';
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { media } from '$lib/client/mediaState.svelte';

	let { data } = $props<{ data: PageData }>();

	// State
	let currentFolderId = $derived($page.url.searchParams.get('folder'));
	let isDragging = $state(false);
	let activeMenu = $state<string | null>(null);

	// Modals
	let showNewFolderModal = $state(false);
	let showMoveModal = $state(false);
	let showRenameModal = $state(false);

	let newFolderName = $state('');
	let newFolderCategory = $state('document');
	let renameFolderId = $state('');
	let renameFolderName = $state('');

	let moveTargetId = $state('');
	let moveTargetType = $state<'file' | 'folder'>('file');
	let moveTargetCategory = $state('document');

	let availableFolders = $state<any[]>([]);
	let selectedDestinationId = $state<string | null>(null);

	let percentage = $derived(
		data.user ? Math.min(100, (data.user.storageUsed / data.user.storageLimit) * 100) : 0
	);
	let circumference = 2 * Math.PI * 15.9155;
	let dashoffset = $derived(circumference - (percentage / 100) * circumference);

	// Handlers
	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		if (e.dataTransfer?.files?.length) {
			const globalInput = document.getElementById('global-file-upload') as HTMLInputElement;
			if (globalInput) {
				globalInput.files = e.dataTransfer.files;
				globalInput.dispatchEvent(new Event('change', { bubbles: true }));
			}
		}
	}

	function triggerUploadClick() {
		const globalInput = document.getElementById('global-file-upload') as HTMLInputElement;
		if (globalInput) {
			globalInput.click();
		}
	}

	function toggleMenu(id: string, e: MouseEvent) {
		e.stopPropagation();
		activeMenu = activeMenu === id ? null : id;
	}

	// Click outside to close menus
	$effect(() => {
		const handleClick = () => {
			activeMenu = null;
		};
		window.addEventListener('click', handleClick);
		return () => window.removeEventListener('click', handleClick);
	});

	// Actions
	async function createFolder() {
		if (!newFolderName.trim()) return toast.error('Folder name required');

		const res = await fetch('/api/folders', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: newFolderName,
				category: data.currentFolder ? data.currentFolder.category : newFolderCategory,
				parentId: currentFolderId || null
			})
		});

		const json = await res.json();
		if (res.ok) {
			toast.success('Folder created');
			showNewFolderModal = false;
			newFolderName = '';
			invalidateAll();
		} else {
			toast.error(json.error || 'Failed to create folder');
		}
	}

	async function renameFolder() {
		if (!renameFolderName.trim()) return toast.error('Folder name required');

		const res = await fetch(`/api/folders/${renameFolderId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: renameFolderName })
		});

		const json = await res.json();
		if (res.ok) {
			toast.success('Folder renamed');
			showRenameModal = false;
			invalidateAll();
		} else {
			toast.error(json.error || 'Failed to rename folder');
		}
	}

	async function deleteFolder(id: string) {
		if (!confirm('Are you sure you want to delete this folder and ALL its contents?')) return;

		const res = await fetch(`/api/folders/${id}`, { method: 'DELETE' });
		if (res.ok) {
			toast.success('Folder deleted');
			invalidateAll();
		} else {
			const json = await res.json();
			toast.error(json.error || 'Failed to delete folder');
		}
	}

	async function openMoveModal(id: string, type: 'file' | 'folder', category: string) {
		moveTargetId = id;
		moveTargetType = type;
		moveTargetCategory = category;
		selectedDestinationId = null;

		// Fetch available folders of the same category
		const res = await fetch(`/api/folders?category=${category}`);
		if (res.ok) {
			const json = await res.json();
			availableFolders = json.folders;
			showMoveModal = true;
		}
	}

	async function moveItem() {
		const endpoint =
			moveTargetType === 'file'
				? `/api/files/${moveTargetId}/move`
				: `/api/folders/${moveTargetId}/move`;

		const res = await fetch(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ targetFolderId: selectedDestinationId })
		});

		const json = await res.json();
		if (res.ok) {
			toast.success(`${moveTargetType} moved`);
			showMoveModal = false;
			invalidateAll();
		} else {
			toast.error(json.error || `Failed to move ${moveTargetType}`);
		}
	}

	function getFileIcon(type: string) {
		switch (type) {
			case 'audio':
				return FileAudio;
			case 'video':
				return FileVideo;
			case 'image':
				return ImageIcon;
			case 'document':
				return FileText;
			default:
				return FileText;
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	role="region"
	class="flex h-full flex-col overflow-y-auto p-6"
	ondragover={(e) => {
		e.preventDefault();
		isDragging = true;
	}}
	ondragleave={() => (isDragging = false)}
	ondrop={handleDrop}
>
	<!-- Drag Overlay -->
	{#if isDragging}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0E14]/90 backdrop-blur-sm"
		>
			<div class="text-primary flex flex-col items-center">
				<UploadCloud size={64} class="mb-4 animate-bounce" />
				<h2 class="text-2xl font-bold">Drop files to upload here</h2>
			</div>
		</div>
	{/if}

	<!-- Header & Storage Stats -->
	<div class="mb-8 flex items-center gap-4 rounded-2xl border border-[#2A3241] bg-[#151921] p-4 md:gap-6 md:p-6">
		<div class="relative flex h-16 w-16 shrink-0 items-center justify-center">
			<svg class="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
				<path
					class="text-[#2A3241]"
					d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
					fill="none"
					stroke="currentColor"
					stroke-width="3"
				/>
				<path
					class="text-primary transition-all duration-1000 ease-out"
					stroke-dasharray="{circumference}, {circumference}"
					stroke-dashoffset={dashoffset}
					d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
					fill="none"
					stroke="currentColor"
					stroke-width="3"
				/>
			</svg>
			<div class="absolute flex flex-col items-center">
				<span class="text-xs font-bold text-white">{Math.round(percentage)}%</span>
			</div>
		</div>
		<div class="flex-1">
			<h2 class="text-lg font-bold text-white">Storage Overview</h2>
			<p class="text-sm text-gray-400">
				{formatBytes(data.user?.storageUsed || 0)} used of {formatBytes(
					data.user?.storageLimit || 0
				)}
			</p>
		</div>
	</div>

	<!-- Breadcrumbs & Actions -->
	<div class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
		<div class="flex flex-wrap items-center gap-2 text-sm text-gray-400">
			<a href="/drive" class="flex items-center gap-1 transition-colors hover:text-white">
				<Home size={16} /> Home
			</a>
			{#each data.breadcrumbs as crumb}
				<ChevronRight size={14} class="shrink-0" />
				<a
					href={`/drive?folder=${crumb.id}`}
					class="max-w-[150px] truncate transition-colors hover:text-white"
				>
					{crumb.name}
				</a>
			{/each}
		</div>

		<div class="flex w-full items-center gap-3 sm:w-auto">
			<button
				onclick={() => (showNewFolderModal = true)}
				class="hover:border-primary-container flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#2A3241] bg-[#151921] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1A202A] sm:flex-none"
			>
				<FolderPlus size={18} /> New Folder
			</button>
			<!-- <button
				onclick={triggerUploadClick}
				class="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl bg-primary-container px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary-container/80"
			>
				<UploadCloud size={18} /> Upload Files
			</button> -->
		</div>
	</div>

	<!-- Empty State -->
	{#if data.childFolders.length === 0 && data.recentFiles.length === 0}
		<div
			class="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-[#2A3241] p-6 text-center md:p-12"
		>
			<div class="mb-4 rounded-full bg-[#151921] p-4 text-gray-400">
				<Folder size={48} />
			</div>
			<h3 class="mb-2 text-xl font-bold text-white">This folder is empty</h3>
			<p class="max-w-sm text-gray-400">
				Create a new folder or upload files to start organizing your media.
			</p>
		</div>
	{:else}
		<!-- Folders Grid -->
		{#if data.childFolders.length > 0}
			<h3 class="mb-4 text-sm font-semibold tracking-wider text-gray-400 uppercase">Folders</h3>
			<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
				{#each data.childFolders as folder}
					<div
						class="group hover:border-primary-container relative flex items-center gap-3 rounded-xl border border-[#2A3241] bg-[#151921] p-4 transition-all hover:bg-[#1A202A]"
					>
						<a href={`/drive?folder=${folder.id}`} class="absolute inset-0 z-10" aria-label={`Open folder ${folder.name}`}></a>
						<Folder size={24} class="shrink-0 text-blue-500" />
						<div class="min-w-0 flex-1">
							<p class="truncate font-medium text-white" title={folder.name}>{folder.name}</p>
							<p class="text-xs text-gray-500 capitalize">{folder.category}</p>
						</div>

						<!-- Folder Menu -->
						<div class="relative z-20">
							<button
								class="rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white"
								onclick={(e) => toggleMenu(`folder-${folder.id}`, e)}
							>
								<MoreVertical size={18} />
							</button>
							{#if activeMenu === `folder-${folder.id}`}
								<div
									class="absolute top-full right-0 z-50 mt-2 w-48 rounded-xl border border-[#2A3241] bg-[#151921] p-1 shadow-xl"
								>
									<button
										class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-[#1A202A] hover:text-white"
										onclick={() => {
											renameFolderId = folder.id;
											renameFolderName = folder.name;
											showRenameModal = true;
											activeMenu = null;
										}}
									>
										<Edit2 size={16} /> Rename
									</button>
									<button
										class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-[#1A202A] hover:text-white"
										onclick={() => {
											openMoveModal(folder.id, 'folder', folder.category);
											activeMenu = null;
										}}
									>
										<CornerDownRight size={16} /> Move to...
									</button>
									<button
										class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
										onclick={() => {
											deleteFolder(folder.id);
											activeMenu = null;
										}}
									>
										<Trash2 size={16} /> Delete
									</button>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Files List -->
		{#if data.recentFiles.length > 0}
			<h3 class="mb-4 text-sm font-semibold tracking-wider text-gray-400 uppercase">Files</h3>
			<div class="flex flex-col gap-2">
				{#each data.recentFiles as file}
					{@const Icon = getFileIcon(file.fileType)}
					<div
						class="group hover:border-primary-container relative flex items-center justify-between rounded-xl border border-[#2A3241] bg-[#151921] p-4 transition-all hover:bg-[#1A202A]"
					>
						{#if file.fileType === 'audio'}
							<button onclick={() => media.playTrack(0, [file])} class="absolute inset-0 z-10" aria-label={`Play ${file.fileName}`}></button>
						{:else if file.fileType === 'video'}
							<a href={`/video/${file.id}`} class="absolute inset-0 z-10" aria-label={`View ${file.fileName}`}></a>
						{:else if file.fileType === 'photo' || file.fileType === 'image'}
							<a href={`/photo?view=${file.id}`} class="absolute inset-0 z-10" aria-label={`View ${file.fileName}`}></a>
						{:else}
							<a href={`/api/files/${file.id}/download`} target="_blank" class="absolute inset-0 z-10" aria-label={`Download ${file.fileName}`}></a>
						{/if}
						<div class="flex min-w-0 flex-1 items-center gap-4">
							<div
								class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-800"
							>
								<Icon size={20} class="text-gray-400" />
							</div>
							<div class="min-w-0 flex-1">
								<h4 class="truncate font-medium text-white" title={file.fileName}>
									{file.fileName}
								</h4>
								<div class="flex items-center gap-2 text-xs text-gray-500">
									<span>{formatBytes(file.fileSize)}</span>
									<span>•</span>
									<span class="capitalize">{file.fileType}</span>
								</div>
							</div>
						</div>

						<div class="flex shrink-0 items-center gap-2">
							<!-- Direct file actions (visual only, handled by absolute overlay) -->
							{#if file.fileType === 'audio'}
								<div class="rounded-lg p-2 text-gray-400 group-hover:text-white"><Play size={18} /></div>
							{:else if file.fileType === 'video'}
								<div class="rounded-lg p-2 text-gray-400 group-hover:text-white"><Play size={18} /></div>
							{:else if file.fileType === 'photo' || file.fileType === 'image'}
								<div class="rounded-lg p-2 text-gray-400 group-hover:text-white"><Eye size={18} /></div>
							{:else}
								<div class="rounded-lg p-2 text-gray-400 group-hover:text-white"><Eye size={18} /></div>
							{/if}

							<!-- File Menu -->
							<div class="relative z-20">
								<button
									class="rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white"
									onclick={(e) => toggleMenu(`file-${file.id}`, e)}
								>
									<MoreVertical size={18} />
								</button>
								{#if activeMenu === `file-${file.id}`}
									<div
										class="absolute top-full right-0 z-50 mt-2 w-48 rounded-xl border border-[#2A3241] bg-[#151921] p-1 shadow-xl"
									>
										<button
											class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-[#1A202A] hover:text-white"
											onclick={() => {
												openMoveModal(file.id, 'file', file.fileType);
												activeMenu = null;
											}}
										>
											<CornerDownRight size={16} /> Move to...
										</button>
										<form
											method="POST"
											action="?/delete"
											use:enhance={() => {
												return async ({ result }) => {
													if (result.type === 'success') {
														toast.success('File deleted');
														invalidateAll();
													} else {
														toast.error('Failed to delete file');
													}
												};
											}}
										>
											<input type="hidden" name="fileId" value={file.id} />
											<button
												type="submit"
												class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
											>
												<Trash2 size={16} /> Delete
											</button>
										</form>
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<!-- Modals -->
{#if showNewFolderModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
		<div class="w-full max-w-md rounded-2xl border border-[#2A3241] bg-[#0B0E14] p-6 shadow-2xl">
			<h3 class="mb-4 text-xl font-bold text-white">Create New Folder</h3>
			<div class="space-y-4">
				<div>
					<label class="mb-1 block text-sm text-gray-400">Folder Name</label>
					<input
						type="text"
						bind:value={newFolderName}
						placeholder="E.g. Summer Vacation"
						class="focus:border-primary-container w-full rounded-xl border border-[#2A3241] bg-[#151921] px-4 py-2.5 text-white outline-none"
					/>
				</div>
				<!-- Only ask category if we are in Root folder -->
				{#if !currentFolderId}
					<div>
						<label class="mb-1 block text-sm text-gray-400">Folder Category</label>
						<select
							bind:value={newFolderCategory}
							class="focus:border-primary-container w-full rounded-xl border border-[#2A3241] bg-[#151921] px-4 py-2.5 text-white outline-none"
						>
							<option value="document">Document</option>
							<option value="audio">Audio / Music</option>
							<option value="video">Video</option>
							<option value="image">Image / Photo</option>
						</select>
						<p class="mt-1 text-xs text-gray-500">
							Files can only be moved to folders of the same category.
						</p>
					</div>
				{/if}
			</div>
			<div class="mt-6 flex justify-end gap-3">
				<button
					onclick={() => (showNewFolderModal = false)}
					class="rounded-xl px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
					>Cancel</button
				>
				<button
					onclick={createFolder}
					class="bg-primary-container text-primary hover:bg-primary-container/80 rounded-xl px-4 py-2 text-sm font-medium"
					>Create Folder</button
				>
			</div>
		</div>
	</div>
{/if}

{#if showRenameModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
		<div class="w-full max-w-md rounded-2xl border border-[#2A3241] bg-[#0B0E14] p-6 shadow-2xl">
			<h3 class="mb-4 text-xl font-bold text-white">Rename Folder</h3>
			<input
				type="text"
				bind:value={renameFolderName}
				class="focus:border-primary-container w-full rounded-xl border border-[#2A3241] bg-[#151921] px-4 py-2.5 text-white outline-none"
			/>
			<div class="mt-6 flex justify-end gap-3">
				<button
					onclick={() => (showRenameModal = false)}
					class="rounded-xl px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
					>Cancel</button
				>
				<button
					onclick={renameFolder}
					class="bg-primary-container text-primary hover:bg-primary-container/80 rounded-xl px-4 py-2 text-sm font-medium"
					>Save Changes</button
				>
			</div>
		</div>
	</div>
{/if}

{#if showMoveModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
		<div
			class="flex max-h-[80vh] w-full max-w-md flex-col rounded-2xl border border-[#2A3241] bg-[#0B0E14] p-6 shadow-2xl"
		>
			<h3 class="mb-1 text-xl font-bold text-white">Move to...</h3>
			<p class="mb-4 text-sm text-gray-400">Select destination folder ({moveTargetCategory})</p>

			<div
				class="flex-1 space-y-2 overflow-y-auto rounded-xl border border-[#2A3241] bg-[#151921] p-2"
			>
				<!-- Root option -->
				<button
					class="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors {selectedDestinationId ===
					null
						? 'bg-primary-container/20 border-primary-container text-primary border'
						: 'border border-transparent text-white hover:bg-[#1A202A]'}"
					onclick={() => (selectedDestinationId = null)}
				>
					<Home
						size={18}
						class={selectedDestinationId === null ? 'text-primary' : 'text-gray-400'}
					/>
					<span class="font-medium">Root Directory</span>
				</button>

				<!-- Folders list -->
				{#each availableFolders as folder}
					<!-- Don't show the folder itself if we're moving a folder -->
					{#if moveTargetType !== 'folder' || folder.id !== moveTargetId}
						<button
							class="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors {selectedDestinationId ===
							folder.id
								? 'bg-primary-container/20 border-primary-container text-primary border'
								: 'border border-transparent text-white hover:bg-[#1A202A]'}"
							onclick={() => (selectedDestinationId = folder.id)}
						>
							<Folder
								size={18}
								class={selectedDestinationId === folder.id ? 'text-primary' : 'text-blue-400'}
							/>
							<span class="font-medium">{folder.name}</span>
						</button>
					{/if}
				{/each}
			</div>

			<div class="mt-6 flex shrink-0 justify-end gap-3">
				<button
					onclick={() => (showMoveModal = false)}
					class="rounded-xl px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
					>Cancel</button
				>
				<button
					onclick={moveItem}
					class="bg-primary-container text-primary hover:bg-primary-container/80 rounded-xl px-4 py-2 text-sm font-medium"
					>Move Here</button
				>
			</div>
		</div>
	</div>
{/if}
