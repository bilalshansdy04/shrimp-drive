const Kuroshiro = require('kuroshiro');
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji');
const path = require('path');

async function test() {
    console.log("Initializing kuroshiro...");
    const kuroshiro = new Kuroshiro();
    const dictPath = path.join(process.cwd(), 'node_modules/kuromoji/dict');
    console.log("Dict path:", dictPath);
    try {
        await kuroshiro.init(new KuromojiAnalyzer({ dictPath }));
        console.log("Initialized!");
        
        const text = "暗闇染み込む世界で見つけた";
        const romaji = await kuroshiro.convert(text, { to: 'romaji', mode: 'spaced', romajiSystem: 'passport' });
        console.log("Romaji:", romaji);
        
        const textKanaToRomaji = Kuroshiro.Util.kanaToRomaji(romaji);
        console.log("Romaji Kana to Romaji:", textKanaToRomaji);
    } catch(e) {
        console.error("Failed!", e);
    }
}
test();
