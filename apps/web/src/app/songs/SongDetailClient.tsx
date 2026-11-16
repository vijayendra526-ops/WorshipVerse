
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

const YOUTUBE_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'www.youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
];

// Accept only recognised YouTube URLs and valid 11-character video IDs.
function getYouTubeVideoId(value?: string | null): string | null {
  if (!value?.trim()) return null;

  const trimmed = value.trim();

  // Also support a video ID entered on its own.
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(
      /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    );

    if (!YOUTUBE_HOSTS.includes(url.hostname.toLowerCase())) {
      return null;
    }

    let videoId: string | null = null;

    if (url.hostname.toLowerCase().includes('youtu.be')) {
      videoId = url.pathname.split('/').filter(Boolean)[0] || null;
    } else {
      videoId =
        url.searchParams.get('v') ||
        url.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/)?.[1] ||
        null;
    }

    return videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId)
      ? videoId
      : null;
  } catch {
    return null;
  }
}

// Return a safe YouTube URL for the fallback link.
function getSafeYouTubeUrl(value?: string | null): string | null {
  if (!value?.trim()) return null;

  const trimmed = value.trim();

  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) {
    return `https://www.youtube.com/watch?v=${trimmed}`;
  }

  try {
    const url = new URL(
      /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    );

    if (!YOUTUBE_HOSTS.includes(url.hostname.toLowerCase())) {
      return null;
    }

    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

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

  // Save the font size whenever it changes.
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

  // Load the song from offline storage first, then refresh from Supabase.
  useEffect(() => {
    let active = true;

    async function loadSong() {
      setLoading(true);
      setError('');

      let cachedSong: OfflineSong | null = null;

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

      if (!navigator.onLine) {
        setOffline(true);

        if (!cachedSong) {
          setError('This song has not been downloaded for offline use.');
        }

        setLoading(false);
        return;
      }

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

        if (cachedSong) {
          setSong(cachedSong);
          setOffline(true);
          setError('');
        } else {
          setError(
            err instanceof Error ? err.message : 'Unable to load this song.'
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
      if (active) void loadSong();
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

  const pageBackground = {
    backgroundImage:
      "linear-gradient(rgba(36, 16, 63, 0.78), rgba(36, 16, 63, 0.88)), url('/images/worship-background.jpg')",
  };

  if (loading) {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-[#24103F] bg-cover bg-center px-5"
        style={pageBackground}
      >
        <div className="rounded-2xl border border-white/15 bg-white/10 px-8 py-6 text-center text-white shadow-xl backdrop-blur-md">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-[#D8B66C]" />
          <p className="text-sm font-medium">Loading song...</p>
        </div>
      </main>
    );
  }

  if (!song) {
    return (
      <main
        className="flex min-h-screen flex-col items-center justify-center bg-[#24103F] bg-cover bg-center px-5 text-center"
        style={pageBackground}
      >
        <div className="w-full max-w-md rounded-3xl border border-white/15 bg-white/10 p-8 text-white shadow-xl backdrop-blur-md">
          <div className="mb-4 text-4xl text-[#D8B66C]">♪</div>

          <h1 className="text-2xl font-bold">Song unavailable</h1>

          <p className="mt-3 text-sm leading-6 text-white/75">
            {error || 'This song could not be loaded.'}
          </p>

          <Link
            href="/offline"
            className="mt-6 inline-flex rounded-xl bg-[#D8B66C] px-5 py-3 text-sm font-bold text-[#24103F] transition hover:bg-[#E8CD91]"
          >
            Open Offline Library
          </Link>

          <div>
            <Link
              href="/songs"
              className="mt-5 inline-block text-sm font-medium text-white/80 transition hover:text-[#D8B66C]"
            >
              ← Back to Songs
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isTelugu = song.language === 'te';
  const transliteration = song.lyrics_transliteration?.trim();

  const youtubeVideoId = getYouTubeVideoId(song.youtube_url);
  const safeYouTubeUrl = getSafeYouTubeUrl(song.youtube_url);

  return (
    <main
      className="min-h-screen bg-[#24103F] bg-fixed bg-cover bg-center bg-no-repeat text-[#24103F]"
      style={pageBackground}
    >
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#24103F]/85 px-4 py-3 text-white shadow-lg backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <Link
            href={`/songs?language=${song.language}`}
            className="flex items-center gap-2 text-sm font-medium text-white/85 transition hover:text-[#D8B66C]"
          >
            <span className="text-xl">←</span>
            <span>{isTelugu ? 'తిరిగి వెళ్లండి' : 'Back to Songs'}</span>
          </Link>

          <Link
            href="/"
            className="shrink-0 text-lg font-bold tracking-wide text-white"
          >
            <span className="mr-1 text-[#D8B66C]">✦</span>
            WorshipVerse
          </Link>
        </div>
      </header>

      <section className="mx-auto flex min-h-[calc(100svh-60px)] max-w-5xl flex-col px-4 py-6 sm:px-8 sm:py-9">
        {/* Song Information Card */}
        <div className="rounded-3xl border border-white/50 bg-[#FAF8F4]/95 p-4 shadow-2xl backdrop-blur-md sm:p-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-[#D8B66C]/50 shadow-md sm:h-24 sm:w-24">
              <img
                src="/images/worship-instruments.jpg"
                alt="Worship instruments"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9B7A3C] sm:text-xs">
                {isTelugu ? 'తెలుగు ఆరాధన పాట' : 'WorshipVerse • Worship Song'}
              </p>

              <h1 className="mt-2 break-words text-xl font-bold leading-tight text-[#32165C] sm:text-3xl">
                {song.title}
              </h1>

              <p className="mt-2 truncate text-sm text-gray-500">
                {song.artist || 'WorshipVerse'}
              </p>
            </div>

            {!offline && (
              <div className="shrink-0 rounded-full border border-[#EAE5DC] bg-white p-2 shadow-sm">
                <FavouriteButton songId={song.id} />
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#32165C]/10 px-3 py-1 text-xs font-semibold text-[#32165C]">
              {isTelugu ? 'తెలుగు' : 'English'}
            </span>

            {offline && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                <span className="mr-1">✓</span>
                Available offline
              </span>
            )}
          </div>
        </div>

        {/* Lyrics Card */}
        <div className="mt-5 rounded-3xl border border-white/40 bg-[#FAF8F4]/95 p-4 shadow-2xl backdrop-blur-md sm:mt-6 sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="h-px w-7 bg-[#D8B66C]" />
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#9B7A3C]">
                {isTelugu ? 'పాట సాహిత్యం' : 'Song Lyrics'}
              </h2>
            </div>

            {/* Lyrics Font Controls */}
            <div ref={fontControlsRef} className="relative">
              <button
                type="button"
                onClick={() => setFontControlsOpen((open) => !open)}
                aria-label="Lyrics text settings"
                aria-expanded={fontControlsOpen}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E8E0D2] bg-white text-sm font-bold text-[#32165C] shadow-sm transition hover:border-[#D8B66C] hover:bg-[#F2EBDD]"
              >
                Aa
              </button>

              {fontControlsOpen && (
                <div className="absolute right-0 top-12 z-40 flex items-center gap-1 rounded-2xl border border-[#E8E0D2] bg-white p-2 shadow-xl sm:gap-2 sm:p-3">
                  <button
                    type="button"
                    onClick={decreaseFontSize}
                    disabled={fontSize <= MIN_FONT_SIZE}
                    aria-label="Decrease lyrics font size"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E8E0D2] text-lg font-bold text-[#32165C] transition hover:bg-[#FAF8F4] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    A−
                  </button>

                  <span className="min-w-9 text-center text-xs font-semibold text-gray-500">
                    {fontSize}px
                  </span>

                  <button
                    type="button"
                    onClick={increaseFontSize}
                    disabled={fontSize >= MAX_FONT_SIZE}
                    aria-label="Increase lyrics font size"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E8E0D2] text-lg font-bold text-[#32165C] transition hover:bg-[#FAF8F4] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    A+
                  </button>

                  <button
                    type="button"
                    onClick={resetFontSize}
                    aria-label="Reset lyrics font size"
                    title="Reset font size"
                    className="rounded-lg px-2 py-2 text-xs font-semibold text-[#9B7A3C] transition hover:bg-[#FAF8F4]"
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
              <div className="mb-6 flex justify-center">
                <div className="inline-flex rounded-full border border-[#E8E0D2] bg-white p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setLyricsView('te')}
                    aria-pressed={lyricsView === 'te'}
                    className={`rounded-full px-6 py-2.5 text-sm font-bold transition sm:px-8 ${
                      lyricsView === 'te'
                        ? 'bg-[#32165C] text-white shadow-sm'
                        : 'text-[#32165C] hover:bg-[#FAF8F4]'
                    }`}
                  >
                    తెలుగు
                  </button>

                  <button
                    type="button"
                    onClick={() => setLyricsView('en')}
                    aria-pressed={lyricsView === 'en'}
                    className={`rounded-full px-6 py-2.5 text-sm font-bold transition sm:px-8 ${
                      lyricsView === 'en'
                        ? 'bg-[#32165C] text-white shadow-sm'
                        : 'text-[#32165C] hover:bg-[#FAF8F4]'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              {/* Selected Lyrics */}
              <div className="mx-auto max-w-3xl rounded-2xl border border-[#EAE5DC] bg-white/80 p-5 shadow-sm sm:p-9">
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
            <div className="mx-auto max-w-3xl rounded-2xl border border-[#EAE5DC] bg-white/80 p-5 shadow-sm sm:p-9">
              <p
                style={lyricsStyle}
                className="whitespace-pre-wrap break-words text-[#333333]"
              >
                {song.lyrics || 'Lyrics are not available yet.'}
              </p>
            </div>
          )}
        </div>

        {/* YouTube Player */}
        {youtubeVideoId && !offline && (
          <section className="mt-5 rounded-3xl border border-white/20 bg-[#160B25]/90 p-4 text-white shadow-2xl backdrop-blur-md sm:mt-6 sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D8B66C]/15 text-lg text-[#D8B66C]">
                ▶
              </span>

              <div>
                <h2 className="text-sm font-bold">
                  {isTelugu ? 'పాట వినండి' : 'Watch & Listen'}
                </h2>
                <p className="mt-0.5 text-xs text-white/55">
                  WorshipVerse
                </p>
              </div>
            </div>

            <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-lg">
              <iframe
                key={youtubeVideoId}
                src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?rel=0`}
                title={`YouTube video for ${song.title}`}
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>

            {safeYouTubeUrl && (
              <p className="mt-3 text-center text-xs text-white/60">
                If the video cannot play here,{' '}
                <a
                  href={safeYouTubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#D8B66C] underline underline-offset-2 hover:text-white"
                >
                  watch it on YouTube
                </a>
                .
              </p>
            )}
          </section>
        )}

        {/* Fallback when the URL is a YouTube link but no valid video ID was found */}
        {!youtubeVideoId && safeYouTubeUrl && !offline && (
          <div className="mt-5 rounded-2xl border border-white/20 bg-[#160B25]/90 p-5 text-center text-white shadow-xl">
            <p className="text-sm text-white/75">
              {isTelugu
                ? 'ఈ పాటను YouTube లో వినండి'
                : 'Listen to this song on YouTube'}
            </p>

            <a
              href={safeYouTubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-[#D8B66C] px-5 py-3 text-sm font-bold text-[#24103F] transition hover:bg-[#E8CD91]"
            >
              <span>▶</span>
              Watch on YouTube
            </a>
          </div>
        )}

        {/* Offline YouTube Notice */}
        {offline && song.youtube_url && (
          <p className="mt-5 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-center text-xs text-white/75">
            YouTube requires an internet connection. Your downloaded lyrics
            are still available offline.
          </p>
        )}

        {/* Footer */}
        <footer className="mt-auto pb-2 pt-8 text-center">
          <p className="text-xs tracking-wide text-white/65">
            WorshipVerse <span className="text-[#D8B66C]">✦</span> Every song,
            a prayer.
          </p>
        </footer>
      </section>
    </main>
  );
}
