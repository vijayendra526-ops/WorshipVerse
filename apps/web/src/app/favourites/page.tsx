
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Song = {
  id: string;
  title: string;
  artist: string | null;
  language: string;
  lyrics: string;
  youtube_url: string | null;
};

export default function FavouritesPage() {
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadFavourites() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (authError || !user) {
        router.replace('/login');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('favourites')
        .select(`
          song_id,
          songs (
            id,
            title,
            artist,
            language,
            lyrics,
            youtube_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!active) return;

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      const favouriteSongs = (data ?? []).flatMap(
        (item) => item.songs ?? []
      ) as Song[];

      setSongs(favouriteSongs);
      setLoading(false);
    }

    loadFavourites();

    return () => {
      active = false;
    };
  }, [router, supabase]);

  async function removeFavourite(songId: string) {
    if (removingId) return;

    setError('');
    setRemovingId(songId);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      const { error: removeError } = await supabase
        .from('favourites')
        .delete()
        .eq('user_id', user.id)
        .eq('song_id', songId);

      if (removeError) {
        setError(removeError.message);
        return;
      }

      setSongs((current) =>
        current.filter((song) => song.id !== songId)
      );
    } catch {
      setError('Unable to remove favourite. Please try again.');
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-fixed text-white"
      style={{
        backgroundImage:
          "linear-gradient(rgba(36, 16, 63, 0.78), rgba(36, 16, 63, 0.88)), url('/images/worship-background.jpg')",
      }}
    >
      <header className="border-b border-white/15 bg-[#24103F]/75 px-5 py-4 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="text-[#D8B66C]">Worship</span>Verse
          </Link>

          <Link
            href="/songs"
            className="rounded-xl border border-[#D8B66C]/50 px-4 py-2 text-sm font-semibold text-[#F1D99D] transition hover:bg-white/10"
          >
            Browse Songs
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D8B66C]">
              Your Personal Library
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
              <span className="text-[#D8B66C]">â™¥</span> My Favourites
            </h1>
            <p className="mt-2 text-sm text-white/75">
              Your saved worship songs, all in one place.
            </p>
          </div>

          {!loading && !error && (
            <span className="rounded-full border border-[#D8B66C]/40 bg-white/10 px-4 py-2 text-sm text-[#F1D99D]">
              {songs.length} {songs.length === 1 ? 'Song' : 'Songs'}
            </span>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-white/15 bg-white/10 p-8 text-center text-white/80">
            Loading your favourites...
          </div>
        ) : songs.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {songs.map((song) => (
              <article
                key={song.id}
                className="min-w-0 overflow-hidden rounded-2xl border border-[#E8E0D2]/60 bg-[#FAF8F4]/95 p-3 text-[#24103F] shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div className="flex items-start gap-3">
                  <Link
                    href={`/songs/${song.id}`}
                    aria-label={`Open ${song.title}`}
                    className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#EDE3D2]"
                  >
                    <Image
                      src="/images/worship-instruments.jpg"
                      alt="Worship instruments"
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link href={`/songs/${song.id}`}>
                      <h2 className="line-clamp-2 text-sm font-bold leading-5 hover:text-[#7B4BA0] sm:text-base">
                        {song.title}
                      </h2>
                    </Link>

                    {song.artist && (
                      <p className="mt-1 truncate text-xs text-gray-600">
                        {song.artist}
                      </p>
                    )}

                    <span className="mt-2 inline-block rounded-full bg-[#F1E6CC] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#80601F]">
                      {song.language === 'te'
                        ? 'Telugu'
                        : song.language === 'en'
                          ? 'English'
                          : song.language}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFavourite(song.id)}
                    disabled={removingId !== null}
                    title="Remove from favourites"
                    aria-label={`Remove ${song.title} from favourites`}
                    className="shrink-0 rounded-full border border-red-200 bg-red-50 px-2.5 py-1.5 text-lg text-red-600 transition hover:bg-red-100 disabled:cursor-wait disabled:opacity-50"
                  >
                    {removingId === song.id ? 'â€¦' : 'â™¥'}
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#E8E0D2] pt-3">
                  <Link
                    href={`/songs/${song.id}`}
                    className="rounded-lg bg-[#32165C] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#4C2778]"
                  >
                    View Lyrics
                  </Link>

                  {song.youtube_url && (
                    <Link
                      href={`/songs/${song.id}`}
                      className="rounded-lg border border-[#D8B66C] px-3 py-2 text-xs font-semibold text-[#73551C] transition hover:bg-[#F1E6CC]"
                    >
                      Watch Video
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : !error ? (
          <div className="mx-auto max-w-xl rounded-2xl border border-[#D8B66C]/40 bg-[#FAF8F4]/95 px-6 py-12 text-center text-[#24103F] shadow-xl">
            <div className="text-5xl text-[#C39A48]">â™¡</div>

            <h2 className="mt-4 text-xl font-bold">
              No favourites yet
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              Browse songs and tap the heart to save your favourites.
            </p>

            <Link
              href="/songs"
              className="mt-6 inline-block rounded-xl bg-[#32165C] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#4C2778]"
            >
              Explore Songs
            </Link>
          </div>
        ) : null}
      </section>

      <footer className="mt-12 border-t border-white/15 bg-[#24103F]/70 px-5 py-5 text-center text-xs text-white/65">
        Â© 2026 WorshipVerse
      </footer>
    </main>
  );
}

