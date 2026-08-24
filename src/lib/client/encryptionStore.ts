import { writable } from 'svelte/store';

export const vaultKeyStore = writable<Uint8Array | null>(null);

// Initialize from sessionStorage on mount (only runs in browser)
if (typeof window !== 'undefined') {
	const stored = sessionStorage.getItem('shrimp_dek');
	if (stored) {
		try {
			const binaryString = atob(stored);
			const bytes = new Uint8Array(binaryString.length);
			for (let i = 0; i < binaryString.length; i++) {
				bytes[i] = binaryString.charCodeAt(i);
			}
			vaultKeyStore.set(bytes);
		} catch (e) {
			console.error('Failed to restore vault key from session', e);
		}
	}
}

export function saveVaultKeyToSession(key: Uint8Array) {
	vaultKeyStore.set(key);
	if (typeof window !== 'undefined') {
		const base64 = btoa(String.fromCharCode.apply(null, key as unknown as number[]));
		sessionStorage.setItem('shrimp_dek', base64);
	}
}

export function clearVaultKey() {
	vaultKeyStore.set(null);
	if (typeof window !== 'undefined') {
		sessionStorage.removeItem('shrimp_dek');
	}
}
