
import Sanscript from '@indic-transliteration/sanscript';

export function toTeluguSearchQuery(query: string): string {
  const input = query.trim();

  // Keep empty queries and Telugu-script queries unchanged.
  if (!input || /[\u0C00-\u0C7F]/.test(input)) {
    return input;
  }

  // Convert common English-letter vowel combinations.
  const normalized = input
    .toLowerCase()
    .replace(/\bye/g, 'yE')
    .replace(/aa/g, 'A')
    .replace(/ee/g, 'E')
    .replace(/ii/g, 'I')
    .replace(/oo/g, 'O')
    .replace(/uu/g, 'U');

  return Sanscript.t(normalized, 'itrans_dravidian', 'telugu');
}
