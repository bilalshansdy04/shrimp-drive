import { invalidateAll } from '$app/navigation';
import { toast } from 'svelte-sonner';
import { get } from 'svelte/store';
import { encryptFileBlob, encryptMetadata } from '$lib/client/crypto';
import { vaultKeyStore } from '$lib/client/encryptionStore';

import * as musicMetadata from 'music-metadata-browser';

export type UploadStatus =
	| 'conflict'
	| 'idle'
	| 'extracting_thumb'
	| 'uploading'
	| 'cooldown'
	| 'queued_for_sending'
	| 'wait_send'
	| 'sending'
	| 'completed'
	| 'error';

export interface UploadItem {
	id: string;
	file: File;
	status: UploadStatus;
	progress: number;
	errorMsg?: string;
	folderId?: string | null;
	conflictAction?: 'rename' | 'replace';
	replaceFileId?: string;
	_resolveUpload?: () => void;
	_resolveSend?: (success: boolean, err?: string) => void;
	_sendFinished?: boolean;
	_sendSuccess?: boolean;
	_sendErr?: string;
	_xhr?: XMLHttpRequest;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class UploadState {
	items = $state<UploadItem[]>([]);
	isOpen = $state(false);
	globalCooldownUntil = $state(0);

	isUploadingActive = $state(false);
	isSendingActive = $state(false);

	isEncryptionActive = $state(false);
	encryptionMode = $state('flexible');

	get isRateLimited() {
		return this.globalCooldownUntil > Date.now();
	}

	get totalItems() {
		return this.items.length;
	}

	get completedItems() {
		return this.items.filter((i) => i.status === 'completed').length;
	}

	get pendingItems() {
		return this.items.filter((i) => i.status !== 'completed' && i.status !== 'error');
	}

	private activeXHR: XMLHttpRequest | null = null;

	public setEncryptionSettings(mode: string, active: boolean | number) {
		this.encryptionMode = mode;
		this.isEncryptionActive = !!active;
	}

	public async addFiles(fileList: FileList, folderId: string | null = null) {
		if (this.pendingItems.length === 0) {
			this.items = [];
		}

		const validFiles: File[] = [];
		const files = Array.from(fileList);
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			// Remove 20MB limit since we're doing chunked uploads now (up to 50MB Telegram limit)
			if (file.size > 50 * 1024 * 1024) {
				toast.error(`File ${file.name} exceeds 50MB limit.`);
				continue;
			}
			validFiles.push(file);
		}

		if (validFiles.length === 0) return;

		// Check conflicts
		const fileNames = validFiles.map((f) => f.name);
		let conflictsMap = new Map<string, string>(); // fileName -> fileId
		try {
			const res = await fetch('/api/files/check-conflicts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ folderId, fileNames })
			});
			if (res.ok) {
				const data = await res.json();
				for (const conflict of data.conflicts || []) {
					conflictsMap.set(conflict.fileName, conflict.fileId);
				}
			}
		} catch (e) {
			console.error('Failed to check conflicts', e);
		}

		for (const file of validFiles) {
			const isConflict = conflictsMap.has(file.name);
			this.items.push({
				id: crypto.randomUUID(),
				file,
				status: isConflict ? 'conflict' : 'idle',
				progress: 0,
				folderId,
				replaceFileId: isConflict ? conflictsMap.get(file.name) : undefined,
				_sendFinished: false
			});
		}

