
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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

  useEffect(() => {
    async function loadFavourites() {
      const { data: { user }, error: authError } =
        await supabase.auth.getUser();

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
  }, [router, supabase]);

  async function removeFavourite(songId: string) {
    const { data: { user } } = await supabase.auth.getUser();

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
  }

  return (
    <main className="min-h-screen bg-[#FAF8F4] text-[#24103F]">
      <header className="bg-[#32165C] px-5 py-5 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            WorshipVerse
          </Link>
          <Link href="/songs" className="text-sm text-[#D8B66C] hover:underline">
            Browse Songs
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-[#9B7A3C]">
          Your Personal Library
        </p>

        <h1 className="mt-2 text-3xl font-bold text-[#32165C]">
          ♥ My Favourites
        </h1>

        <p className="mt-2 text-gray-600">
          All your saved worship songs in one place.
        </p>

        {loading ? (
          <p className="mt-10 text-gray-500">Loading your favourites...</p>
        ) : error ? (
          <p className="mt-8 rounded-xl bg-red-50 p-4 text-red-700">
            {error}
          </p>
        ) : songs.length > 0 ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {songs.map((song) => (
              <article
                key={song.id}
                className="rounded-2xl border border-[#E8E0D2] bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">{song.title}</h2>
                    {song.artist && (
                      <p className="mt-1 text-sm text-gray-500">
                        {song.artist}
                      </p>
                    )}
                    <p className="mt-2 text-xs font-semibold text-[#98712F]">
                      {song.language === 'te' ? 'TELUGU' : 'ENGLISH'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFavourite(song.id)}
                    title="Remove from favourites"
                    aria-label={`Remove ${song.title} from favourites`}
                    className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-lg text-red-600 hover:bg-red-100"
                  >
                    ♥
                  </button>
                </div>

                <details className="mt-5">
                  <summary className="cursor-pointer font-semibold text-[#6B4A91]">
                    View Lyrics
                  </summary>
                  <p className="mt-4 whitespace-pre-wrap leading-8 text-gray-700">
                    {song.lyrics}
                  </p>
                </details>

                {song.youtube_url && (
                  <a
                    href={song.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-block rounded-lg bg-[#32165C] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Watch on YouTube
                  </a>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-[#D8B66C] bg-white p-10 text-center">
            <div className="text-5xl text-[#D8B66C]">♡</div>
            <h2 className="mt-4 text-xl font-bold text-[#32165C]">
              No favourites yet
            </h2>
            <p className="mt-2 text-gray-500">
              Browse songs and tap the heart to save your favourites.
            </p>
            <Link
              href="/songs"
              className="mt-5 inline-block rounded-xl bg-[#32165C] px-5 py-3 font-semibold text-white"
            >
              Explore Songs
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
