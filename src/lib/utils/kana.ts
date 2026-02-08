/**
 * Checks if a character is a hiragana or katakana character.
 */
export function isKana(char: string): boolean {
  if (char.length === 0) return false;
  const code = char.charCodeAt(0);
  // Hiragana: U+3040 - U+309F, Katakana: U+30A0 - U+30FF
  return (code >= 0x3040 && code <= 0x309f) || (code >= 0x30a0 && code <= 0x30ff);
}

/**
 * Checks if a character is a CJK kanji character.
 */
export function isKanji(char: string): boolean {
  if (char.length === 0) return false;
  const code = char.charCodeAt(0);
  // CJK Unified Ideographs: U+4E00 - U+9FFF
  // CJK Unified Ideographs Extension A: U+3400 - U+4DBF
  return (code >= 0x4e00 && code <= 0x9fff) || (code >= 0x3400 && code <= 0x4dbf);
}

/**
 * Checks if a string contains any Japanese characters (hiragana, katakana, or kanji).
 */
export function containsJapanese(text: string): boolean {
  for (const char of text) {
    if (isKana(char) || isKanji(char)) {
      return true;
    }
  }
  return false;
}

/**
 * Romaji-to-hiragana mapping for common syllables.
 * Longer sequences are checked first to handle digraphs (e.g., "sha" before "sh").
 */
const ROMAJI_TO_HIRAGANA: [string, string][] = [
  // Digraphs and special combinations (longer first)
  ['sha', '\u3057\u3083'],
  ['shi', '\u3057'],
  ['shu', '\u3057\u3085'],
  ['sho', '\u3057\u3087'],
  ['chi', '\u3061'],
  ['tsu', '\u3064'],
  ['cha', '\u3061\u3083'],
  ['chu', '\u3061\u3085'],
  ['cho', '\u3061\u3087'],
  ['kya', '\u304D\u3083'],
  ['kyu', '\u304D\u3085'],
  ['kyo', '\u304D\u3087'],
  ['nya', '\u306B\u3083'],
  ['nyu', '\u306B\u3085'],
  ['nyo', '\u306B\u3087'],
  ['hya', '\u3072\u3083'],
  ['hyu', '\u3072\u3085'],
  ['hyo', '\u3072\u3087'],
  ['mya', '\u307F\u3083'],
  ['myu', '\u307F\u3085'],
  ['myo', '\u307F\u3087'],
  ['rya', '\u308A\u3083'],
  ['ryu', '\u308A\u3085'],
  ['ryo', '\u308A\u3087'],
  ['gya', '\u304E\u3083'],
  ['gyu', '\u304E\u3085'],
  ['gyo', '\u304E\u3087'],
  ['bya', '\u3073\u3083'],
  ['byu', '\u3073\u3085'],
  ['byo', '\u3073\u3087'],
  ['pya', '\u3074\u3083'],
  ['pyu', '\u3074\u3085'],
  ['pyo', '\u3074\u3087'],
  ['jya', '\u3058\u3083'],
  ['jyu', '\u3058\u3085'],
  ['jyo', '\u3058\u3087'],
  // Two-character syllables
  ['ka', '\u304B'],
  ['ki', '\u304D'],
  ['ku', '\u304F'],
  ['ke', '\u3051'],
  ['ko', '\u3053'],
  ['sa', '\u3055'],
  ['si', '\u3057'],
  ['su', '\u3059'],
  ['se', '\u305B'],
  ['so', '\u305D'],
  ['ta', '\u305F'],
  ['ti', '\u3061'],
  ['tu', '\u3064'],
  ['te', '\u3066'],
  ['to', '\u3068'],
  ['na', '\u306A'],
  ['ni', '\u306B'],
  ['nu', '\u306C'],
  ['ne', '\u306D'],
  ['no', '\u306E'],
  ['ha', '\u306F'],
  ['hi', '\u3072'],
  ['hu', '\u3075'],
  ['fu', '\u3075'],
  ['he', '\u3078'],
  ['ho', '\u307B'],
  ['ma', '\u307E'],
  ['mi', '\u307F'],
  ['mu', '\u3080'],
  ['me', '\u3081'],
  ['mo', '\u3082'],
  ['ya', '\u3084'],
  ['yu', '\u3086'],
  ['yo', '\u3088'],
  ['ra', '\u3089'],
  ['ri', '\u308A'],
  ['ru', '\u308B'],
  ['re', '\u308C'],
  ['ro', '\u308D'],
  ['wa', '\u308F'],
  ['wi', '\u3090'],
  ['we', '\u3091'],
  ['wo', '\u3092'],
  ['ga', '\u304C'],
  ['gi', '\u304E'],
  ['gu', '\u3050'],
  ['ge', '\u3052'],
  ['go', '\u3054'],
  ['za', '\u3056'],
  ['ji', '\u3058'],
  ['zu', '\u305A'],
  ['ze', '\u305C'],
  ['zo', '\u305E'],
  ['da', '\u3060'],
  ['di', '\u3062'],
  ['du', '\u3065'],
  ['de', '\u3067'],
  ['do', '\u3069'],
  ['ba', '\u3070'],
  ['bi', '\u3073'],
  ['bu', '\u3076'],
  ['be', '\u3079'],
  ['bo', '\u307C'],
  ['pa', '\u3071'],
  ['pi', '\u3074'],
  ['pu', '\u3077'],
  ['pe', '\u307A'],
  ['po', '\u307D'],
  ['ja', '\u3058\u3083'],
  ['ju', '\u3058\u3085'],
  ['jo', '\u3058\u3087'],
  // Single vowels
  ['a', '\u3042'],
  ['i', '\u3044'],
  ['u', '\u3046'],
  ['e', '\u3048'],
  ['o', '\u304A'],
  // Special
  ['n', '\u3093'],
];