		if (this.items.length > 0) {
			this.isOpen = true;
			this.processUploadQueue();
			this.processSendingQueue();
		}
	}

	removeFile(id: string) {
		const item = this.items.find((i) => i.id === id);
		if (item && item._xhr) {
			item._xhr.abort();
		}
		this.items = this.items.filter((i) => i.id !== id);
		if (this.items.length === 0) {
			this.isOpen = false;
		}
	}

	cancelItem(id: string) {
		this.removeFile(id);
	}

	retryItem(id: string) {
		const item = this.items.find((i) => i.id === id);
		if (item && item.status === 'error') {
			item.status = 'idle';
			item.progress = 0;
			item.errorMsg = undefined;
			item._sendFinished = false;
			item._sendSuccess = undefined;
			item._sendErr = undefined;
			item._resolveSend = undefined;
			
			this.processUploadQueue();
			this.processSendingQueue();
		}
	}

	resolveConflict(id: string, action: 'skip' | 'continue' | 'replace') {
		const item = this.items.find((i) => i.id === id);
		if (!item || item.status !== 'conflict') return;

		if (action === 'skip') {
			this.removeFile(id);
		} else if (action === 'continue') {
			item.conflictAction = 'rename';
			item.status = 'idle';
			this.processUploadQueue();
			this.processSendingQueue();
		} else if (action === 'replace') {
			item.conflictAction = 'replace';
			item.status = 'idle';
			this.processUploadQueue();
			this.processSendingQueue();
		}
	}

	cancelAll() {
		for (const item of this.items) {
			if (item._xhr) {
				item._xhr.abort();
			}
		}
		this.items = [];
		this.isOpen = false;
	}

	clearCompleted() {
		this.items = this.items.filter((i) => i.status !== 'completed');
		if (this.items.length === 0) {
			this.isOpen = false;
		}
	}

	private async processUploadQueue() {
		if (this.isUploadingActive) return;
		this.isUploadingActive = true;

		while (true) {
			if (Date.now() < this.globalCooldownUntil) {
				await wait(1000);
				continue;
			}

			const nextItem = this.items.find((i) => i.status === 'idle');
			if (!nextItem) {
				const stillCooldown = this.items.some(
					(i) =>
						i.status === 'cooldown' ||
						i.status === 'queued_for_sending' ||
						i.status === 'sending' ||
						i.status === 'wait_send'
				);
				if (stillCooldown || Date.now() < this.globalCooldownUntil) {
					await wait(500);
					continue;
				}
				break;
			}

			await this.uploadItemToVPS(nextItem);

			if (
				nextItem.status === 'queued_for_sending' ||
				nextItem.status === 'sending' ||
				nextItem._sendFinished
			) {
				const prev = nextItem.status;
				if (prev !== 'completed' && prev !== 'error') {
					nextItem.status = 'cooldown';
					await wait(500);
					if (nextItem.status === 'cooldown') {
						nextItem.status = prev;
					}
				} else {
					await wait(500);
				}
			} else {
				await wait(500);
			}
		}

		this.isUploadingActive = false;
	}

	private async processSendingQueue() {
		if (this.isSendingActive) return;
		this.isSendingActive = true;

		while (true) {
			let nextItem = this.items.find(
				(i) =>
					i.status === 'queued_for_sending' ||
					(i.status === 'cooldown' && i._sendFinished === false)
			);

			if (!nextItem) {
				const stillUploading = this.items.some(
					(i) =>
						i.status === 'idle' ||
						i.status === 'extracting_thumb' ||
						i.status === 'uploading' ||
						i.status === 'cooldown'
				);
				if (stillUploading) {
					await wait(200);
					continue;
				} else {
					break;
				}
			}

			nextItem.status = 'wait_send';
			await wait(1000);

			if (nextItem._sendFinished) {
				nextItem.status = nextItem._sendSuccess ? 'completed' : 'error';
				if (!nextItem._sendSuccess) nextItem.errorMsg = nextItem._sendErr;
				if (nextItem._sendSuccess) await invalidateAll();
			} else {
				nextItem.status = 'sending';

				await new Promise<void>((resolve) => {
					nextItem!._resolveSend = (success, err) => {
						nextItem!._sendFinished = true;
						nextItem!._sendSuccess = success;
						nextItem!._sendErr = err;

						nextItem!.status = success ? 'completed' : 'error';
						if (!success) nextItem!.errorMsg = err;
						resolve();
					};
				});

				if (nextItem._sendSuccess) {
					await invalidateAll();
				}
			}
			await wait(1000);
		}
		this.isSendingActive = false;
	}

	private async uploadItemToVPS(item: UploadItem) {
		const file = item.file;
		const totalChunks = Math.ceil(file.size / (3.5 * 1024 * 1024));
		const telegramFileIds: string[] = [];
		
		item.status = 'uploading';
		item.progress = 0;

		for (let i = 0; i < totalChunks; i++) {
			const start = i * (3.5 * 1024 * 1024);
			const end = Math.min(start + (3.5 * 1024 * 1024), file.size);
			const chunkBlob = file.slice(start, end);

			item.progress = Math.round((i / totalChunks) * 100);

			const formData = new FormData();
			formData.append('chunk', chunkBlob);
			formData.append('chunkIndex', i.toString());
			formData.append('fileName', file.name);

			const res = await fetch('/api/files/upload-chunk', {
				method: 'POST',
				body: formData
			});

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(`Chunk ${i + 1} upload failed: ${errorData.error || 'Unknown error'}`);
			}

			const result = await res.json();
			telegramFileIds.push(result.telegramFileId);

			if (i < totalChunks - 1) {
				await wait(5000);
			}
		}

		const finalizeRes = await fetch('/api/files/finalize', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: file.name,
				size: file.size,
				mimeType: file.type || 'application/octet-stream',
				fileType: this.getFileType(file.type, file.name),
				folderId: item.folderId || null,
				parts: telegramFileIds,
				conflictAction: item.conflictAction || 'rename',
				replaceFileId: item.replaceFileId || null
			})
		});

		if (!finalizeRes.ok) {
			const errorData = await finalizeRes.json();
			throw new Error(`Finalization failed: ${errorData.error || 'Unknown error'}`);
		}

		item.progress = 100;
		item.status = 'completed';
	}

	private getFileType(mimeType: string, fileName: string): string {
		const ext = fileName.split('.').pop()?.toLowerCase()?.trim() || '';
		const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'heic', 'svg', 'tiff', 'raw'];
		const videoExts = ['mp4', 'mkv', 'webm', 'avi', 'mov', 'flv', 'wmv'];
		const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'];

		if (mimeType.startsWith('audio/') || audioExts.includes(ext)) return 'audio';
		if (mimeType.startsWith('video/') || videoExts.includes(ext)) return 'video';
		if (mimeType.startsWith('image/') || imageExts.includes(ext)) return 'image';
		return 'document';
	}
}

export const uploadState = new UploadState();
