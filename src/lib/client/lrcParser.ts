export interface LyricLine {
	time: number; // in seconds
	text: string;
}

export function parseLrc(lrcString: string): LyricLine[] {
	if (!lrcString) return [];

	const lines = lrcString.split('\n');
	const parsed: LyricLine[] = [];

	const timeRegex = /\[(\d{2,}):(\d{2}(?:\.\d{1,3})?)\]/g;

	for (const line of lines) {
		const matches = [...line.matchAll(timeRegex)];
		const text = line.replace(timeRegex, '').trim();

		for (const match of matches) {
			const minutes = parseInt(match[1], 10);
			const seconds = parseFloat(match[2]);
			const timeInSeconds = minutes * 60 + seconds;
			
			parsed.push({
				time: timeInSeconds,
				text
			});
		}
	}

	return parsed.sort((a, b) => a.time - b.time);
}
