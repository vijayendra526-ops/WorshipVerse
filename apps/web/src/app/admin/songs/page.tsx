
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import SongManager from './SongManager';
import {
  Music2,
  CirclePlus,
  LayoutDashboard,
  ChevronRight,
  Library,
  ShieldCheck,
} from 'lucide-react';

export const instant = false;

export default async function ManageSongsPage() {
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

  const total = songs?.length ?? 0;
  const telugu = songs?.filter((song) => song.language === 'te').length ?? 0;
  const english = songs?.filter((song) => song.language === 'en').length ?? 0;

  return (
    <main className="min-w-0 min-h-screen text-white">
      {/* Page header */}
      <header className="border-b border-white/10 bg-[#24103F]/55 px-4 py-5 backdrop-blur-xl sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center gap-2 text-[11px] text-white/45"
            >
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 transition hover:text-[#D8B66C]"
              >
                <LayoutDashboard size={13} />
                Dashboard
              </Link>

              <ChevronRight size={13} />

              <span className="font-semibold text-[#D8B66C]">
                Manage Songs
              </span>
            </nav>

            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-[29px]">
              Manage Songs
            </h1>

            <p className="mt-1 text-xs text-white/55 sm:text-sm">
              Organize, search and manage your worship library.
            </p>
          </div>

          <Link
            href="/admin/songs/new"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#D8B66C] px-4 py-3 text-xs font-bold text-[#24103F] shadow-lg transition hover:bg-[#E9CB89] sm:text-sm"
          >
            <CirclePlus size={17} />
            Publish Song
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1180px] space-y-6 px-4 py-6 sm:px-7 sm:py-8">
        {/* Introduction */}
        <section className="rounded-2xl border border-[#D8B66C]/20 bg-gradient-to-r from-[#39205C] to-[#27133F] p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#D8B66C]/20 bg-[#D8B66C]/10 text-[#D8B66C]">
              <Music2 size={23} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D8B66C]">
                WorshipVerse Library
              </p>

              <h2 className="mt-2 text-lg font-bold">
                Your Worship Collection
              </h2>

              <p className="mt-2 max-w-2xl text-xs leading-6 text-white/60 sm:text-sm">
                Manage your Telugu and English songs from one place.
                Use the tools below to search and organize your collection.
              </p>
            </div>
          </div>
        </section>

        {/* Overview */}
        {!error && (
          <section className="grid gap-4 sm:grid-cols-3">
            {[
              {
                label: 'Total Songs',
                value: total,
                icon: Library,
                accent: 'bg-[#7043A1]',
                iconColor: 'text-[#7043A1] bg-[#EEE5F7]',
              },
              {
                label: 'Telugu Songs',
                value: telugu,
                icon: Music2,
                accent: 'bg-[#D8B66C]',
                iconColor: 'text-[#A17B38] bg-[#F7ECD5]',
              },
              {
                label: 'English Songs',
                value: english,
                icon: Music2,
                accent: 'bg-[#7799C1]',
                iconColor: 'text-[#5277A2] bg-[#E7EEF8]',
              },
            ].map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="relative overflow-hidden rounded-2xl border border-[#EAE2D7] bg-[#FAF8F4] p-5 text-[#24103F] shadow-lg"
                >
                  <div
                    className={`absolute left-0 top-0 h-1 w-full ${stat.accent}`}
                  />

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-[#82758C]">
                        {stat.label}
                      </p>

                      <p className="mt-3 text-3xl font-extrabold text-[#32165C]">
                        {stat.value}
                      </p>
                    </div>

                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconColor}`}
                    >
                      <Icon size={20} />
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Existing SongManager remains unchanged */}
        <section className="overflow-hidden rounded-2xl border border-[#EAE2D7] bg-[#FAF8F4] text-[#24103F] shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE3DA] px-5 py-5 sm:px-6">
            <div>
              <h2 className="text-lg font-bold text-[#32165C]">
                Song Management
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Search, edit and organize your songs.
              </p>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full bg-[#F1E6CC] px-3 py-1.5 text-[11px] font-semibold text-[#80601F]">
              <ShieldCheck size={13} />
              Admin Workspace
            </span>
          </div>

          <div className="min-w-0 p-4 sm:p-6">
            {error ? (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
              >
                Unable to load songs: {error.message}
              </div>
            ) : (
              <SongManager initialSongs={songs ?? []} />
            )}
          </div>
        </section>

        <footer className="pb-4 text-center text-[11px] text-white/35">
          WorshipVerse · Every Song, A Prayer. Every Verse, A Praise.
        </footer>
      </div>
    </main>
  );
}
