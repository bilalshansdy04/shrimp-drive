class MediaState {
	playlist = $state<any[]>([]);
	currentIndex = $state(-1);
	isPaused = $state(true);
	currentTime = $state(0);
	duration = $state(0);
	volume = $state(1);

	get currentTrack() {
		return this.currentIndex >= 0 && this.currentIndex < this.playlist.length
			? this.playlist[this.currentIndex]
			: null;
	}

	playTrack(index: number, tracks?: any[]) {
		if (tracks) {
			this.playlist = tracks;
		}
		this.currentIndex = index;
		this.isPaused = false;
	}

	togglePlay() {
		if (this.currentIndex === -1 && this.playlist.length > 0) {
			this.playTrack(0);
		} else if (this.currentIndex !== -1) {
			this.isPaused = !this.isPaused;
		}
	}

	playNext() {
		if (this.currentIndex < this.playlist.length - 1) {
			this.playTrack(this.currentIndex + 1);
		}
	}

	playPrev() {
		if (this.currentIndex > 0) {
			this.playTrack(this.currentIndex - 1);
		}
	}

	setPlaylist(tracks: any[]) {
		this.playlist = tracks;
	}

	async loadTrack(file: any) {
		const url = `/api/files/${file.id}/download`;
		if (!file.isEncrypted) {
			return url;
		}

		// Zero-Knowledge Decryption
		const { get } = await import('svelte/store');
		const { vaultKeyStore } = await import('$lib/client/encryptionStore');
		const { decryptFileBlob } = await import('$lib/client/crypto');

		const dek = get(vaultKeyStore);
		if (!dek) {
			console.error('Cannot decrypt file: DEK not available in memory');
			return null;
		}

		try {
			const res = await fetch(url);
			if (!res.ok) throw new Error('Failed to fetch track');
			const encryptedBlob = await res.blob();
			const decryptedBlob = await decryptFileBlob(encryptedBlob, dek, file.mimeType);
			return URL.createObjectURL(decryptedBlob);
		} catch (e) {
			console.error('Failed to decrypt audio track', e);
			return null;
		}
	}
}

export const media = new MediaState();

export async function downloadFileClient(file: any, preview: boolean = false) {
	const url = `/api/files/${file.id}/download`;
	if (!file.isEncrypted) {
		// Normal download or preview
		window.open(url + (preview ? '' : '?download=true'), '_blank');
		return;
	}

	// Zero-Knowledge Decryption
	const { get } = await import('svelte/store');
	const { vaultKeyStore } = await import('$lib/client/encryptionStore');
	const { decryptFileBlob } = await import('$lib/client/crypto');

	const dek = get(vaultKeyStore);
	if (!dek) {
		alert('Cannot decrypt file: Encryption key not available in memory.');
		return;
	}

	try {
		const res = await fetch(url);
		if (!res.ok) throw new Error('Failed to fetch file');
		const encryptedBlob = await res.blob();
		const decryptedBlob = await decryptFileBlob(encryptedBlob, dek, file.mimeType);

		const blobUrl = URL.createObjectURL(decryptedBlob);

		if (preview) {
			window.open(blobUrl, '_blank');
		} else {
			const a = document.createElement('a');
			a.href = blobUrl;
			a.download = file.fileName;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(blobUrl);
		}
	} catch (e) {
		console.error('Failed to decrypt file', e);
		alert('Failed to decrypt file.');
	}
}
