
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import SongManager from './SongManager';

export const instant = false;

export default async function ManageSongsPage() {
  // Wait until an incoming request is available.
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) redirect('/login');

  const role = user.app_metadata?.role;

  if (role !== 'admin' && role !== 'super_admin') {
    redirect('/');
  }

  const { data: songs, error } = await supabase
    .from('songs')
    .select('id, title, language, youtube_url, created_at')
    .order('created_at', { ascending: false });

  return (
    <main className="min-h-screen bg-[#FAF8F4] text-[#24103F]">
      <header className="border-b border-[#E9E1D3] bg-white px-5 py-6 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <Link href="/admin" className="text-sm font-semibold text-[#8B6B35]">
            ← Back to Dashboard
          </Link>

          <p className="mt-6 text-xs font-bold tracking-[0.2em] text-[#A17B39]">
            WORSHIPVERSE ADMINISTRATION
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-[#32165C]">
            Manage Songs
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Organize, search and manage your Telugu and English worship library.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl p-5 sm:p-8">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            Unable to load songs: {error.message}
          </div>
        ) : (
          <SongManager initialSongs={songs ?? []} />
        )}
      </div>
    </main>
  );
}
