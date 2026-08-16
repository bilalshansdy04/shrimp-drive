import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { files } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { resolveTrackLyrics } from '$lib/server/lyrics';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const fileId = params.id;
	if (!fileId) {
		return json({ error: 'File ID is required' }, { status: 400 });
	}

	const track = await db.query.files.findFirst({
		where: and(eq(files.id, fileId), eq(files.userId, locals.user.id))
	});

	if (!track) {
		return json({ error: 'Track not found' }, { status: 404 });
	}

	if (track.fileType !== 'audio' && track.fileType !== 'video') {
		return json({ error: 'Invalid file type for lyrics' }, { status: 400 });
	}

	let romanizedType: 'romaji' | 'romanized' | null = null;
	const textToCheck = track.syncedLyrics || track.plainLyrics || '';
	if (/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(textToCheck)) {
		romanizedType = 'romaji';
	} else if (/[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f]/.test(textToCheck)) {
		romanizedType = 'romanized';
	}

	if (track.lyricsSource) {
		let finalRomajiLyrics = track.romajiLyrics;

		// Retroactive romanization for already cached files
		if (!finalRomajiLyrics && romanizedType && textToCheck) {
			const { transliterateLrc } = await import('$lib/server/lyrics');
			finalRomajiLyrics = await transliterateLrc(textToCheck, romanizedType === 'romaji' ? 'japanese' : 'korean');
			
			// Save the retroactively generated lyrics to the database
			await db.update(files)
				.set({ romajiLyrics: finalRomajiLyrics })
				.where(eq(files.id, fileId));
		}

		const normalizeForComparison = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
		if (finalRomajiLyrics && normalizeForComparison(finalRomajiLyrics) === normalizeForComparison(textToCheck)) {
			finalRomajiLyrics = null;
			romanizedType = null;
		}

		return json({
			syncedLyrics: track.syncedLyrics,
			plainLyrics: track.plainLyrics,
			romajiLyrics: finalRomajiLyrics,
			source: track.lyricsSource,
			romanizedType,
			status: (!track.syncedLyrics && !track.plainLyrics) ? 'not_found' : 'found'
		});
	}

	const result = await resolveTrackLyrics(
		fileId,
		track.title || track.fileName.replace(/\.[^/.]+$/, ''),
		track.artist || '',
		track.duration,
		undefined
	);
	
	let newRomanizedType: 'romaji' | 'romanized' | null = null;
	const newTextToCheck = result.syncedLyrics || result.plainLyrics || '';
	if (/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(newTextToCheck)) {
		newRomanizedType = 'romaji';
	} else if (/[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f]/.test(newTextToCheck)) {
		newRomanizedType = 'romanized';
	}

	const normalizeForComparison = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
	if (result.romajiLyrics && normalizeForComparison(result.romajiLyrics) === normalizeForComparison(newTextToCheck)) {
		result.romajiLyrics = null;
		newRomanizedType = null;
	}

	return json({ ...result, romanizedType: newRomanizedType });
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const fileId = params.id;
	if (!fileId) {
		return json({ error: 'File ID is required' }, { status: 400 });
	}

	const track = await db.query.files.findFirst({
		where: and(eq(files.id, fileId), eq(files.userId, locals.user.id))
	});

	if (!track) {
		return json({ error: 'Track not found' }, { status: 404 });
	}

	const body = await request.json();
	const { lyricsText, clear } = body;

	if (clear) {
		await db.update(files)
			.set({
				syncedLyrics: null,
				plainLyrics: null,
				romajiLyrics: null,
				lyricsSource: 'manual'
			})
			.where(eq(files.id, fileId));
		return json({ success: true, status: 'not_found', source: 'manual' });
	}

	if (!lyricsText || lyricsText.trim().length === 0) {
		return json({ error: 'No lyrics provided' }, { status: 400 });
	}

	let synced: string | null = null;
	let plain: string | null = null;
	let romaji: string | null = null;
	let romanizedType: 'romaji' | 'romanized' | null = null;

	const hasTimeTags = /^\[\d{2}:\d{2}(?:\.\d{1,3})?\]/m.test(lyricsText);
	if (hasTimeTags) {
		synced = lyricsText;
		plain = lyricsText.replace(/^\[\d{2}:\d{2}(?:\.\d{1,3})?\]/gm, '').trim();
	} else {
		plain = lyricsText;
	}

	const textToCheck = synced || plain || '';
	if (/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(textToCheck)) {
		romanizedType = 'romaji';
	} else if (/[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f]/.test(textToCheck)) {
		romanizedType = 'romanized';
	}

	if (romanizedType && textToCheck) {
		const { transliterateLrc } = await import('$lib/server/lyrics');
		romaji = await transliterateLrc(textToCheck, romanizedType === 'romaji' ? 'japanese' : 'korean');
	}

	await db.update(files)
		.set({
			syncedLyrics: synced,
			plainLyrics: plain,
			romajiLyrics: romaji,
			lyricsSource: 'manual'
		})
		.where(eq(files.id, fileId));

	const normalizeForComparison = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
	if (romaji && normalizeForComparison(romaji) === normalizeForComparison(textToCheck)) {
		romaji = null;
		romanizedType = null;
	}

	return json({
		success: true,
		status: 'found',
		source: 'manual',
		syncedLyrics: synced,
		plainLyrics: plain,
		romajiLyrics: romaji,
		romanizedType
	});
};
