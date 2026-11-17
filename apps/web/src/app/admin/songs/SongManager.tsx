
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Search,
  X,
  Music2,
  Pencil,
  Trash2,
  ExternalLink,
  CirclePlus,
  CalendarDays,
  LoaderCircle,
  RotateCcw,
  Library,
} from 'lucide-react';

type Song = {
  id: string;
  title: string;
  language: 'te' | 'en';
  youtube_url: string | null;
  created_at: string;
};

type Props = {
  initialSongs: Song[];
};

type LanguageFilter = 'all' | 'te' | 'en';

// Telugu vowels written independently.
const VOWELS: Record<string, string> = {
  'అ': 'a',
  'ఆ': 'aa',
  'ఇ': 'i',
  'ఈ': 'ee',
  'ఉ': 'u',
  'ఊ': 'oo',
  'ఋ': 'ru',
  'ౠ': 'roo',
  'ఌ': 'lu',
  'ఎ': 'e',
  'ఏ': 'e',
  'ఐ': 'ai',
  'ఒ': 'o',
  'ఓ': 'o',
  'ఔ': 'au',
};

// Telugu vowel signs attached to consonants.
const VOWEL_SIGNS: Record<string, string> = {
  'ా': 'aa',
  'ి': 'i',
  'ీ': 'ee',
  'ు': 'u',
  'ూ': 'oo',
  'ృ': 'ru',
  'ౄ': 'roo',
  'ె': 'e',
  'ే': 'e',
  'ై': 'ai',
  'ొ': 'o',
  'ో': 'o',
  'ౌ': 'au',
};

// Telugu consonants.
const CONSONANTS: Record<string, string> = {
  'క': 'k',
  'ఖ': 'kh',
  'గ': 'g',
  'ఘ': 'gh',
  'ఙ': 'ng',

  'చ': 'ch',
  'ఛ': 'chh',
  'జ': 'j',
  'ఝ': 'jh',
  'ఞ': 'ny',

  'ట': 't',
  'ఠ': 'th',
  'డ': 'd',
  'ఢ': 'dh',
  'ణ': 'n',

  'త': 't',
  'థ': 'th',
  'ద': 'd',
  'ధ': 'dh',
  'న': 'n',

  'ప': 'p',
  'ఫ': 'ph',
  'బ': 'b',
  'భ': 'bh',
  'మ': 'm',

  'య': 'y',
  'ర': 'r',
  'ఱ': 'r',
  'ల': 'l',
  'ళ': 'l',
  'వ': 'v',

  'శ': 'sh',
  'ష': 'sh',
  'స': 's',
  'హ': 'h',
};

/**
 * Convert a Telugu title into an approximate
 * English-letter spelling.
 *
 * Example:
 * యేసయ్య -> yesayya
 * కృప    -> krupa
 * ప్రేమ  -> prema
 */
function teluguToEnglish(value: string): string {
  const characters = Array.from(value.normalize('NFKC'));
  let result = '';

  for (let i = 0; i < characters.length; i++) {
    const character = characters[i];
    const nextCharacter = characters[i + 1];

    const consonant = CONSONANTS[character];

    if (consonant !== undefined) {
      result += consonant;

      // Virama removes the inherent 'a'.
      // Example: ప్ = p, not pa.
      if (nextCharacter === '్') {
        i++;
        continue;
      }

      // Consonant with an attached vowel sign.
      if (
        nextCharacter !== undefined &&
        VOWEL_SIGNS[nextCharacter] !== undefined
      ) {
        result += VOWEL_SIGNS[nextCharacter];
        i++;
        continue;
      }

      // Telugu consonants have an inherent 'a'.
      result += 'a';
      continue;
    }

    if (VOWELS[character] !== undefined) {
      result += VOWELS[character];
      continue;
    }

    if (character === 'ం' || character === 'ఁ') {
      result += 'm';
      continue;
    }

    if (character === 'ః') {
      result += 'h';
      continue;
    }

    if (character === '్') {
      continue;
    }

    // Preserve English letters, spaces and punctuation.
    if (VOWEL_SIGNS[character] === undefined) {
      result += character;
    }
  }

  return result;
}

