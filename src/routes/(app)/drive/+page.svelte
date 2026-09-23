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
		ChevronRight,
		X,
		CheckSquare,
		Square
	} from 'lucide-svelte';
	import { formatBytes, formatDate } from '$lib/utils';
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { media, downloadFileClient } from '$lib/client/mediaState.svelte';
	import { confirmDelete, confirmDeleteMultiple } from '$lib/utils/deleteConfirm';
	import { askConfirm } from '$lib/client/confirm.svelte';

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
	let isMultiMove = $state(false);

	let availableFolders = $state<any[]>([]);
	let selectedDestinationId = $state<string | null>(null);
	
	// Modal hierarchical navigation
	let modalCurrentFolderId = $state<string | null>(null);
	let modalChildrenFolders = $derived(availableFolders.filter(f => f.parentId === modalCurrentFolderId));
	let modalCurrentFolder = $derived(availableFolders.find(f => f.id === modalCurrentFolderId));

	// Multi-select state
	let selectedFiles = $state<Set<string>>(new Set());
	let selectedFolders = $state<Set<string>>(new Set());
	let isSelectionMode = $state(false);

	function updateSelectionMode() {
		isSelectionMode = selectedFiles.size > 0 || selectedFolders.size > 0;
	}

	function toggleFile(id: string) {
		if (selectedFiles.has(id)) selectedFiles.delete(id);
		else selectedFiles.add(id);
		selectedFiles = new Set(selectedFiles);
		updateSelectionMode();
	}
	
	function toggleFolder(id: string) {
		if (selectedFolders.has(id)) selectedFolders.delete(id);
		else selectedFolders.add(id);
		selectedFolders = new Set(selectedFolders);
		updateSelectionMode();
	}

	function clearSelection() {
		selectedFiles = new Set();
		selectedFolders = new Set();
		updateSelectionMode();
	}

	function toggleSelectAll() {
		const totalItems = data.childFolders.length + data.recentFiles.length;
		if (totalItems === 0) return;
		
		if (selectedFolders.size + selectedFiles.size === totalItems) {
			clearSelection();
		} else {
			data.childFolders.forEach(f => selectedFolders.add(f.id));
			data.recentFiles.forEach(f => selectedFiles.add(f.id));
			selectedFolders = new Set(selectedFolders);
			selectedFiles = new Set(selectedFiles);
			updateSelectionMode();
		}
	}

	let percentage = $derived(
		data.user ? data.user.storageLimit === -1 ? 0 : Math.min(100, (data.user.storageUsed / data.user.storageLimit) * 100) : 0
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
		await confirmDelete('folder', async () => {
			const res = await fetch(`/api/folders/${id}`, { method: 'DELETE' });
			if (res.ok) {
				await invalidateAll();
				return true;
			} else {
				const json = await res.json();
				toast.error(json.error || 'Failed to delete folder');
				return false;
			}
		});
	}

	async function openMoveModal(id: string, type: 'file' | 'folder', category: string, multi = false) {
		isMultiMove = multi;
		moveTargetId = id;
		moveTargetType = type;
		moveTargetCategory = category;
		selectedDestinationId = null;
		
		// Reset modal navigation to current folder
		modalCurrentFolderId = currentFolderId;

		const res = await fetch(`/api/folders?category=${category}`);
		if (res.ok) {
			const json = await res.json();
			availableFolders = json.folders;
			showMoveModal = true;
		}
	}

	async function moveItem() {
		let itemsToMove = isMultiMove 
			? { files: Array.from(selectedFiles), folders: Array.from(selectedFolders) }
			: { files: moveTargetType === 'file' ? [moveTargetId] : [], folders: moveTargetType === 'folder' ? [moveTargetId] : [] };

		const res = await fetch('/api/bulk/move', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ items: itemsToMove, targetFolderId: selectedDestinationId })
		});

		const json = await res.json();
		if (res.ok) {
			toast.success(isMultiMove ? 'Items moved' : `${moveTargetType} moved`);
			showMoveModal = false;
			clearSelection();
			invalidateAll();
		} else {
			toast.error(json.error || `Failed to move items`);
		}
	}

	async function deleteSelected() {
		await confirmDeleteMultiple(selectedFiles.size + selectedFolders.size, async () => {
			const res = await fetch('/api/bulk/delete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ files: Array.from(selectedFiles), folders: Array.from(selectedFolders) })
			});

			if (res.ok) {
				clearSelection();
				await invalidateAll();
				return true;
			} else {
				const json = await res.json();
				toast.error(json.error || 'Failed to delete items');
				return false;
			}
		});
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
	class="flex flex-col p-6 h-full overflow-y-auto"
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
			class="z-50 fixed inset-0 flex justify-center items-center bg-[#0B0E14]/90 backdrop-blur-sm"
		>
			<div class="flex flex-col items-center text-primary">
				<UploadCloud size={64} class="mb-4 animate-bounce" />
				<h2 class="font-bold text-2xl">Drop files to upload here</h2>
			</div>
		</div>
	{/if}

	<!-- Header & Storage Stats -->
	<div
		class="flex items-center gap-4 md:gap-6 bg-[#151921] mb-8 p-4 md:p-6 border border-[#2A3241] rounded-2xl"
	>
		<div class="relative flex justify-center items-center w-16 h-16 shrink-0">
			<svg class="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
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
				<span class="font-bold text-white text-xs">{Math.round(percentage)}%</span>
			</div>
		</div>
		<div class="flex-1">
			<h2 class="font-bold text-white text-lg">Storage Overview</h2>
			<p class="text-gray-400 text-sm">
				{formatBytes(data.user?.storageUsed || 0)} used of {data.user?.storageLimit === -1 ? 'Unlimited' : formatBytes(data.user?.storageLimit || 0)}
			</p>
		</div>
	</div>

	<!-- Breadcrumbs & Actions -->
	<div class="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4 mb-6">
		<div class="flex flex-wrap items-center gap-2 text-gray-400 text-sm">
			<a href="/drive" class="flex items-center gap-1 hover:text-white transition-colors">
				<Home size={16} /> Home
			</a>
			{#each data.breadcrumbs as crumb}
				<ChevronRight size={14} class="shrink-0" />
				<a
					href={`/drive?folder=${crumb.id}`}
					class="max-w-[150px] hover:text-white truncate transition-colors"
				>
					{crumb.name}
				</a>
			{/each}
		</div>

		<div class="flex items-center gap-3 w-full sm:w-auto">
			{#if data.childFolders.length > 0 || data.recentFiles.length > 0}
				<button
					onclick={toggleSelectAll}
					class="flex flex-1 sm:flex-none justify-center items-center gap-2 bg-[#151921] hover:bg-[#1A202A] px-4 py-2.5 border border-[#2A3241] hover:border-primary-container rounded-xl font-medium text-white text-sm transition-colors {isSelectionMode && selectedFolders.size + selectedFiles.size === data.childFolders.length + data.recentFiles.length ? 'border-primary-container text-primary' : ''}"
				>
					{#if isSelectionMode && selectedFolders.size + selectedFiles.size === data.childFolders.length + data.recentFiles.length}
						<CheckSquare size={18} /> Deselect All
					{:else}
						<Square size={18} /> Select All
					{/if}
				</button>
			{/if}
			{#if currentFolderId}
				<button
					onclick={() => (showNewFolderModal = true)}
					class="flex flex-1 sm:flex-none justify-center items-center gap-2 bg-[#151921] hover:bg-[#1A202A] px-4 py-2.5 border border-[#2A3241] hover:border-primary-container rounded-xl font-medium text-white text-sm transition-colors"
				>
					<FolderPlus size={18} /> New Folder
				</button>
			{/if}
		</div>
	</div>

	<!-- Empty State -->
	{#if data.childFolders.length === 0 && data.recentFiles.length === 0}
		<div
			class="flex flex-col flex-1 justify-center items-center p-6 md:p-12 border border-[#2A3241] border-dashed rounded-2xl text-center"
		>
			<div class="bg-[#151921] mb-4 p-4 rounded-full text-gray-400">
				<Folder size={48} />
			</div>
			<h3 class="mb-2 font-bold text-white text-xl">This folder is empty</h3>
			<p class="max-w-sm text-gray-400">
				Create a new folder or upload files to start organizing your media.
			</p>
		</div>
	{:else}
		<!-- Folders Grid -->
		{#if data.childFolders.length > 0}
			<h3 class="mb-4 font-semibold text-gray-400 text-sm uppercase tracking-wider">Folders</h3>
			<div class="gap-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-8">
				{#each data.childFolders as folder}
					<div
						class="group hover:border-primary-container relative flex items-center gap-3 rounded-xl border border-[#2A3241] p-4 transition-all hover:bg-[#1A202A] {selectedFolders.has(folder.id) ? 'bg-[#1A202A] border-primary-container ring-1 ring-primary-container' : 'bg-[#151921]'}"
					>
						<!-- Selection Checkbox (visible on hover or when in selection mode) -->
						{#if currentFolderId}
							<div class="z-30 flex h-6 w-6 items-center justify-center transition-opacity {selectedFolders.has(folder.id) || isSelectionMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}">
								<input
									type="checkbox"
									checked={selectedFolders.has(folder.id)}
									onchange={() => toggleFolder(folder.id)}
									class="w-4 h-4 accent-primary cursor-pointer"
								/>
							</div>
						{/if}

						<a
							href={`/drive?folder=${folder.id}`}
							class="z-10 absolute inset-0"
							aria-label={`Open folder ${folder.name}`}
						></a>
						<Folder size={24} class="text-blue-500 shrink-0" />
						<div class="flex-1 min-w-0">
							<p class="font-medium text-white truncate" title={folder.name}>{folder.name}</p>
							<p class="text-gray-500 text-xs capitalize">{folder.category}</p>
						</div>

						<!-- Folder Menu -->
						{#if currentFolderId}
							<div class="z-20 relative">
							<button
								class="hover:bg-white/10 p-1 rounded-lg text-gray-400 hover:text-white"
								onclick={(e) => toggleMenu(`folder-${folder.id}`, e)}
							>
								<MoreVertical size={18} />
							</button>
							{#if activeMenu === `folder-${folder.id}`}
								<div
									class="top-full right-0 z-50 absolute bg-[#151921] shadow-xl mt-2 p-1 border border-[#2A3241] rounded-xl w-48"
								>
									<button
										class="flex items-center gap-2 hover:bg-[#1A202A] px-3 py-2 rounded-lg w-full text-gray-300 hover:text-white text-sm"
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
										class="flex items-center gap-2 hover:bg-[#1A202A] px-3 py-2 rounded-lg w-full text-gray-300 hover:text-white text-sm"
										onclick={() => {
											if (selectedFolders.has(folder.id)) {
												openMoveModal('', 'file', folder.category, true);
											} else {
												openMoveModal(folder.id, 'folder', folder.category);
											}
											activeMenu = null;
										}}
									>
										<CornerDownRight size={16} /> Move to...
									</button>
									<button
										class="flex items-center gap-2 hover:bg-red-500/10 px-3 py-2 rounded-lg w-full text-red-400 text-sm"
										onclick={() => {
											if (selectedFolders.has(folder.id)) {
												deleteSelected();
											} else {
												deleteFolder(folder.id);
											}
											activeMenu = null;
										}}
									>
										<Trash2 size={16} /> Delete
									</button>
								</div>
							{/if}
						</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		<!-- Files List -->
		{#if data.recentFiles.length > 0}
			<h3 class="mb-4 font-semibold text-gray-400 text-sm uppercase tracking-wider">Files</h3>
			<div class="flex flex-col gap-2">
				{#each data.recentFiles as file}
					{@const Icon = getFileIcon(file.fileType)}
					<div
						class="group hover:border-primary-container relative flex items-center justify-between rounded-xl border border-[#2A3241] p-4 transition-all hover:bg-[#1A202A] {selectedFiles.has(file.id) ? 'bg-[#1A202A] border-primary-container ring-1 ring-primary-container' : 'bg-[#151921]'}"
					>
						<!-- Selection Checkbox -->
						<div class="mr-3 z-30 flex h-6 w-6 items-center justify-center transition-opacity {selectedFiles.has(file.id) || isSelectionMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}">
							<input
								type="checkbox"
								checked={selectedFiles.has(file.id)}
								onchange={() => toggleFile(file.id)}
								class="w-4 h-4 accent-primary cursor-pointer"
							/>
						</div>
						
						{#if file.fileType === 'audio'}
							<button
								onclick={() => media.playTrack(0, [file])}
								class="z-10 absolute inset-0"
								aria-label={`Play ${file.fileName}`}
							></button>
						{:else if file.fileType === 'video'}
							<a
								href={`/video/${file.id}`}
								class="z-10 absolute inset-0"
								aria-label={`View ${file.fileName}`}
							></a>
						{:else if file.fileType === 'photo' || file.fileType === 'image'}
							<a
								href={`/photo?view=${file.id}`}
								class="z-10 absolute inset-0"
								aria-label={`View ${file.fileName}`}
							></a>
						{:else if file.fileType === 'document'}
							<a
								href={`/docs/${file.id}`}
								class="z-10 absolute inset-0"
								aria-label={`View ${file.fileName}`}
							></a>
						{:else}
							<button
								onclick={() => downloadFileClient(file)}
								class="z-10 absolute inset-0"
								aria-label={`Download ${file.fileName}`}
							></button>
						{/if}
						<div class="flex flex-1 items-center gap-4 min-w-0">
							<div
								class="flex justify-center items-center bg-gray-800 rounded-lg w-10 h-10 shrink-0"
							>
								<Icon size={20} class="text-gray-400" />
							</div>
							<div class="flex-1 min-w-0">
								<h4 class="font-medium text-white truncate" title={file.fileName}>
									{file.fileName}
								</h4>
								<div class="flex items-center gap-2 text-gray-500 text-xs">
									<span>{formatBytes(file.fileSize)}</span>
									<span>•</span>
									<span class="capitalize">{file.fileType}</span>
								</div>
							</div>
						</div>

						<div class="flex items-center gap-2 shrink-0">
							<!-- Direct file actions (visual only, handled by absolute overlay) -->
							{#if file.fileType === 'audio'}
								<div class="p-2 rounded-lg text-gray-400 group-hover:text-white">
									<Play size={18} />
								</div>
							{:else if file.fileType === 'video'}
								<div class="p-2 rounded-lg text-gray-400 group-hover:text-white">
									<Play size={18} />
								</div>
							{:else if file.fileType === 'photo' || file.fileType === 'image'}
								<div class="p-2 rounded-lg text-gray-400 group-hover:text-white">
									<Eye size={18} />
								</div>
							{:else}
								<div class="p-2 rounded-lg text-gray-400 group-hover:text-white">
									<Eye size={18} />
								</div>
							{/if}

							<!-- File Menu -->
							<div class="z-20 relative">
								<button
									class="hover:bg-white/10 p-1 rounded-lg text-gray-400 hover:text-white"
									onclick={(e) => toggleMenu(`file-${file.id}`, e)}
								>
									<MoreVertical size={18} />
								</button>
								{#if activeMenu === `file-${file.id}`}
									<div
										class="top-full right-0 z-50 absolute bg-[#151921] shadow-xl mt-2 p-1 border border-[#2A3241] rounded-xl w-48"
									>
										<button
											class="flex items-center gap-2 hover:bg-[#1A202A] px-3 py-2 rounded-lg w-full text-gray-300 hover:text-white text-sm"
											onclick={() => {
												if (selectedFiles.has(file.id)) {
													openMoveModal('', 'file', data.currentFolder?.category || 'document', true);
												} else {
													openMoveModal(file.id, 'file', file.fileType);
												}
												activeMenu = null;
											}}
										>
											<CornerDownRight size={16} /> Move to...
										</button>
										<button
											class="flex items-center gap-2 hover:bg-red-500/10 px-3 py-2 rounded-lg w-full text-red-400 text-sm"
											onclick={async (e) => {
												if (selectedFiles.has(file.id)) {
													e.preventDefault();
													deleteSelected();
													activeMenu = null;
												} else {
													activeMenu = null;
													if (await askConfirm('Delete this file? This cannot be undone.')) {
														const tid = toast.loading('Deleting file...');
														const res = await fetch('/api/bulk/delete', {
															method: 'POST',
															headers: { 'Content-Type': 'application/json' },
															body: JSON.stringify({ files: [file.id], folders: [] })
														});
														if (res.ok) {
															toast.success('File deleted', { id: tid });
															invalidateAll();
														} else {
															toast.error('Failed to delete file', { id: tid });
														}
													}
												}
											}}
										>
											<Trash2 size={16} /> Delete
										</button>
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
	<div class="z-50 fixed inset-0 flex justify-center items-center bg-black/80 backdrop-blur-sm p-4">
		<div class="bg-[#0B0E14] shadow-2xl p-6 border border-[#2A3241] rounded-2xl w-full max-w-md">
			<h3 class="mb-4 font-bold text-white text-xl">Create New Folder</h3>
			<div class="space-y-4">
				<div>
					<label class="block mb-1 text-gray-400 text-sm">Folder Name</label>
					<input
						type="text"
						bind:value={newFolderName}
						placeholder="E.g. Summer Vacation"
						class="bg-[#151921] px-4 py-2.5 border border-[#2A3241] focus:border-primary-container rounded-xl outline-none w-full text-white"
					/>
				</div>
				<!-- Only ask category if we are in Root folder -->
				{#if !currentFolderId}
					<div>
						<label class="block mb-1 text-gray-400 text-sm">Folder Category</label>
						<select
							bind:value={newFolderCategory}
							class="bg-[#151921] px-4 py-2.5 border border-[#2A3241] focus:border-primary-container rounded-xl outline-none w-full text-white"
						>
							<option value="document">Document</option>
							<option value="audio">Audio / Music</option>
							<option value="video">Video</option>
							<option value="image">Image / Photo</option>
						</select>
						<p class="mt-1 text-gray-500 text-xs">
							Files can only be moved to folders of the same category.
						</p>
					</div>
				{/if}
			</div>
			<div class="flex justify-end gap-3 mt-6">
				<button
					onclick={() => (showNewFolderModal = false)}
					class="px-4 py-2 rounded-xl font-medium text-gray-400 hover:text-white text-sm"
					>Cancel</button
				>
				<button
					onclick={createFolder}
					class="bg-primary-container hover:bg-primary-container/80 px-4 py-2 rounded-xl font-medium text-primary text-sm"
					>Create Folder</button
				>
			</div>
		</div>
	</div>
{/if}

{#if showRenameModal}
	<div class="z-50 fixed inset-0 flex justify-center items-center bg-black/80 backdrop-blur-sm p-4">
		<div class="bg-[#0B0E14] shadow-2xl p-6 border border-[#2A3241] rounded-2xl w-full max-w-md">
			<h3 class="mb-4 font-bold text-white text-xl">Rename Folder</h3>
			<input
				type="text"
				bind:value={renameFolderName}
				class="bg-[#151921] px-4 py-2.5 border border-[#2A3241] focus:border-primary-container rounded-xl outline-none w-full text-white"
			/>
			<div class="flex justify-end gap-3 mt-6">
				<button
					onclick={() => (showRenameModal = false)}
					class="px-4 py-2 rounded-xl font-medium text-gray-400 hover:text-white text-sm"
					>Cancel</button
				>
				<button
					onclick={renameFolder}
					class="bg-primary-container hover:bg-primary-container/80 px-4 py-2 rounded-xl font-medium text-primary text-sm"
					>Save Changes</button
				>
			</div>
		</div>
	</div>
{/if}

{#if showMoveModal}
	<div class="z-50 fixed inset-0 flex justify-center items-center bg-black/80 backdrop-blur-sm p-4">
		<div
			class="flex flex-col bg-[#0B0E14] shadow-2xl p-6 border border-[#2A3241] rounded-2xl w-full max-w-md max-h-[80vh]"
		>
			<h3 class="mb-1 font-bold text-white text-xl">Move to...</h3>
			<p class="mb-4 text-gray-400 text-sm">
				{#if isMultiMove}
					Select destination folder
				{:else}
					Select destination folder ({moveTargetCategory})
				{/if}
			</p>

			<div
				class="flex-1 space-y-2 bg-[#151921] p-2 border border-[#2A3241] rounded-xl overflow-y-auto"
			>
				<!-- Up to Parent Option -->
				{#if modalCurrentFolderId}
					<button
						class="flex items-center gap-3 hover:bg-[#1A202A] p-3 border border-transparent rounded-lg w-full text-white text-left transition-colors"
						onclick={() => {
							modalCurrentFolderId = modalCurrentFolder?.parentId || null;
							selectedDestinationId = modalCurrentFolderId;
						}}
					>
						<Home size={18} class="text-gray-400" />
						<span class="font-medium">../ (Parent Directory)</span>
					</button>
				{:else}
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
				{/if}

				<!-- Current Location Highlight (Optional, just visual) -->
				{#if modalCurrentFolder}
					<div class="px-3 py-2 font-semibold text-gray-500 text-xs uppercase tracking-wider">
						Inside: {modalCurrentFolder.name}
					</div>
				{/if}

				<!-- Folders list (Children of current modal folder) -->
				{#each modalChildrenFolders as folder}
					<!-- Don't show the folder itself if we're moving it -->
					{#if !isMultiMove ? (moveTargetType !== 'folder' || folder.id !== moveTargetId) : (!selectedFolders.has(folder.id))}
						<div class="flex items-center gap-2">
							<button
								class="flex-1 flex items-center gap-3 rounded-lg p-3 text-left transition-colors {selectedDestinationId ===
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
							<!-- Navigate into folder button -->
							<button
								class="hover:bg-[#1A202A] p-3 rounded-lg text-gray-400 hover:text-white"
								onclick={() => {
									modalCurrentFolderId = folder.id;
									selectedDestinationId = folder.id;
								}}
								title="Open folder"
							>
								<ChevronRight size={18} />
							</button>
						</div>
					{/if}
				{/each}
			</div>

			<div class="flex justify-end gap-3 mt-6 shrink-0">
				<button
					onclick={() => (showMoveModal = false)}
					class="px-4 py-2 rounded-xl font-medium text-gray-400 hover:text-white text-sm"
					>Cancel</button
				>
				<button
					onclick={moveItem}
					class="bg-primary-container hover:bg-primary-container/80 px-4 py-2 rounded-xl font-medium text-primary text-sm"
					>Move Here</button
				>
			</div>
		</div>
	</div>
{/if}

{#if isSelectionMode}
	<div class="bottom-10 left-[60%] z-[100] fixed flex items-center gap-4 bg-[#FF6B4A] shadow-[0_0_40px_rgba(255,107,74,0.3)] px-6 py-3 border border-[#FF6B4A]/50 rounded-full -translate-x-1/2">
		<span class="px-2 font-bold text-black">{selectedFiles.size + selectedFolders.size} selected</span>
		<button
			class="flex items-center gap-2 bg-black/20 hover:bg-black/30 px-4 py-2 rounded-xl font-bold text-black text-sm transition-colors"
			onclick={() => openMoveModal('', 'file', data.currentFolder?.category || 'document', true)}
		>
			<CornerDownRight size={16} /> Move
		</button>
		<button
			class="flex items-center gap-2 bg-black/20 hover:bg-black/30 px-4 py-2 rounded-xl font-bold text-black text-sm transition-colors"
			onclick={deleteSelected}
		>
			<Trash2 size={16} /> Delete
		</button>
		<div class="bg-black/20 w-px h-6"></div>
		<button
			class="p-2 text-black/70 hover:text-black transition-colors"
			onclick={clearSelection}
		>
			<X size={20} />
		</button>
	</div>
{/if}
