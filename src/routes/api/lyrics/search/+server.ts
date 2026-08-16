import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const q = url.searchParams.get('q');
	if (!q) {
		return json({ error: 'Search query is required' }, { status: 400 });
	}

	try {
		const lrclibUrl = new URL('https://lrclib.net/api/search');
		lrclibUrl.searchParams.append('q', q);

		const response = await fetch(lrclibUrl.toString(), {
			headers: {
				'User-Agent': 'ShrimpDrive/1.0 (https://github.com/shrimp-drive)'
			}
		});

		if (!response.ok) {
			console.error('LRCLIB search error:', response.statusText);
			return json({ error: 'Failed to fetch from LRCLIB' }, { status: response.status });
		}

		const data = await response.json();
		
		// Map to a simplified array
		const results = data.map((item: any) => ({
			id: item.id,
			trackName: item.trackName,
			artistName: item.artistName,
			albumName: item.albumName,
			duration: item.duration,
			syncedLyrics: item.syncedLyrics,
			plainLyrics: item.plainLyrics
		}));

		return json({ results });
	} catch (e) {
		console.error('Failed to search lyrics', e);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