// Normalize Telugu text for direct Telugu searches.
function normalizeText(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Normalize common English spellings for flexible matching.
// For example, "thodu" and "todu" become comparable.
function normalizePhonetic(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/aa/g, 'a')
    .replace(/ee/g, 'e')
    .replace(/ii/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/uu/g, 'u')
    .replace(/sh/g, 's')
    .replace(/ch/g, 'c')
    .replace(/th/g, 't')
    .replace(/dh/g, 'd')
    .replace(/bh/g, 'b')
    .replace(/ph/g, 'p')
    .replace(/kh/g, 'k')
    .replace(/gh/g, 'g')
    .replace(/jh/g, 'j')
    .replace(/w/g, 'v')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const FILTER_OPTIONS: {
  value: LanguageFilter;
  label: string;
}[] = [
  { value: 'all', label: 'All Songs' },
  { value: 'te', label: 'Telugu' },
  { value: 'en', label: 'English' },
];

export default function SongManager({
  initialSongs,
}: Props) {
  const router = useRouter();

  const [songs, setSongs] = useState(initialSongs);
  const [search, setSearch] = useState('');
  const [filter, setFilter] =
    useState<LanguageFilter>('all');
  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    setSongs(initialSongs);
  }, [initialSongs]);

  /**
   * Build the searchable titles once whenever
   * the song list changes.
   *
   * We search:
   * 1. Original title
   * 2. English-letter version of Telugu title
   *
   * Lyrics are never searched.
   */
  const searchableSongs = useMemo(() => {
    return songs.map((song) => ({
      song,
      originalTitle: normalizeText(song.title),
      phoneticTitle: normalizePhonetic(
        teluguToEnglish(song.title)
      ),
    }));
  }, [songs]);

  const filteredSongs = useMemo(() => {
    const searchTerms = normalizeText(search)
      .split(' ')
      .filter(Boolean);

    return searchableSongs
      .filter(
        ({ song, originalTitle, phoneticTitle }) => {
          if (
            filter !== 'all' &&
            song.language !== filter
          ) {
            return false;
          }

          if (searchTerms.length === 0) {
            return true;
          }

          return searchTerms.every((term) => {
            // Direct Telugu or English title match.
            if (originalTitle.includes(term)) {
              return true;
            }

            // English-letter search against Telugu titles.
            const phoneticTerm = normalizePhonetic(term);

            return (
              phoneticTerm.length > 0 &&
              phoneticTitle.includes(phoneticTerm)
            );
          });
        }
      )
      .map(({ song }) => song);
  }, [searchableSongs, search, filter]);

  const hasFilters =
    search.trim().length > 0 || filter !== 'all';

  function clearFilters() {
    setSearch('');
    setFilter('all');
  }

  async function handleDelete(song: Song) {
    if (deletingId !== null) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${song.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(song.id);
    setMessage(null);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Please sign in again.');
      }

      const role = user.app_metadata?.role;

      if (
        role !== 'admin' &&
        role !== 'super_admin'
      ) {
        throw new Error(
          'You are not authorized to delete songs.'
        );
      }

      const { data, error } = await supabase
        .from('songs')
        .delete()
        .eq('id', song.id)
        .select('id');

      if (error) throw error;

      if (!data?.length) {
        throw new Error(
          'Song deletion was not permitted. Check your Supabase permissions.'
        );
      }

      setSongs((current) =>
        current.filter(
          (item) => item.id !== song.id
        )
      );

      setMessage({
        type: 'success',
        text: 'Song deleted successfully.',
      });

      router.refresh();
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Unable to delete song.',
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-w-0 space-y-6">
      {/* Search and language filters */}
      <section className="rounded-2xl border border-[#EAE2D7] bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-[#32165C]">
              <Search
                size={17}
                className="text-[#A17B39]"
              />
              Search Your Library
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              Search Telugu titles using English or Telugu letters.
            </p>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#88682D] hover:text-[#32165C]"
            >
              <RotateCcw size={14} />
              Reset Filters
            </button>
          )}
        </div>

        <div className="relative">
          <Search
            size={19}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A17B39]"
          />

          <input
            id="admin-song-search"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Try Yesayya, Krupa, యేసు..."
            aria-label="Search song titles"
            autoComplete="off"
            className="w-full rounded-xl border border-[#E4DACC] bg-[#FAF8F4] py-3.5 pl-12 pr-12 text-sm text-[#32165C] outline-none transition placeholder:text-gray-400 focus:border-[#D8B66C] focus:ring-2 focus:ring-[#D8B66C]/20"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 hover:bg-[#EEE6F4] hover:text-[#32165C]"
            >
              <X size={17} />
            </button>
          )}
        </div>

        <div
          className="mt-4 flex flex-wrap gap-2"
          role="group"
          aria-label="Song language filter"
        >
          {FILTER_OPTIONS.map((option) => {
            const selected =
              filter === option.value;

            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() =>
                  setFilter(option.value)
                }
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition sm:text-sm ${
                  selected
                    ? 'border-[#32165C] bg-[#32165C] text-white'
                    : 'border-[#E7DFD4] bg-[#FAF8F4] text-[#554463] hover:border-[#D8B66C]'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div
          className="mt-4 border-t border-[#F0E9E1] pt-4 text-xs text-gray-500"
          aria-live="polite"
        >
          Showing{' '}
          <span className="font-bold text-[#32165C]">
            {filteredSongs.length}
          </span>{' '}
          of{' '}
          <span className="font-bold text-[#32165C]">
            {songs.length}
          </span>{' '}
          songs
        </div>
      </section>

      {message && (
        <div
          role={
            message.type === 'error'
              ? 'alert'
              : 'status'
          }
          className={`flex items-center justify-between gap-3 rounded-xl border p-4 text-sm ${
            message.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-green-200 bg-green-50 text-green-800'
          }`}
        >
          {message.text}

          <button
            type="button"
            onClick={() => setMessage(null)}
            aria-label="Dismiss message"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* Results header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-[#32165C]">
            <Library
              size={19}
              className="text-[#A17B39]"
            />
            Your Song Library
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            Manage your published worship songs.
          </p>
        </div>

        <Link
          href="/admin/songs/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[#32165C] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#4B267C]"
        >
          <CirclePlus size={16} />
          Add Song
        </Link>
      </div>

      {/* Songs */}
      {filteredSongs.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-[#EAE2D7] bg-white shadow-sm">
          <div className="divide-y divide-[#EEE7DC]">
            {filteredSongs.map((song) => (
              <article
                key={song.id}
                className="p-4 transition hover:bg-[#FFFCF7] sm:px-5 sm:py-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F1E9F7] text-[#7043A1]">
                      <Music2 size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="break-words text-sm font-bold leading-6 text-[#32165C] sm:text-base">
                        {song.title}
                      </h4>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#F7ECD5] px-2.5 py-1 text-[11px] font-semibold text-[#906A26]">
                          {song.language === 'te'
                            ? 'తెలుగు · Telugu'
                            : 'English'}
                        </span>

                        {song.created_at && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-400">
                            <CalendarDays size={12} />

                            {new Date(
                              song.created_at
                            ).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              timeZone: 'UTC',
                            })}
                          </span>
                        )}
                      </div>

                      {song.youtube_url && (
                        <a
                          href={song.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#9A7434] hover:text-[#32165C]"
                        >
                          <ExternalLink size={16} />
                          Watch on YouTube
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
                    <Link
                      href={`/admin/songs/${song.id}/edit`}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#DCD0E6] bg-[#F8F4FB] px-3.5 py-2.5 text-xs font-semibold text-[#32165C] hover:bg-[#EFE5F6] sm:flex-none"
                    >
                      <Pencil size={14} />
                      Edit
                    </Link>

                    <button
                      type="button"
                      disabled={deletingId !== null}
                      onClick={() =>
                        handleDelete(song)
                      }
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 sm:flex-none"
                    >
                      {deletingId === song.id ? (
                        <>
                          <LoaderCircle
                            size={14}
                            className="animate-spin"
                          />
                          Deleting
                        </>
                      ) : (
                        <>
                          <Trash2 size={14} />
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#EAE2D7] bg-white px-5 py-12 text-center shadow-sm">
          <Search
            size={30}
            className="mx-auto text-[#A17B39]"
          />

          <h3 className="mt-5 text-lg font-bold text-[#32165C]">
            {songs.length === 0
              ? 'Your library is empty'
              : 'No matching songs found'}
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            {songs.length === 0
              ? 'Publish your first song to get started.'
              : 'Try a different spelling or language filter.'}
          </p>

          {songs.length === 0 ? (
            <Link
              href="/admin/songs/new"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#32165C] px-5 py-3 text-sm font-semibold text-white"
            >
              <CirclePlus size={16} />
              Publish First Song
            </Link>
          ) : (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#32165C] px-5 py-3 text-sm font-semibold text-white"
            >
              <RotateCcw size={16} />
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
