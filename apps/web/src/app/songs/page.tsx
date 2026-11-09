
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import VoiceSearchForm from './VoiceSearchForm';

type SongsPageProps = {
  searchParams: Promise<{
    language?: string;
    q?: string;
  }>;
};

export default async function SongsPage({ searchParams }: SongsPageProps) {
  const { language, q } = await searchParams;

  const selectedLanguage = language === 'te' ? 'te' : 'en';
  const search = q?.trim() ?? '';

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let query = supabase
    .from('songs')
    .select('id, title, artist, language, lyrics, youtube_url, created_at')
    .eq('language', selectedLanguage)
    .order('created_at', { ascending: false });

  if (search) {
    query = query.ilike('title', `%${search}%`);
  }

  const { data: songs, error } = await query;

  const isTelugu = selectedLanguage === 'te';

  return (
    <main className="min-h-screen bg-[#FAF8F4] text-[#24103F]">
      <header className="bg-[#32165C] px-5 py-5 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            WorshipVerse
          </Link>

          <Link href="/" className="text-sm text-[#D8B66C] hover:underline">
            Home
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#9B7A3C]">
          WorshipVerse Library
        </p>

        <h1 className="text-3xl font-bold">
          {isTelugu ? 'తెలుగు పాటలు' : 'English Songs'}
        </h1>

        <p className="mt-2 text-gray-600">
          {isTelugu
            ? 'తెలుగు ఆరాధన పాటలను అన్వేషించండి'
            : 'Explore our collection of English worship songs.'}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/songs?language=te"
            className={`rounded-full px-5 py-2 text-sm font-semibold ${
              isTelugu
                ? 'bg-[#32165C] text-white'
                : 'border border-[#32165C] text-[#32165C]'
            }`}
          >
            తెలుగు
          </Link>

          <Link
            href="/songs?language=en"
            className={`rounded-full px-5 py-2 text-sm font-semibold ${
              !isTelugu
                ? 'bg-[#32165C] text-white'
                : 'border border-[#32165C] text-[#32165C]'
            }`}
          >
            English
          </Link>
        </div>

        <VoiceSearchForm
  language={selectedLanguage}
  initialQuery={search}
/>

        <div className="mt-8">
          {error ? (
            <p className="rounded-xl bg-red-50 p-4 text-red-700">
              Unable to load songs: {error.message}
            </p>
          ) : songs && songs.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              {songs.map((song) => (
                <article
                  key={song.id}
                  className="rounded-2xl border border-[#E8E0D2] bg-white p-6 shadow-sm"
                >
                  <h2 className="text-xl font-bold">{song.title}</h2>

                  {song.artist && (
                    <p className="mt-1 text-sm text-gray-500">
                      {song.artist}
                    </p>
                  )}

                  <details className="mt-5">
                    <summary className="cursor-pointer font-semibold text-[#6B4A91]">
                      {isTelugu ? 'సాహిత్యం చూడండి' : 'View Lyrics'}
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
            <div className="rounded-2xl border border-dashed border-[#D8B66C] bg-white p-10 text-center">
              <h2 className="text-xl font-semibold">No songs found</h2>
              <p className="mt-2 text-gray-500">
                {search
                  ? 'Try another song title.'
                  : 'No songs have been published in this language yet.'}
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
