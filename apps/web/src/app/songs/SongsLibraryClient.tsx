
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import {
  getAllOfflineSongs,
  saveSongs,
  type OfflineSong,
} from '@/lib/offline/song-storage';
import {
  toTeluguSearchQuery,
  toRomanSearchQuery,
} from '@/lib/indic-transliteration';

import VoiceSearchForm from './VoiceSearchForm';
import DownloadAllSongs from './DownloadAllSongs';
import FavouriteButton from './FavouriteButton';

type Props = {
  language: 'te' | 'en';
  search: string;
};

function normalizeSearchText(value: string) {
  return value
    .normalize('NFC')
    .toLowerCase()
    .replace(
      /\b(christmas|kristmas|krismas|krisamas|khrismas|khristmas)\b/g,
      'christmas'
    )
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeRomanText(value: string) {
  return normalizeSearchText(value);
}

export default function SongsLibraryClient({
  language,
  search,
}: Props) {
  const [songs, setSongs] = useState<OfflineSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [online, setOnline] = useState(true);
  const [manualSearch, setManualSearch] = useState(search);

  const isTelugu = language === 'te';

  // Keep search synchronized with URL updates.
  useEffect(() => {
    setManualSearch(search);
  }, [search]);

  // Prepare original and Telugu-converted search terms.
  const searchCandidates = useMemo(() => {
    const original = manualSearch.trim();

    if (!original) return [];

    const converted =
      language === 'te'
        ? toTeluguSearchQuery(original)
        : original;

    return [...new Set([original, converted])]
      .map(normalizeSearchText)
      .filter(Boolean);
  }, [manualSearch, language]);

  // Search Telugu song titles and Roman-English versions.
  const filteredSongs = useMemo(() => {
    if (searchCandidates.length === 0) {
      return songs;
    }

    const normalizedCandidates = searchCandidates.map(
      normalizeRomanText
    );

    return songs
      .map((song) => {
        const title = normalizeSearchText(song.title);

        const romanTitle = normalizeRomanText(
          toRomanSearchQuery(song.title)
        );

        const exactMatch = normalizedCandidates.some(
          (candidate) =>
            title === candidate || romanTitle === candidate
        );

        const partialMatch = normalizedCandidates.some(
          (candidate) =>
            title.includes(candidate) ||
            romanTitle.includes(candidate)
        );

        return {
          song,
          score: exactMatch ? 2 : partialMatch ? 1 : 0,
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.song);
  }, [songs, searchCandidates]);

  // Load cached songs first, then refresh from Supabase.
  useEffect(() => {
    let active = true;

    async function loadSongs() {
      if (active) {
        setError('');
        setOnline(navigator.onLine);
      }

      let cachedSongs: OfflineSong[] = [];

      // STEP 1: Load offline songs first.
      try {
        cachedSongs = await getAllOfflineSongs();

        if (active) {
          setSongs(
            cachedSongs.filter(
              (song) => song.language === language
            )
          );

          if (cachedSongs.length > 0) {
            setLoading(false);
          }
        }
      } catch {
        if (active && !navigator.onLine) {
          setError(
            'Unable to access offline songs on this device.'
          );
        }
      }

      if (!active) return;

      // STEP 2: Use cached songs when offline.
      if (!navigator.onLine) {
        setOnline(false);
        setLoading(false);

        if (
          !cachedSongs.some(
            (song) => song.language === language
          )
        ) {
          setError(
            'No downloaded songs are available. Connect to the internet and download songs first.'
          );
        }

        return;
      }

      // STEP 3: Fetch songs from Supabase.
      try {
        const supabase = createClient();

        const { data, error: fetchError } = await supabase
          .from('songs')
          .select(
            'id, title, artist, language, lyrics, lyrics_transliteration, youtube_url'
          )
          .eq('language', language)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        if (!active) return;

        const latestSongs = (data ?? []) as OfflineSong[];

        // STEP 4: Cache songs without deleting other downloads.
        try {
          await saveSongs(latestSongs);
        } catch (storageError) {
          console.warn(
            'Unable to update offline song storage:',
            storageError
          );
        }

        if (active) {
          setSongs(latestSongs);
          setOnline(true);
          setError('');
        }
      } catch (err) {
        if (!active) return;

        console.warn('Unable to refresh songs:', err);

        setOnline(false);

        if (
          !cachedSongs.some(
            (song) => song.language === language
          )
        ) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load songs. Please try again.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    setLoading(true);
    void loadSongs();

    const handleOnline = () => {
      if (active) {
        setOnline(true);
        void loadSongs();
      }
    };

    const handleOffline = () => {
      if (active) {
        setOnline(false);
        void loadSongs();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      active = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [language]);

  return (
    <main
      className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat text-[#24103F]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(36, 16, 63, 0.78), rgba(36, 16, 63, 0.88)), url('/images/worship-background.jpg')",
      }}
    >
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#24103F]/95 px-4 py-4 text-white shadow-lg backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold tracking-wide"
          >
            <span className="text-2xl text-[#D8B66C]">✦</span>
            WorshipVerse
          </Link>

          <Link
            href="/"
            className="rounded-full border border-[#D8B66C]/50 px-5 py-2 text-sm font-medium text-[#E8D5A5] transition hover:bg-white/10"
          >
            Home
          </Link>
        </div>
      </header>

      {/* Main content */}
      <section className="mx-auto min-h-[75vh] max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">

        {/* Language selector and heading */}
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white drop-shadow-md sm:text-2xl">
              {isTelugu ? 'పాటల సేకరణ' : 'Explore Songs'}
            </h1>

            <p className="mt-1 text-sm text-purple-100">
              {isTelugu
                ? 'మీకు ఇష్టమైన పాటలను ఎంచుకోండి'
                : 'Find your favourite worship songs'}
            </p>
          </div>

          <div className="flex rounded-full border border-white/20 bg-white p-1 shadow-md">
            <Link
              href="/songs?language=te"
              className={`rounded-full px-4 py-2 text-sm font-semibold transition sm:px-5 ${
                isTelugu
                  ? 'bg-[#32165C] text-white shadow'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              తెలుగు
            </Link>

            <Link
              href="/songs?language=en"
              className={`rounded-full px-4 py-2 text-sm font-semibold transition sm:px-5 ${
                !isTelugu
                  ? 'bg-[#32165C] text-white shadow'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              English
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="mb-7">
          <label
            htmlFor="manual-song-search"
            className="mb-2 block text-sm font-semibold text-white"
          >
            {isTelugu
              ? 'పాట పేరు టైప్ చేయండి'
              : 'Search songs by title'}
          </label>

          <div className="flex items-center gap-3 rounded-2xl border border-white/30 bg-white px-4 py-3 shadow-lg transition focus-within:border-[#D8B66C] focus-within:ring-2 focus-within:ring-[#D8B66C]/30">
            <span
              className="text-xl text-[#9B7A3C]"
              aria-hidden="true"
            >
              🔍
            </span>

            <input
              id="manual-song-search"
              type="search"
              value={manualSearch}
              onChange={(event) =>
                setManualSearch(event.target.value)
              }
              placeholder={
                isTelugu
                  ? 'పాట పేరు టైప్ చేయండి...'
                  : 'Type a song title...'
              }
              className="min-w-0 flex-1 bg-transparent text-sm text-[#24103F] outline-none placeholder:text-gray-400"
              autoComplete="off"
            />

            {manualSearch && (
              <button
                type="button"
                onClick={() => setManualSearch('')}
                aria-label="Clear search"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F3EFE7] text-lg text-[#32165C] transition hover:bg-[#E8E0D2]"
              >
                ×
              </button>
            )}

            <VoiceSearchForm
              language={language}
              onTranscript={(transcript) =>
                setManualSearch(transcript)
              }
            />
          </div>

          <p className="mt-2 text-xs leading-5 text-purple-100">
            {isTelugu
              ? 'తెలుగు లేదా English అక్షరాలతో పాట పేరు వెతకండి. మైక్రోఫోన్ ద్వారా కూడా వెతకవచ్చు.'
              : 'Search using song titles or the microphone.'}
          </p>
        </div>

        {/* Download all songs */}
        {online && (
          <div className="mb-7">
            <DownloadAllSongs />
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <p className="py-10 text-center text-white">
            Loading songs...
          </p>
        ) : error && songs.length === 0 ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 shadow-lg">
            {error}
          </div>
        ) : filteredSongs.length > 0 ? (
          /* Song cards */
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {filteredSongs.map((song) => (
              <article
                key={song.id}
                className="group flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-white/20 bg-white/95 p-3 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#D8B66C] hover:shadow-xl sm:gap-4 sm:p-4"
              >
                <Link
                  href={`/songs/${song.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#24103F] sm:h-16 sm:w-16">
                    <img
                      src="/images/worship-instruments.jpg"
                      alt="Trumpet, piano and guitar"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                    />
                  </div>

                  <div className="min-w-0">
                    <h2 className="break-words text-sm font-bold text-[#32165C] group-hover:text-[#9B7A3C] sm:text-base">
                      {song.title}
                    </h2>

                    <p className="mt-1 truncate text-xs text-gray-500 sm:text-sm">
                      {song.artist || 'WorshipVerse'}
                    </p>
                  </div>
                </Link>

                <div className="shrink-0">
                  <FavouriteButton songId={song.id} />
                </div>
              </article>
            ))}
          </div>
        ) : (
          /* No songs found */
          <div className="rounded-2xl border border-dashed border-[#D8B66C] bg-white/95 p-8 text-center shadow-lg sm:p-10">
            <div className="text-4xl text-[#9B7A3C]">♫</div>

            <h2 className="mt-4 text-xl font-bold text-[#32165C]">
              {isTelugu
                ? 'పాటలు కనుగొనబడలేదు'
                : 'No Songs Found'}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              {online
                ? 'No songs found. Try another search.'
                : 'No downloaded songs are available in this language.'}
            </p>

            {manualSearch && (
              <button
                type="button"
                onClick={() => setManualSearch('')}
                className="mt-5 rounded-full bg-[#32165C] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#432276]"
              >
                {isTelugu
                  ? 'వెతుకులాట తొలగించండి'
                  : 'Clear Search'}
              </button>
            )}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-white/15 bg-[#24103F]/95 px-5 py-7 text-center text-white backdrop-blur-md">
        <p className="text-sm font-semibold">
          WorshipVerse{' '}
          <span className="text-[#D8B66C]">✦</span>
        </p>

        <p className="mt-1 text-xs text-purple-200">
          Every song, a prayer. Every lyric, an offering.
        </p>
      </footer>
    </main>
  );
}
