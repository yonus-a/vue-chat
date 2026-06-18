import emojiDataRaw from '@emoji-mart/data';

// `@emoji-mart/data` no longer ships typings for its top-level `.emojis` /
// `.categories` shape, so we cast at the import boundary.
const emojiData = emojiDataRaw as unknown as {
    emojis: Record<string, { skins?: Array<{ native?: string; unified?: string }> }>;
    categories: Array<{ id: string; emojis: string[] }>;
};

// 1. Build a highly optimized lookup table ONCE
// Maps Native ('😀') -> Emoji-Mart Hex ('1f600')
const nativeToHex = new Map();

if (emojiData && emojiData.emojis) {
    for (const key in emojiData.emojis) {
        const skins = emojiData.emojis[key].skins;
        if (skins) {
            skins.forEach((skin: any) => {
                if (skin.native && skin.unified) {
                    nativeToHex.set(skin.native, skin.unified);
                }
            });
        }
    }
}

export function parseEmojiArray(text: string | undefined) {
  if (!text) return [];

  // Safely split text by visual characters
  const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
  const graphemes = Array.from(segmenter.segment(text)).map(s => s.segment);

  const emojiRegex = /\p{Extended_Pictographic}/u;
  const result = [];
  let currentText = '';

  for (const grapheme of graphemes) {
    if (emojiRegex.test(grapheme)) {
      if (currentText) {
        result.push({ type: 'text', content: currentText });
        currentText = '';
      }
      
      // 2. CHECK THE EMOJI-MART DICTIONARY FIRST
      // This guarantees the filename matches the picker exactly
      let hexFilename = nativeToHex.get(grapheme);
      
      // 3. Fallback just in case an OS sends a weird variant
      if (!hexFilename) {
        hexFilename = Array.from(grapheme)
          .map(char => char.codePointAt(0)?.toString(16))
          .filter(hex => hex !== 'fe0f')
          .join('-');
      }
        
      result.push({ type: 'emoji', content: grapheme, hex: hexFilename });
    } else {
      currentText += grapheme;
    }
  }
  
  if (currentText) {
    result.push({ type: 'text', content: currentText });
  }

  return result;
}