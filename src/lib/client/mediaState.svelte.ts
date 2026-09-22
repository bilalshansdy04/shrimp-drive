class MediaState {
	playlist = $state<any[]>([]);
	currentIndex = $state(-1);
	isPaused = $state(true);
	isLoadingTrack = $state(false);
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
		return `/api/files/${file.id}/download`;
	}
}

export const media = new MediaState();

export async function downloadFileClient(file: any, preview: boolean = false) {
	const url = `/api/files/${file.id}/download`;
	window.open(url + (preview ? '' : '?download=true'), '_blank');
}

export async function getFileBlobUrl(file: any): Promise<string | null> {
	return `/api/files/${file.id}/download`;
}
