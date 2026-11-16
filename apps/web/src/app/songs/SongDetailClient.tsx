
'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import {
  getOfflineSong,
  saveSong,
  type OfflineSong,
} from '@/lib/offline/song-storage';
import FavouriteButton from './FavouriteButton';

type Props = {
  id: string;
};

const DEFAULT_FONT_SIZE = 20;
const MIN_FONT_SIZE = 14;
const MAX_FONT_SIZE = 34;
const FONT_SIZE_STEP = 2;
const FONT_STORAGE_KEY = 'worshipverse-lyrics-font-size';

export default function SongDetailClient({ id }: Props) {
  

  const [song, setSong] = useState<OfflineSong | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState('');

  const [lyricsView, setLyricsView] = useState<'te' | 'en'>('te');

  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [fontControlsOpen, setFontControlsOpen] = useState(false);
  const [fontPreferenceLoaded, setFontPreferenceLoaded] = useState(false);

  const fontControlsRef = useRef<HTMLDivElement>(null);

  // Load the saved lyrics font size.
  useEffect(() => {
    try {
      const savedSize = localStorage.getItem(FONT_STORAGE_KEY);

      if (savedSize) {
        const parsedSize = Number(savedSize);

        if (Number.isFinite(parsedSize)) {
          setFontSize(
            Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, parsedSize))
          );
        }
      }
    } catch (error) {
      console.warn('Unable to load lyrics font preference:', error);
    } finally {
      setFontPreferenceLoaded(true);
    }
  }, []);

  // Save the font size whenever the member changes it.
  useEffect(() => {
    if (!fontPreferenceLoaded) return;

    try {
      localStorage.setItem(FONT_STORAGE_KEY, String(fontSize));
    } catch (error) {
      console.warn('Unable to save lyrics font preference:', error);
    }
  }, [fontSize, fontPreferenceLoaded]);

  // Close font controls when clicking outside or pressing Escape.
  useEffect(() => {
    if (!fontControlsOpen) return;

    const handleOutsideClick = (event: PointerEvent) => {
      if (
        fontControlsRef.current &&
        !fontControlsRef.current.contains(event.target as Node)
      ) {
        setFontControlsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFontControlsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [fontControlsOpen]);

  const increaseFontSize = () => {
    setFontSize((current) =>
      Math.min(MAX_FONT_SIZE, current + FONT_SIZE_STEP)
    );
  };

  const decreaseFontSize = () => {
    setFontSize((current) =>
      Math.max(MIN_FONT_SIZE, current - FONT_SIZE_STEP)
    );
  };

  const resetFontSize = () => {
    setFontSize(DEFAULT_FONT_SIZE);
  };

  const lyricsStyle = {
    fontSize: `${fontSize}px`,
    lineHeight: `${Math.round(fontSize * 1.8)}px`,
  };

  useEffect(() => {
    let active = true;

    async function loadSong() {
      setLoading(true);
      setError('');

      let cachedSong: OfflineSong | null = null;

      // STEP 1: Check local storage first.
      try {
        cachedSong = await getOfflineSong(id);

        if (active && cachedSong) {
          setSong(cachedSong);
          setOffline(!navigator.onLine);
          setLoading(false);
        }
      } catch (storageError) {
        console.warn('Unable to read offline song:', storageError);
      }

      if (!active) return;

      // STEP 2: If offline, use the downloaded song.
      if (!navigator.onLine) {
        if (active) {
          setOffline(true);

          if (!cachedSong) {
            setError(
              'This song has not been downloaded for offline use.'
            );
          }

          setLoading(false);
        }

        return;
      }

      // STEP 3: Refresh from Supabase when online.
      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from('songs')
          .select(
            'id, title, artist, language, lyrics, lyrics_transliteration, youtube_url, created_at'
          )
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;

        if (!active) return;

        const latestSong = data as OfflineSong;

        // STEP 4: Save the latest song locally.
        try {
          await saveSong(latestSong);
        } catch (storageError) {
          console.warn(
            'Unable to save song for offline use:',
            storageError
          );
        }

        if (active) {
          setSong(latestSong);
          setOffline(false);
          setError('');
        }
      } catch (err) {
        if (!active) return;

        console.warn('Unable to refresh song:', err);

        // STEP 5: Fall back to the previously downloaded song.
        if (cachedSong) {
          setSong(cachedSong);
          setOffline(true);
          setError('');
        } else {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load this song.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSong();

    const handleOnline = () => {
      if (active) {
        void loadSong();
      }
    };

    const handleOffline = () => {
      if (active) {
        setOffline(true);
        void loadSong();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      active = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [id]); 

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-gray-500">
          Loading song...
        </p>
      </main>
    );
  }

  if (!song) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-white px-5 text-center">
        <h1 className="text-2xl font-bold text-[#32165C]">
          Song unavailable
        </h1>

        <p className="mt-3 text-sm text-gray-500">
          {error || 'This song could not be loaded.'}
        </p>

        <Link
          href="/offline"
          className="mt-6 rounded-xl bg-[#32165C] px-5 py-3 text-sm font-semibold text-white"
        >
          Open Offline Library
        </Link>

        <Link
          href="/songs"
          className="mt-4 text-sm font-medium text-[#32165C]"
        >
          Back to Songs
        </Link>
      </main>
    );
  }

  const isTelugu = song.language === 'te';
  const transliteration = song.lyrics_transliteration?.trim();

  return (
    <main className="min-h-screen bg-white text-[#333333]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#EAE5DC] bg-white/95 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link
            href={`/songs?language=${song.language}`}
            className="flex items-center gap-2 text-sm font-medium text-[#32165C] transition hover:text-[#9B7A3C]"
          >
            <span className="text-xl">←</span>
            {isTelugu ? 'తిరిగి వెళ్లండి' : 'Back to Songs'}
          </Link>

          <Link
            href="/"
            className="text-lg font-bold tracking-wide text-[#32165C]"
          >
            <span className="mr-1 text-[#D8B66C]">✦</span>
            WorshipVerse
          </Link>
        </div>
      </header>

      <section className="mx-auto flex min-h-[calc(100svh-65px)] max-w-5xl flex-col px-5 py-8 sm:px-10 sm:py-12">

        {/* Song Information */}
        <div className="border-b border-[#EAE5DC] pb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9B7A3C]">
            {isTelugu
              ? 'తెలుగు ఆరాధన పాట'
              : 'WorshipVerse • Worship Song'}
          </p>

          <div className="mt-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="break-words text-3xl font-bold leading-tight tracking-tight text-[#32165C] sm:text-5xl">
                {song.title}
              </h1>

              <p className="mt-3 text-base text-gray-500">
                {song.artist || 'WorshipVerse'}
              </p>
            </div>

            {!offline && (
              <div className="shrink-0 rounded-full border border-[#EAE5DC] bg-[#FAF8F4] p-2">
                <FavouriteButton songId={song.id} />
              </div>
            )}
          </div>

          {offline && (
            <p className="mt-4 inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
              Available offline
            </p>
          )}

          <div className="mt-6 h-[2px] w-16 rounded-full bg-[#D8B66C]" />
        </div>

        {/* Lyrics Section */}
        <div className="flex-1 py-9 sm:py-12">
          <div className="mb-7 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-[#D8B66C]" />

              <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-[#9B7A3C]">
                {isTelugu ? 'పాట సాహిత్యం' : 'Song Lyrics'}
              </h2>
            </div>

            {/* Hidden Font Size Controls */}
            <div ref={fontControlsRef} className="relative">
              <button
                type="button"
                onClick={() => setFontControlsOpen((open) => !open)}
                aria-label="Lyrics text settings"
                aria-expanded={fontControlsOpen}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E8E0D2] bg-[#FAF8F4] text-sm font-bold text-[#32165C] transition hover:border-[#D8B66C] hover:bg-[#F2EBDD]"
              >
                Aa
              </button>

              {fontControlsOpen && (
                <div className="absolute right-0 top-12 z-40 flex items-center gap-2 rounded-2xl border border-[#E8E0D2] bg-white p-3 shadow-xl">
                  <button
                    type="button"
                    onClick={decreaseFontSize}
                    disabled={fontSize <= MIN_FONT_SIZE}
                    aria-label="Decrease lyrics font size"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E8E0D2] text-lg font-bold text-[#32165C] transition hover:bg-[#FAF8F4] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    A−
                  </button>

                  <span className="min-w-10 text-center text-xs font-semibold text-gray-500">
                    {fontSize}px
                  </span>

                  <button
                    type="button"
                    onClick={increaseFontSize}
                    disabled={fontSize >= MAX_FONT_SIZE}
                    aria-label="Increase lyrics font size"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E8E0D2] text-lg font-bold text-[#32165C] transition hover:bg-[#FAF8F4] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    A+
                  </button>

                  <button
                    type="button"
                    onClick={resetFontSize}
                    aria-label="Reset lyrics font size"
                    title="Reset font size"
                    className="ml-1 rounded-lg px-2 py-2 text-xs font-semibold text-[#9B7A3C] transition hover:bg-[#FAF8F4]"
                  >
                    Reset
                  </button>

                  <button
                    type="button"
                    onClick={() => setFontControlsOpen(false)}
                    aria-label="Close font settings"
                    className="rounded-lg px-2 py-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          {isTelugu ? (
            <div>
              {/* Lyrics Language Switcher */}
              <div className="mb-7 flex justify-center">
                <div className="inline-flex rounded-full border border-[#E8E0D2] bg-[#FAF8F4] p-1">
                  <button
                    type="button"
                    onClick={() => setLyricsView('te')}
                    aria-pressed={lyricsView === 'te'}
                    className={`rounded-full px-7 py-3 text-sm font-bold transition ${
                      lyricsView === 'te'
                        ? 'bg-[#32165C] text-white shadow-sm'
                        : 'text-[#32165C] hover:bg-white'
                    }`}
                  >
                    తెలుగు
                  </button>

                  <button
                    type="button"
                    onClick={() => setLyricsView('en')}
                    aria-pressed={lyricsView === 'en'}
                    className={`rounded-full px-7 py-3 text-sm font-bold transition ${
                      lyricsView === 'en'
                        ? 'bg-[#32165C] text-white shadow-sm'
                        : 'text-[#32165C] hover:bg-white'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              {/* Selected Lyrics */}
              <div className="mx-auto max-w-3xl rounded-2xl border border-[#EAE5DC] bg-[#FAF8F4] p-6 sm:p-10">
                {lyricsView === 'te' ? (
                  <p
                    style={lyricsStyle}
                    className="whitespace-pre-wrap break-words text-[#333333]"
                  >
                    {song.lyrics || 'సాహిత్యం అందుబాటులో లేదు.'}
                  </p>
                ) : (
                  <p
                    style={lyricsStyle}
                    className="whitespace-pre-wrap break-words text-[#333333]"
                  >
                    {transliteration ||
                      'English lyrics are not available yet.'}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p
              style={lyricsStyle}
              className="whitespace-pre-wrap break-words text-[#333333]"
            >
              {song.lyrics || 'Lyrics are not available yet.'}
            </p>
          )}
        </div>

        {/* YouTube and Footer */}
        <div className="mt-auto border-t border-[#EAE5DC] pt-6">
          {song.youtube_url && (
            <a
              href={song.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#32165C] px-5 py-4 font-semibold text-white shadow-sm transition hover:bg-[#24103F] sm:mx-auto sm:max-w-sm"
            >
              <span className="text-lg text-[#D8B66C]">
                ▶
              </span>

              {isTelugu
                ? 'YouTube లో పాట వినండి'
                : 'Watch on YouTube'}
            </a>
          )}

          {offline && (
            <p className="mt-3 text-center text-xs text-gray-400">
              YouTube requires an internet connection.
            </p>
          )}

          <p className="mt-6 text-center text-xs tracking-wide text-gray-400">
            WorshipVerse{' '}
            <span className="text-[#D8B66C]">✦</span>{' '}
            Every song, a prayer.
          </p>
        </div>
      </section>
    </main>
  );
}
