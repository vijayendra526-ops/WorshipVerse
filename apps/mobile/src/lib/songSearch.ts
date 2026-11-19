import Sanscript from '@indic-transliteration/sanscript';

/** Shared song title matching for Songs, Favourites and future playlist search. */
export type SearchableSong = {
  title: string;
  artist?: string | null;
  language?: string;
};

export function normalizeSongSearch(value: string): string {
  return (value || '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^a-z0-9\u0C00-\u0C7F\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getSearchCandidates(query: string): string[] {
  const trimmed = query.trim();
  const variants = [normalizeSongSearch(trimmed)];
  // Telugu written with English letters is approximate, and ITRANS spellings vary.
  if (/^[a-z\s]+$/i.test(trimmed) && trimmed.length > 0) {
    try {
      variants.push(normalizeSongSearch(
        Sanscript.t(trimmed, 'itrans_dravidian', 'telugu')
      ));
    } catch {
      // Plain text matching still works.
    }
  }
  return [...new Set(variants.filter(Boolean))];
}

export function scoreSearchSong(song: SearchableSong, candidates: string[]): number {
  const title = normalizeSongSearch(song.title);
  const artist = normalizeSongSearch(song.artist ?? '');
  let romanTitle = '';
  if (/[\u0C00-\u0C7F]/.test(song.title)) {
    try {
      romanTitle = normalizeSongSearch(
        Sanscript.t(song.title, 'telugu', 'itrans_dravidian')
      );
    } catch { /* Original title remains searchable. */ }
  }
  let best = 0;
  for (const term of candidates) {
    if (title === term) best = Math.max(best, 5);
    else if (title.startsWith(term)) best = Math.max(best, 4);
    else if (title.includes(term)) best = Math.max(best, 3);
    if (romanTitle === term) best = Math.max(best, 4);
    else if (romanTitle.includes(term)) best = Math.max(best, 2);
    if (artist.includes(term)) best = Math.max(best, 1);
  }
  return best;
}
