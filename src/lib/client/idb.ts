import { createStore, get, set, clear } from 'idb-keyval';

const store = createStore('shrimp-drive-db', 'thumbnails');

export async function saveThumbnail(id: string, blob: Blob): Promise<void> {
	try {
		await set(id, blob, store);
	} catch (e) {
		console.error('Failed to save thumbnail to IndexedDB:', e);
	}
}

export async function getThumbnail(id: string): Promise<Blob | undefined> {
	try {
		return await get<Blob>(id, store);
	} catch (e) {
		console.error('Failed to get thumbnail from IndexedDB:', e);
		return undefined;
	}
}

export async function clearThumbnails(): Promise<void> {
	try {
		await clear(store);
	} catch (e) {
		console.error('Failed to clear thumbnails from IndexedDB:', e);
	}
}
