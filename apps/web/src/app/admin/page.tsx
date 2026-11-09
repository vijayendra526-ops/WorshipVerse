
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const instant = false;

export default async function AdminPage() {
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

  const [
    { count: totalSongs },
    { count: teluguSongs },
    { count: englishSongs },
    { data: recentSongs, error: songsError },
  ] = await Promise.all([
    supabase.from('songs').select('*', { count: 'exact', head: true }),
    supabase.from('songs').select('*', { count: 'exact', head: true }).eq('language', 'te'),
    supabase.from('songs').select('*', { count: 'exact', head: true }).eq('language', 'en'),
    supabase
      .from('songs')
      .select('id, title, language, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const stats = [
    { label: 'Total Songs', value: totalSongs ?? 0, icon: '♫' },
    { label: 'Telugu Songs', value: teluguSongs ?? 0, icon: 'తె' },
    { label: 'English Songs', value: englishSongs ?? 0, icon: 'En' },
  ];

  return (
    <main className="min-h-screen bg-[#FAF8F4] text-[#24103F]">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col bg-[#24103F] p-6 text-white md:flex">
          <Link href="/admin" className="block">
            <div className="text-2xl font-extrabold tracking-[0.15em]">
              WORSHIP<span className="text-[#D8B66C]">VERSE</span>
            </div>
            <p className="mt-2 text-xs tracking-[0.2em] text-[#D8B66C]">
              SHARON A.G. CHURCH
            </p>
          </Link>

          <div className="mt-12">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">
              Workspace
            </p>

            <nav className="space-y-2">
              <Link
                href="/admin"
                className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 font-medium text-[#E8CF96]"
              >
                <span>▦</span> Dashboard
              </Link>

              <Link
                href="/admin/songs"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-white/75 transition hover:bg-white/10"
              >
                <span>♫</span> Manage Songs
              </Link>

              <Link
                href="/admin/songs/new"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-white/75 transition hover:bg-white/10"
              >
                <span>＋</span> Add New Song
              </Link>
            </nav>
          </div>

          <div className="mt-auto border-t border-white/10 pt-6">
            <p className="break-all text-xs text-white/60">{user.email}</p>
            <p className="mt-2 text-xs text-[#D8B66C]">Administrator</p>
            <Link
              href="/"
              className="mt-5 block text-sm text-white/70 hover:text-white"
            >
              ← Back to WorshipVerse
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <section className="min-w-0 flex-1">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E9E1D3] bg-white px-5 py-5 sm:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A17B39]">
                WorshipVerse Administration
              </p>
              <h1 className="mt-1 text-xl font-bold text-[#32165C] sm:text-2xl">
                Dashboard
              </h1>
            </div>

            <Link
              href="/admin/songs/new"
              className="rounded-xl bg-[#32165C] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#24103F]"
            >
              + Add New Song
            </Link>
          </header>

          <div className="mx-auto max-w-7xl space-y-8 p-5 sm:p-8">
            {/* Welcome */}
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#32165C] to-[#24103F] p-7 text-white shadow-lg sm:p-10">
              <p className="text-sm font-medium tracking-wide text-[#E8CF96]">
                ADMINISTRATOR WORKSPACE
              </p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                Welcome back!
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">
                Manage your worship song library, publish lyrics and help
                your church community worship together.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/admin/songs/new"
                  className="rounded-xl bg-[#D8B66C] px-5 py-3 text-sm font-bold text-[#24103F] hover:bg-[#E8CF96]"
                >
                  Publish a Song
                </Link>
                <Link
                  href="/admin/songs"
                  className="rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  View Song Library
                </Link>
              </div>
            </div>

            {/* Statistics */}
            <div>
              <div className="mb-4">
                <h2 className="text-lg font-bold text-[#32165C]">
                  Library Overview
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Your worship song collection at a glance.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-[#EDE5D8] bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-500">
                        {stat.label}
                      </p>
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4EFF9] font-bold text-[#A17B39]">
                        {stat.icon}
                      </span>
                    </div>
                    <p className="mt-4 text-4xl font-extrabold text-[#32165C]">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Songs */}
            <div className="overflow-hidden rounded-2xl border border-[#EDE5D8] bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0EBE3] p-6">
                <div>
                  <h2 className="text-lg font-bold text-[#32165C]">
                    Recently Published
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Your latest worship songs.
                  </p>
                </div>
                <Link
                  href="/admin/songs"
                  className="text-sm font-semibold text-[#8B6B35] hover:underline"
                >
                  Manage All →
                </Link>
              </div>

              {songsError ? (
                <p className="p-6 text-sm text-red-600">
                  Unable to load songs. Please refresh the page.
                </p>
              ) : recentSongs?.length ? (
                <div className="divide-y divide-[#F0EBE3]">
                  {recentSongs.map((song) => (
                    <div
                      key={song.id}
                      className="flex flex-wrap items-center justify-between gap-3 p-5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4EFF9] text-xl text-[#32165C]">
                          ♫
                        </div>
                        <div>
                          <p className="font-semibold text-[#32165C]">
                            {song.title}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {song.language === 'te' ? 'Telugu' : 'English'}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(song.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center">
                  <div className="text-4xl text-[#D8B66C]">♫</div>
                  <h3 className="mt-3 font-bold text-[#32165C]">
                    Your library is ready
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Publish your first Telugu or English worship song.
                  </p>
                  <Link
                    href="/admin/songs/new"
                    className="mt-5 inline-block rounded-xl bg-[#32165C] px-5 py-3 text-sm font-semibold text-white"
                  >
                    + Add Your First Song
                  </Link>
                </div>
              )}
            </div>

            <footer className="pb-4 text-center text-xs text-gray-400">
              WorshipVerse · Every Song, A Prayer. Every Verse, A Praise.
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}
