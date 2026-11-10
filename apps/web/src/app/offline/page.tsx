
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  getAllOfflineSongs,
  removeAllOfflineSongs,
  type OfflineSong,
} from '@/lib/offline/song-storage';

export default function OfflinePage() {
  const [songs, setSongs] = useState<OfflineSong[]>([]);
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState<'all' | 'te' | 'en'>('all');
  const [online, setOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function loadSongs() {
    try {
      setError('');
      const savedSongs = await getAllOfflineSongs();
      setSongs(savedSongs);
    } catch {
      setError('Unable to access offline songs on this device.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setOnline(navigator.onLine);

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    void loadSongs();

    return () => {
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

  async function handleRemoveAll() {
    const confirmed = window.confirm(
      'Remove all downloaded songs from this device?'
    );

    if (!confirmed) return;

    try {
      await removeAllOfflineSongs();
      setSongs([]);
      setExpandedId(null);
    } catch {
      setError('Unable to remove offline songs.');
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF8F4] text-[#24103F]">
      <header className="bg-[#24103F] px-5 py-5 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            WorshipVerse
          </Link>

          <Link href="/songs" className="text-sm text-[#D8B66C]">
            Song Library
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-[#9B7A3C]">
              WorshipVerse
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#32165C]">
              Offline Song Library
            </h1>
          </div>

          <span
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              online
                ? 'bg-green-100 text-green-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {online ? 'Online' : 'Offline Mode'}
          </span>
        </div>

        <div className="mt-6 rounded-2xl border border-[#E8E0D2] bg-white p-5">
          <p className="text-sm text-gray-600">
            Downloaded songs stored on this device
          </p>
          <p className="mt-1 text-3xl font-bold text-[#32165C]">
            {songs.length}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Telugu and English songs
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search downloaded songs or lyrics..."
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#32165C]"
          />

          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'All Songs' },
              { value: 'te', label: 'తెలుగు' },
              { value: 'en', label: 'English' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setLanguage(option.value as 'all' | 'te' | 'en')
                }
                className={`rounded-full px-5 py-2 text-sm font-semibold ${
                  language === option.value
                    ? 'bg-[#32165C] text-white'
                    : 'border border-[#32165C] bg-white text-[#32165C]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <p className="mt-8 text-center text-gray-500">
            Loading downloaded songs...
          </p>
        ) : filteredSongs.length > 0 ? (
          <div className="mt-8 space-y-4">
            {filteredSongs.map((song) => (
              <article
                key={song.id}
                className="rounded-2xl border border-[#E8E0D2] bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-[#32165C]">
                      {song.title}
                    </h2>

                    {song.artist && (
                      <p className="mt-1 text-sm text-gray-500">
                        {song.artist}
                      </p>
                    )}

                    <span className="mt-2 inline-block rounded-full bg-[#F4EFF9] px-3 py-1 text-xs font-semibold text-[#32165C]">
                      {song.language === 'te' ? 'తెలుగు' : 'English'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(
                        expandedId === song.id ? null : song.id
                      )
                    }
                    className="rounded-lg bg-[#32165C] px-4 py-2 text-sm font-semibold text-white"
                  >
                    {expandedId === song.id ? 'Hide Lyrics' : 'View Lyrics'}
                  </button>
                </div>

                {expandedId === song.id && (
                  <div className="mt-5 border-t border-[#E8E0D2] pt-5">
                    <p className="whitespace-pre-wrap leading-8 text-gray-700">
                      {song.lyrics}
                    </p>

                    {song.youtube_url && (
                      <a
                        href={song.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 inline-block text-sm font-semibold text-[#8B6B35] underline"
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
          <div className="mt-8 rounded-2xl border border-dashed border-[#D8B66C] bg-white p-10 text-center">
            <h2 className="text-xl font-bold text-[#32165C]">
              {songs.length === 0
                ? 'No downloaded songs yet'
                : 'No matching songs found'}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {songs.length === 0
                ? 'Connect to the internet and download your songs first.'
                : 'Try another search or language filter.'}
            </p>

            {songs.length === 0 && (
              <Link
                href="/songs"
                className="mt-5 inline-block rounded-xl bg-[#32165C] px-5 py-3 text-sm font-semibold text-white"
              >
                Go to Song Library
              </Link>
            )}
          </div>
        )}

        {songs.length > 0 && (
          <button
            type="button"
            onClick={handleRemoveAll}
            className="mt-8 rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            Remove All Offline Songs
          </button>
        )}
      </section>
    </main>
  );
}
