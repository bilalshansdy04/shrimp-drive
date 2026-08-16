import { db } from './db';
import { files } from './db/schema';
import { eq } from 'drizzle-orm';

interface LrclibResponse {
	syncedLyrics: string | null;
	plainLyrics: string | null;
}

// @ts-expect-error - No type definitions available
import KuroshiroImport from 'kuroshiro';
// @ts-expect-error - No type definitions available
import KuromojiAnalyzerImport from 'kuroshiro-analyzer-kuromoji';

const Kuroshiro = KuroshiroImport.default || KuroshiroImport;
const KuromojiAnalyzer = KuromojiAnalyzerImport.default || KuromojiAnalyzerImport;

import pkg from '@romanize/korean';
const { romanize: romanizeKorean } = pkg;

let kuroshiroInstance: any | null = null;
let kuroshiroInitializing = false;

import path from 'path';

import fs from 'fs';

async function getKuroshiro() {
	if (kuroshiroInstance) return kuroshiroInstance;
	
	// Avoid multiple concurrent initializations
	if (kuroshiroInitializing) {
		while (kuroshiroInitializing) {
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
		return kuroshiroInstance;
	}

	kuroshiroInitializing = true;
	try {
		const kuroshiro = new Kuroshiro();
		
		// Find the correct dictPath depending on the environment
		let dictPath = path.join(process.cwd(), 'node_modules/kuromoji/dict');
		if (!fs.existsSync(dictPath)) {
			console.log('Kuromoji dict not found at', dictPath, 'trying alternative path...');
			// Try finding it relative to this file (useful for some build setups)
			const altPath = path.resolve(process.cwd(), '../../node_modules/kuromoji/dict');
			if (fs.existsSync(altPath)) {
				dictPath = altPath;
			}
		}

		console.log('Initializing Kuromoji with dictPath:', dictPath);
		await kuroshiro.init(new KuromojiAnalyzer({ dictPath }));
		kuroshiroInstance = kuroshiro;
	} catch (e) {
		console.error("Failed to initialize kuroshiro", e);
		// Do not set to null silently if it failed to init due to dictionary error, 
		// otherwise we save Kanji as Romaji!
	} finally {
		kuroshiroInitializing = false;
	}
	return kuroshiroInstance;
}

// Regex to detect Japanese characters
const hasJapanese = (str: string) => /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(str);

// Regex to detect Korean characters
const hasKorean = (str: string) => /[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f]/.test(str);

export async function transliterateLrc(lrcString: string, type: 'japanese' | 'korean'): Promise<string | null> {
	const lines = lrcString.split('\n');
	
	if (type === 'japanese') {
		const kuroshiro = await getKuroshiro();
		if (!kuroshiro) return null; // Return null if init fails to prevent saving kanji as romaji

		const convertedLines = await Promise.all(
			lines.map(async (line) => {
				const timeMatch = line.match(/^(\[\d{2}:\d{2}(?:\.\d{1,3})?\])(.*)$/);
				let timeTag = '';
				let text = line.trim();
				
				if (timeMatch) {
					timeTag = timeMatch[1] + ' ';
					text = timeMatch[2].trim();
				}

				if (hasJapanese(text)) {
					const romajiText = await kuroshiro.convert(text, { to: 'romaji', mode: 'spaced', romajiSystem: 'passport' });
					return `${timeTag}${romajiText}`.trim();
				}
				return line;
			})
		);
		return convertedLines.join('\n');
	} else if (type === 'korean') {
		const convertedLines = lines.map((line) => {
			const timeMatch = line.match(/^(\[\d{2}:\d{2}(?:\.\d{1,3})?\])(.*)$/);
			let timeTag = '';
			let text = line.trim();
			
			if (timeMatch) {
				timeTag = timeMatch[1] + ' ';
				text = timeMatch[2].trim();
			}

			if (hasKorean(text)) {
				const romajiText = romanizeKorean(text);
				return `${timeTag}${romajiText}`.trim();
			}
			return line;
		});
		return convertedLines.join('\n');
	}
	
	return lrcString;
}

export async function fetchLrclibLyrics(
	title: string,
	artist: string,
	duration?: number | null
): Promise<LrclibResponse | null> {
	const url = new URL('https://lrclib.net/api/get');
	url.searchParams.append('track_name', title);
	url.searchParams.append('artist_name', artist);
	if (duration) {
		url.searchParams.append('duration', duration.toString());
	}

	try {
		const response = await fetch(url.toString(), {
			headers: {
				'User-Agent': 'ShrimpDrive/1.0 (https://github.com/shrimp-drive)'
			}
		});

		if (response.status === 404) {
			return null;
		}

		if (!response.ok) {
			console.error('LRCLIB API error:', response.status, await response.text());
			return null;
		}

		const data = await response.json();
		return data as LrclibResponse;
	} catch (error) {
		console.error('Failed to fetch from LRCLIB:', error);
		return null;
	}
}

export async function resolveTrackLyrics(
	fileId: string,
	title: string,
	artist: string,
	duration: number | null,
	embeddedLyrics?: string
) {
	let synced: string | null = null;
	let plain: string | null = null;
	let romaji: string | null = null;
	let source = 'not_found';

	if (embeddedLyrics) {
		synced = embeddedLyrics;
		source = 'embedded';
	} else {
		const lrcData = await fetchLrclibLyrics(title, artist, duration);
		if (lrcData && (lrcData.syncedLyrics || lrcData.plainLyrics)) {
			synced = lrcData.syncedLyrics;
			plain = lrcData.plainLyrics;
			source = 'lrclib';
		}
	}

	const textToTransliterate = synced || plain;
	if (textToTransliterate) {
		if (hasJapanese(textToTransliterate)) {
			romaji = await transliterateLrc(textToTransliterate, 'japanese');
		} else if (hasKorean(textToTransliterate)) {
			romaji = await transliterateLrc(textToTransliterate, 'korean');
		}
	}

	await db.update(files)
		.set({
			syncedLyrics: synced,
			plainLyrics: plain,
			romajiLyrics: romaji,
			lyricsSource: source
		})
		.where(eq(files.id, fileId));

	return {
		syncedLyrics: synced,
		plainLyrics: plain,
		romajiLyrics: romaji,
		source,
		status: source === 'not_found' ? 'not_found' : 'found'
	};
}
