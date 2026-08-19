import { invalidateAll } from '$app/navigation';
import { toast } from 'svelte-sonner';

export type UploadStatus = 'conflict' | 'idle' | 'extracting_thumb' | 'uploading' | 'cooldown' | 'queued_for_sending' | 'wait_send' | 'sending' | 'completed' | 'error';

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

	async addFiles(files: FileList | File[], folderId?: string | null) {
		if (this.pendingItems.length === 0) {
			this.items = [];
		}

		const validFiles: File[] = [];
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			if (file.size > 20 * 1024 * 1024) {
				toast.error(`File ${file.name} exceeds 20MB limit.`);
				continue;
			}
			validFiles.push(file);
		}

		if (validFiles.length === 0) return;

		// Check conflicts
		const fileNames = validFiles.map(f => f.name);
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
		} catch(e) {
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
				const stillCooldown = this.items.some(i => i.status === 'cooldown' || i.status === 'queued_for_sending' || i.status === 'sending' || i.status === 'wait_send');
				if (stillCooldown || Date.now() < this.globalCooldownUntil) {
					await wait(500);
					continue;
				}
				break;
			}

			await this.uploadItemToVPS(nextItem);
			
			if (nextItem.status === 'queued_for_sending' || nextItem.status === 'sending' || nextItem._sendFinished) {
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
			let nextItem = this.items.find((i) => 
				i.status === 'queued_for_sending' || 
				(i.status === 'cooldown' && i._sendFinished === false)
			);
			
			if (!nextItem) {
				const stillUploading = this.items.some(i => i.status === 'idle' || i.status === 'extracting_thumb' || i.status === 'uploading' || i.status === 'cooldown');
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
		item.status = 'extracting_thumb';
		
		const formData = new FormData();
		formData.append('file', item.file);

		if (item.folderId) {
			formData.append('folderId', item.folderId);
		}
		if (item.conflictAction) {
			formData.append('conflictAction', item.conflictAction);
		}
		if (item.replaceFileId) {
			formData.append('replaceFileId', item.replaceFileId);
		}

		if (item.file.type.startsWith('video/')) {
			try {
				const videoInfo = await new Promise<{ dataUrl: string | null; duration: number }>((resolve) => {
					const video = document.createElement('video');
					video.preload = 'metadata';
					video.muted = true;
					video.src = URL.createObjectURL(item.file);

					video.onloadedmetadata = () => {
						if (video.duration === Infinity) {
							video.currentTime = 1e101;
							video.ontimeupdate = () => {
								video.ontimeupdate = null;
								video.currentTime = 0;
							};
						}
					};

					video.onloadeddata = () => {
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

				if (videoInfo.dataUrl) formData.append('videoThumbnail', videoInfo.dataUrl);
				if (videoInfo.duration > 0) formData.append('videoDuration', videoInfo.duration.toString());
			} catch (e) {
				console.error('Thumbnail extraction failed', e);
			}
		} else if (item.file.type.startsWith('image/')) {
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
						URL.revokeObjectURL(img.src);
						resolve(null);
					};
					img.src = URL.createObjectURL(item.file);
				});

				if (imageThumbnail) formData.append('imageThumbnail', imageThumbnail);
			} catch (e) {
				console.error('Image thumbnail extraction failed', e);
			}
		}

		item.status = 'uploading';

		return new Promise<void>((resolveUpload) => {
			const xhr = new XMLHttpRequest();
			item._xhr = xhr;
			let hasResolvedUpload = false;

			const triggerUploadDone = (isRateLimited = false) => {
				if (!hasResolvedUpload) {
					hasResolvedUpload = true;
					if (item.status === 'uploading' && !isRateLimited) {
						item.status = 'queued_for_sending';
					}
					resolveUpload();
				}
			};
			
			xhr.upload.addEventListener('progress', (event) => {
				if (event.lengthComputable) {
					item.progress = Math.round((event.loaded / event.total) * 100);
					if (item.progress === 100) {
						triggerUploadDone();
					}
				}
			});

			xhr.addEventListener('load', () => {
				let success = false;
				let errMsg = 'Upload failed';

				if (xhr.status === 429) {
					try {
						const responseData = JSON.parse(xhr.responseText);
						const retryAfter = responseData.retryAfter || 25;
						this.globalCooldownUntil = Date.now() + retryAfter * 1000;
					} catch {
						this.globalCooldownUntil = Date.now() + 25000;
					}
					item.status = 'idle';
					item.progress = 0;
					triggerUploadDone(true);
					return;
				}

				triggerUploadDone();

				if (xhr.status >= 200 && xhr.status < 300) {
					success = true;
					item.progress = 100;
				} else {
					try {
						const responseData = JSON.parse(xhr.responseText);
						errMsg = responseData.error || 'Upload failed';
					} catch {
						errMsg = 'Upload failed';
					}
				}

				if (item._resolveSend) {
					item._resolveSend(success, errMsg);
				} else {
					item._sendFinished = true;
					item._sendSuccess = success;
					item._sendErr = errMsg;
				}
			});

			xhr.addEventListener('error', () => {
				triggerUploadDone();
				item.status = 'error';
				if (item._resolveSend) {
					item._resolveSend(false, 'Connection error or aborted');
				} else {
					item._sendFinished = true;
					item._sendSuccess = false;
					item._sendErr = 'Connection error or aborted';
				}
			});
			
			xhr.addEventListener('abort', () => {
				triggerUploadDone();
				item.status = 'error';
				if (item._resolveSend) {
					item._resolveSend(false, 'Upload aborted');
				} else {
					item._sendFinished = true;
					item._sendSuccess = false;
					item._sendErr = 'Upload aborted';
				}
			});

			xhr.open('POST', '/api/files/upload');
			xhr.send(formData);
		});
	}
}

export const uploadState = new UploadState();
