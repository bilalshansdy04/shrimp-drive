import { invalidateAll } from '$app/navigation';
import { toast } from 'svelte-sonner';

export type UploadStatus = 'idle' | 'extracting_thumb' | 'uploading' | 'completed' | 'error';

export interface UploadItem {
	id: string;
	file: File;
	status: UploadStatus;
	progress: number;
	errorMsg?: string;
	folderId?: string | null;
}

class UploadState {
	items = $state<UploadItem[]>([]);
	isOpen = $state(false);
	isProcessing = $state(false);

	get totalItems() {
		return this.items.length;
	}

	get completedItems() {
		return this.items.filter((i) => i.status === 'completed').length;
	}

	get pendingItems() {
		return this.items.filter((i) => i.status === 'idle' || i.status === 'extracting_thumb' || i.status === 'uploading');
	}

	addFiles(files: FileList | File[], folderId?: string | null) {
		// Clear the queue if there are no pending uploads (all are completed/error)
		if (this.pendingItems.length === 0) {
			this.items = [];
		}

		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			if (file.size > 20 * 1024 * 1024) {
				toast.error(`File ${file.name} exceeds 20MB limit.`);
				continue;
			}

			this.items.push({
				id: crypto.randomUUID(),
				file,
				status: 'idle',
				progress: 0,
				folderId
			});
		}

		if (this.items.length > 0) {
			this.isOpen = true;
			this.processQueue();
		}
	}

	removeFile(id: string) {
		this.items = this.items.filter((i) => i.id !== id);
		if (this.items.length === 0) {
			this.isOpen = false;
		}
	}

	clearCompleted() {
		this.items = this.items.filter((i) => i.status !== 'completed');
		if (this.items.length === 0) {
			this.isOpen = false;
		}
	}

	private async processQueue() {
		if (this.isProcessing) return;
		this.isProcessing = true;

		while (true) {
			const nextItem = this.items.find((i) => i.status === 'idle');
			if (!nextItem) break;

			await this.uploadItem(nextItem);
		}

		this.isProcessing = false;
	}

	private async uploadItem(item: UploadItem) {
		item.status = 'extracting_thumb';
		
		const formData = new FormData();
		formData.append('file', item.file);

		if (item.folderId) {
			formData.append('folderId', item.folderId);
		}

		// Extract thumbnail if needed
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

		return new Promise<void>((resolve) => {
			const xhr = new XMLHttpRequest();
			
			xhr.upload.addEventListener('progress', (event) => {
				if (event.lengthComputable) {
					item.progress = Math.round((event.loaded / event.total) * 100);
				}
			});

			xhr.addEventListener('load', async () => {
				if (xhr.status >= 200 && xhr.status < 300) {
					item.status = 'completed';
					item.progress = 100;
					await invalidateAll();
				} else {
					item.status = 'error';
					try {
						const responseData = JSON.parse(xhr.responseText);
						item.errorMsg = responseData.error || 'Upload failed';
					} catch {
						item.errorMsg = 'Upload failed';
					}
				}
				resolve();
			});

			xhr.addEventListener('error', () => {
				item.status = 'error';
				item.errorMsg = 'Connection error';
				resolve();
			});

			xhr.open('POST', '/api/files/upload');
			xhr.send(formData);
		});
	}
}

export const uploadState = new UploadState();
