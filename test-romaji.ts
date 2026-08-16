import { transliterateLrc } from './src/lib/server/lyrics.js';

const lrc = `[02:12.26] あぁ 泣けるぜ 絶句しちゃうまで離れない
[02:19.30] 革命道中だって君に夢中
[02:24.00] 揺蕩う旅の狭間で見つけた`;

async function test() {
	try {
		console.log("Starting test...");
		const romaji = await transliterateLrc(lrc, 'japanese');
		console.log("Result:\n", romaji);
	} catch (e) {
		console.error("Error:", e);
	}
}

test();
