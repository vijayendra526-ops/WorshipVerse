
import Sanscript from '@indic-transliteration/sanscript';

export function toTeluguSearchQuery(query: string): string {
  const input = query.trim();

  if (!input || /[\u0C00-\u0C7F]/.test(input)) {
    return input;
  }

  return Sanscript.t(input.toLowerCase(), 'itrans', 'telugu');
}

export function toRomanSearchQuery(title: string): string {
  if (!/[\u0C00-\u0C7F]/.test(title)) {
    return title;
  }

  return Sanscript.t(title, 'telugu', 'itrans')
    .replace(/N/g, 'n')
    .replace(/M/g, 'n')
    .replace(/D/g, 'd')
    .replace(/T/g, 't')
    .toLowerCase();
}
