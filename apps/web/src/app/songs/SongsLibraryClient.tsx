
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  getAllOfflineSongs,
  type OfflineSong,
} from '@/lib/offline/song-storage';
import VoiceSearchForm from './VoiceSearchForm';
import DownloadAllSongs from './DownloadAllSongs';
import FavouriteButton from './FavouriteButton';

type Props = {
  language: 'te' | 'en';
  search: string;
};

export default function SongsLibraryClient({
  language,
  search,
}: Props) {
  const router = useRouter();

  const [songs, setSongs] = useState<OfflineSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [online, setOnline] = useState(true);

  const isTelugu = language === 'te';

  useEffect(() => {
    let active = true;

    async function loadSongs() {
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

        const isOnline = navigator.onLine;
        if (active) setOnline(isOnline);

        if (!isOnline) {
          const savedSongs = await getAllOfflineSongs();

          if (active) {
            setSongs(
              savedSongs.filter(
                (song) =>
                  song.language === language &&
                  song.title.toLowerCase().includes(
                    search.toLowerCase()
                  )
              )
            );
          }

          return;
        }

        const { data, error: fetchError } = await supabase
          .from('songs')
          .select(
            'id, title, artist, language, lyrics, youtube_url, created_at'
          )
          .eq('language', language)
          .order('created_at', { ascending: false })
          .ilike('title', `%${search}%`);

        if (fetchError) throw fetchError;

        if (active) {
          setSongs((data ?? []) as OfflineSong[]);
        }
      } catch (err) {
        // If online loading fails, try the downloaded library.
        try {
          const savedSongs = await getAllOfflineSongs();

          if (active) {
            setSongs(
              savedSongs.filter(
                (song) =>
                  song.language === language &&
                  song.title.toLowerCase().includes(
                    search.toLowerCase()
                  )
              )
            );
            setOnline(false);
          }
        } catch {
          if (active) {
            setError(
              err instanceof Error
                ? err.message
                : 'Unable to load songs.'
            );
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    }

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
  }, [language, search, router]);

  return (
    <main className="min-h-screen bg-[#FAF8F4] text-[#24103F]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#24103F]/95 px-5 py-4 text-white shadow-lg backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-wide">
            <span className="text-2xl text-[#D8B66C]">✦</span>
            WorshipVerse
          </Link>

          <Link
            href="/"
            className="rounded-full border border-[#D8B66C]/50 px-5 py-2 text-sm font-medium text-[#E8D5A5]"
          >
            Home
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="relative mb-9 overflow-hidden rounded-3xl bg-gradient-to-br from-[#32165C] via-[#3B1B69] to-[#24103F] p-7 text-white shadow-xl sm:p-10">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-[#D8B66C]/20" />

          <div className="relative z-10">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-[#D8B66C]">
              WorshipVerse Library
            </p>

            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
              {isTelugu ? 'తెలుగు ఆరాధన పాటలు' : 'Songs of Worship'}
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-7 text-purple-100 sm:text-base">
              {isTelugu
                ? 'మీ హృదయాన్ని దేవుని ఆరాధనతో నింపే తెలుగు పాటలను అన్వేషించండి.'
                : 'Discover beautiful worship songs and let every lyric bring you closer to God.'}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#D8B66C]/40 bg-white/5 px-4 py-2 text-sm text-[#E8D5A5]">
                ✦ {songs.length} {isTelugu ? 'పాటలు' : 'Songs'}
              </span>

              <span className="rounded-full border border-white/20 px-4 py-2 text-xs text-white">
                {online ? 'Online' : 'Offline Mode'}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#32165C]">
              {isTelugu ? 'పాటల సేకరణ' : 'Explore Songs'}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {isTelugu
                ? 'మీకు ఇష్టమైన పాటలను ఎంచుకోండి'
                : 'Find your favourite worship songs'}
            </p>
          </div>

          <div className="flex rounded-full border border-[#E8E0D2] bg-white p-1 shadow-sm">
            <Link
              href="/songs?language=te"
              className={`rounded-full px-5 py-2 text-sm font-semibold ${
                isTelugu
                  ? 'bg-[#32165C] text-white'
                  : 'text-gray-600'
              }`}
            >
              తెలుగు
            </Link>

            <Link
              href="/songs?language=en"
              className={`rounded-full px-5 py-2 text-sm font-semibold ${
                !isTelugu
                  ? 'bg-[#32165C] text-white'
                  : 'text-gray-600'
              }`}
            >
              English
            </Link>
          </div>
        </div>

        <div className="mb-4">
          <VoiceSearchForm
            language={language}
            initialQuery={search}
          />
        </div>

        {online && (
          <div className="mb-9">
            <DownloadAllSongs />
          </div>
        )}

        {loading ? (
          <p className="py-10 text-center text-gray-500">
            Loading songs...
          </p>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            {error}
          </div>
        ) : songs.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {songs.map((song) => (
              <article
                key={song.id}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-[#E8E0D2] bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#D8B66C] hover:shadow-lg"
              >
                <Link
                  href={`/songs/${song.id}`}
                  className="flex min-w-0 flex-1 items-center gap-4"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#32165C] to-[#24103F] text-2xl text-[#D8B66C]">
                    ♫
                  </div>

                  <div className="min-w-0">
                    <h2 className="break-words text-base font-bold text-[#32165C] group-hover:text-[#9B7A3C] sm:text-lg">
                      {song.title}
                    </h2>

                    <p className="mt-1 truncate text-sm text-gray-500">
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
          <div className="rounded-2xl border border-dashed border-[#D8B66C] bg-white p-10 text-center">
            <div className="text-4xl text-[#9B7A3C]">♫</div>

            <h2 className="mt-4 text-xl font-bold text-[#32165C]">
              {isTelugu ? 'పాటలు కనుగొనబడలేదు' : 'No Songs Found'}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              {online
                ? 'No songs found. Try another search.'
                : 'No downloaded songs are available in this language.'}
            </p>

            {search && (
              <Link
                href={`/songs?language=${language}`}
                className="mt-5 inline-block rounded-full bg-[#32165C] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Clear Search
              </Link>
            )}
          </div>
        )}
      </section>

      <footer className="border-t border-[#E8E0D2] bg-white px-5 py-7 text-center">
        <p className="text-sm font-semibold text-[#32165C]">
          WorshipVerse <span className="text-[#D8B66C]">✦</span>
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Every song, a prayer. Every lyric, an offering.
        </p>
      </footer>
    </main>
  );
}
