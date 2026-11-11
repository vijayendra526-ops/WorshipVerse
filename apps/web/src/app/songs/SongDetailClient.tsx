
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  getAllOfflineSongs,
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

  useEffect(() => {
    let active = true;

    async function loadSong() {
      setLoading(true);
      setError('');

      const supabase = createClient();

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.replace('/login');
          return;
        }

        if (!navigator.onLine) {
          const savedSongs = await getAllOfflineSongs();
          const savedSong = savedSongs.find(
            (item) => item.id === id
          );

          if (!savedSong) {
            throw new Error(
              'This song has not been downloaded for offline use.'
            );
          }

          if (active) {
            setSong(savedSong);
            setOffline(true);
          }

          return;
        }

        const { data, error: fetchError } = await supabase
          .from('songs')
          .select(
            'id, title, artist, language, lyrics, youtube_url, created_at'
          )
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;

        if (active) {
          setSong(data as OfflineSong);
          setOffline(false);
        }
      } catch (err) {
        try {
          const savedSongs = await getAllOfflineSongs();
          const savedSong = savedSongs.find(
            (item) => item.id === id
          );

          if (savedSong && active) {
            setSong(savedSong);
            setOffline(true);
          } else if (active) {
            setError(
              err instanceof Error
                ? err.message
                : 'Unable to load this song.'
            );
          }
        } catch {
          if (active) {
            setError('Unable to load this song.');
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadSong();

    return () => {
      active = false;
    };
  }, [id, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-gray-500">Loading song...</p>
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

  return (
    <main className="min-h-screen bg-white text-[#333333]">
      <header className="sticky top-0 z-30 border-b border-[#EAE5DC] bg-white/95 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link
            href={`/songs?language=${song.language}`}
            className="flex items-center gap-2 text-sm font-medium text-[#32165C] transition hover:text-[#9B7A3C]"
          >
            <span className="text-xl">←</span>
            {isTelugu ? 'పాటలకు తిరిగి వెళ్ళండి' : 'Back to Songs'}
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

        <div className="flex-1 py-9 sm:py-12">
          <div className="mb-7 flex items-center gap-3">
            <span className="h-px w-8 bg-[#D8B66C]" />

            <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-[#9B7A3C]">
              {isTelugu ? 'పాట సాహిత్యం' : 'Song Lyrics'}
            </h2>
          </div>

          <p className="whitespace-pre-wrap break-words text-lg leading-9 text-[#333333] sm:text-xl sm:leading-[2.5rem]">
            {song.lyrics ||
              (isTelugu
                ? 'సాహిత్యం అందుబాటులో లేదు.'
                : 'Lyrics are not available yet.')}
          </p>
        </div>

        <div className="mt-auto border-t border-[#EAE5DC] pt-6">
          {song.youtube_url && (
            <a
              href={song.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#32165C] px-5 py-4 font-semibold text-white shadow-sm transition hover:bg-[#24103F] sm:mx-auto sm:max-w-sm"
            >
              <span className="text-lg text-[#D8B66C]">▶</span>

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
            WorshipVerse <span className="text-[#D8B66C]">✦</span> Every song, a prayer.
          </p>
        </div>
      </section>
    </main>
  );
}
