
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  getAllOfflineSongs,
  removeAllOfflineSongs,
  type OfflineSong,
} from '@/lib/offline/song-storage';

type LanguageFilter = 'all' | 'te' | 'en';

const languageOptions: {
  value: LanguageFilter;
  label: string;
}[] = [
  { value: 'all', label: 'All Songs' },
  { value: 'te', label: 'à°¤à±†à°²à±à°—à±' },
  { value: 'en', label: 'English' },
];

export default function OfflinePage() {
  const [songs, setSongs] = useState<OfflineSong[]>([]);
  const [search, setSearch] = useState('');
  const [language, setLanguage] =
    useState<LanguageFilter>('all');

  const [online, setOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] =
    useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSongs() {
      try {
        const savedSongs = await getAllOfflineSongs();

        if (active) {
          setSongs(savedSongs);
          setError('');
        }
      } catch {
        if (active) {
          setError(
            'Unable to access offline songs on this device.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    setOnline(navigator.onLine);

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    void loadSongs();

    return () => {
      active = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const filteredSongs = useMemo(() => {
    const term = search.trim().toLowerCase();

    return songs.filter((song) => {
      const matchesLanguage =
        language === 'all' || song.language === language;

      const matchesSearch =
        !term ||
        song.title.toLowerCase().includes(term) ||
        (song.artist ?? '').toLowerCase().includes(term) ||
        song.lyrics.toLowerCase().includes(term);

      return matchesLanguage && matchesSearch;
    });
  }, [songs, search, language]);

  const teluguCount = songs.filter(
    (song) => song.language === 'te'
  ).length;

  const englishCount = songs.filter(
    (song) => song.language === 'en'
  ).length;

  async function handleRemoveAll() {
    if (removing) return;

    const confirmed = window.confirm(
      'Remove all downloaded songs from this device?'
    );

    if (!confirmed) return;

    setRemoving(true);
    setError('');

    try {
      await removeAllOfflineSongs();
      setSongs([]);
      setExpandedId(null);
    } catch {
      setError('Unable to remove offline songs.');
    } finally {
      setRemoving(false);
    }
  }

  return (
    <main
      className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat text-white"
      style={{
        backgroundImage:
          "linear-gradient(rgba(36, 16, 63, 0.78), rgba(36, 16, 63, 0.88)), url('/images/worship-background.jpg')",
      }}
    >
      <header className="border-b border-white/15 bg-[#24103F]/75 px-5 py-4 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="text-xl font-bold">
            <span className="text-[#D8B66C]">
              Worship
            </span>
            Verse
          </Link>

          <Link
            href="/songs"
            className="rounded-xl border border-[#D8B66C]/50 px-4 py-2 text-sm font-semibold text-[#F1D99D] transition hover:bg-white/10"
          >
            Song Library
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D8B66C]">
              Your Saved Worship Songs
            </p>

            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
              Offline Song Library
            </h1>

            <p className="mt-2 text-sm text-white/75">
              Read your downloaded lyrics anytime, even
              without an internet connection.
            </p>
          </div>

          <span
            role="status"
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${
              online
                ? 'border-green-300/40 bg-green-900/40 text-green-100'
                : 'border-[#D8B66C]/50 bg-[#D8B66C]/15 text-[#F1D99D]'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                online ? 'bg-green-300' : 'bg-[#D8B66C]'
              }`}
            />
            {online ? 'Online' : 'Offline Mode'}
          </span>
        </div>

        <div className="mt-7 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-[#E9E1D3]/80 bg-[#FAF8F4]/95 p-4 text-center text-[#24103F] shadow-lg">
            <p className="text-2xl font-bold text-[#32165C] sm:text-3xl">
              {songs.length}
            </p>
            <p className="mt-1 text-xs text-gray-600">
              Downloaded
            </p>
          </div>

          <div className="rounded-2xl border border-[#E9E1D3]/80 bg-[#FAF8F4]/95 p-4 text-center text-[#24103F] shadow-lg">
            <p className="text-2xl font-bold text-[#32165C] sm:text-3xl">
              {teluguCount}
            </p>
            <p className="mt-1 text-xs text-gray-600">
              à°¤à±†à°²à±à°—à±
            </p>
          </div>

          <div className="rounded-2xl border border-[#E9E1D3]/80 bg-[#FAF8F4]/95 p-4 text-center text-[#24103F] shadow-lg">
            <p className="text-2xl font-bold text-[#32165C] sm:text-3xl">
              {englishCount}
            </p>
            <p className="mt-1 text-xs text-gray-600">
              English
            </p>
          </div>
        </div>

        <div className="mt-7 rounded-2xl border border-white/15 bg-[#24103F]/65 p-4 backdrop-blur-md sm:p-5">
          <label
            htmlFor="offline-search"
            className="mb-2 block text-sm font-semibold text-white"
          >
            Search Downloaded Songs
          </label>

          <input
            id="offline-search"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search songs, artists or lyrics..."
            className="w-full rounded-xl border border-[#E9E1D3] bg-[#FAF8F4] px-4 py-3 text-sm text-[#24103F] outline-none focus:border-[#D8B66C]"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {languageOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setLanguage(option.value)}
                aria-pressed={language === option.value}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  language === option.value
                    ? 'bg-[#D8B66C] text-[#24103F]'
                    : 'border border-white/30 bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {loading ? (
          <div className="mt-8 rounded-2xl border border-white/15 bg-[#24103F]/60 p-8 text-center text-sm text-white/75">
            Loading downloaded songs...
          </div>
        ) : filteredSongs.length > 0 ? (
          <div className="mt-7 grid items-start gap-4 md:grid-cols-2">
            {filteredSongs.map((song) => (
              <article
                key={song.id}
                className="overflow-hidden rounded-2xl border border-[#E9E1D3]/80 bg-[#FAF8F4]/95 text-[#24103F] shadow-lg"
              >
                <div className="flex items-start gap-3 p-4 sm:p-5">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                    <Image
                      src="/images/worship-instruments.jpg"
                      alt="Worship song artwork"
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="break-words font-bold text-[#32165C]">
                      {song.title}
                    </h2>

                    {song.artist && (
                      <p className="mt-1 truncate text-xs text-gray-600">
                        {song.artist}
                      </p>
                    )}

                    <span className="mt-2 inline-block rounded-full bg-[#F1E6CC] px-3 py-1 text-[11px] font-semibold text-[#80601F]">
                      {song.language === 'te'
                        ? 'à°¤à±†à°²à±à°—à±'
                        : 'English'}
                    </span>
                  </div>
                </div>

                <div className="border-t border-[#E9E1D3] px-4 py-3 sm:px-5">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(
                        expandedId === song.id
                          ? null
                          : song.id
                      )
                    }
                    aria-expanded={expandedId === song.id}
                    className="w-full rounded-xl bg-[#32165C] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#48247C]"
                  >
                    {expandedId === song.id
                      ? 'Hide Lyrics'
                      : 'View Lyrics'}
                  </button>
                </div>

                {expandedId === song.id && (
                  <div className="border-t border-[#E9E1D3] bg-white px-4 py-5 sm:px-5">
                    <h3 className="mb-4 text-sm font-bold text-[#32165C]">
                      Song Lyrics
                    </h3>

                    <p className="whitespace-pre-wrap break-words text-sm leading-8 text-gray-700 sm:text-base">
                      {song.lyrics}
                    </p>

                    {song.youtube_url && (
                      <a
                        href={song.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 inline-block text-sm font-semibold text-[#80601F] underline"
                      >
                        Watch on YouTube (requires internet)
                      </a>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-7 rounded-2xl border border-[#D8B66C]/40 bg-[#FAF8F4]/95 p-8 text-center text-[#24103F] shadow-lg">
            <div className="text-4xl text-[#A17B38]">
              â™«
            </div>

            <h2 className="mt-3 text-xl font-bold text-[#32165C]">
              {songs.length === 0
                ? 'No downloaded songs yet'
                : 'No matching songs found'}
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              {songs.length === 0
                ? 'Connect to the internet and download songs to read them offline.'
                : 'Try another search or language filter.'}
            </p>

            {songs.length === 0 && online && (
              <Link
                href="/songs"
                className="mt-5 inline-flex rounded-xl bg-[#32165C] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#48247C]"
              >
                Browse Song Library
              </Link>
            )}
          </div>
        )}

        {!loading && songs.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/15 bg-[#24103F]/65 p-5">
            <div>
              <h3 className="text-sm font-bold">
                Manage Offline Storage
              </h3>

              <p className="mt-1 text-xs text-white/65">
                Remove downloaded song data from this device.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRemoveAll}
              disabled={removing}
              className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
            >
              {removing
                ? 'Removing...'
                : 'Remove All Offline Songs'}
            </button>
          </div>
        )}
      </section>

      <footer className="mt-10 border-t border-white/15 bg-[#24103F]/70 px-5 py-5 text-center text-xs text-white/65">
        Â© 2026 WorshipVerse
      </footer>
    </main>
  );
}