/**
 * Converts romaji text to hiragana.
 * Handles common syllable patterns including digraphs.
 * Double consonants (e.g., "kk") produce a small tsu.
 * Characters that cannot be converted are left as-is.
 */
export function toHiragana(romaji: string): string {
  let result = '';
  let i = 0;
  const input = romaji.toLowerCase();

  while (i < input.length) {
    // Handle double consonants (small tsu)
    if (
      i + 1 < input.length &&
      input[i] === input[i + 1] &&
      input[i] !== 'a' &&
      input[i] !== 'i' &&
      input[i] !== 'u' &&
      input[i] !== 'e' &&
      input[i] !== 'o' &&
      input[i] !== 'n'
    ) {
      result += '\u3063'; // small tsu
      i++;
      continue;
    }

    // Handle 'n' before consonants or end of string (but not before vowels/y)
    if (input[i] === 'n' && i + 1 < input.length) {
      const next = input[i + 1];
      if (
        next !== 'a' &&
        next !== 'i' &&
        next !== 'u' &&
        next !== 'e' &&
        next !== 'o' &&
        next !== 'y' &&
        next !== 'n'
      ) {
        // Check if 'n' + next forms a valid syllable
        let formsValid = false;
        for (const [rom] of ROMAJI_TO_HIRAGANA) {
          if (rom.length >= 2 && rom[0] === 'n' && rom !== 'n' && input.substring(i, i + rom.length) === rom) {
            formsValid = true;
            break;
          }
        }
        if (!formsValid) {
          result += '\u3093';
          i++;
          continue;
        }
      }
    }

    // Try matching longest romaji sequences first
    let matched = false;
    for (const [rom, hira] of ROMAJI_TO_HIRAGANA) {
      if (rom === 'n' && rom.length === 1) {
        // Special handling for standalone 'n' at end of string
        if (i === input.length - 1 && input[i] === 'n') {
          result += hira;
          i++;
          matched = true;
          break;
        }
        continue;
      }

      if (input.substring(i, i + rom.length) === rom) {
        result += hira;
        i += rom.length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Leave unrecognized characters as-is
      result += input[i];
      i++;
    }
  }

  return result;
}
