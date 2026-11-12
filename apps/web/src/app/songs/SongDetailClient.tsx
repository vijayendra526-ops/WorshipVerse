
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function SongDetailClient({ id }: Props) {
  const router = useRouter();

  const [song, setSong] = useState<OfflineSong | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState('');

  const [lyricsView, setLyricsView] = useState<'te' | 'en'>('te');

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

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session) {
          router.replace('/login');
          return;
        }

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
  }, [id, router]);

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
          <div className="mb-7 flex items-center gap-3">
            <span className="h-px w-8 bg-[#D8B66C]" />

            <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-[#9B7A3C]">
              {isTelugu ? 'పాట సాహిత్యం' : 'Song Lyrics'}
            </h2>
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
                  <p className="whitespace-pre-wrap break-words text-lg leading-9 text-[#333333] sm:text-xl sm:leading-[2.5rem]">
                    {song.lyrics ||
                      'సాహిత్యం అందుబాటులో లేదు.'}
                  </p>
                ) : (
                  <p className="whitespace-pre-wrap break-words text-lg leading-9 text-[#333333] sm:text-xl sm:leading-[2.5rem]">
                    {transliteration ||
                      'English lyrics are not available yet.'}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words text-lg leading-9 text-[#333333] sm:text-xl sm:leading-[2.5rem]">
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
