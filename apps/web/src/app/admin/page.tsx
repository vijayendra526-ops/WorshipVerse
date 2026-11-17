
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  CirclePlus,
  Music2,
  ArrowUpRight,
  ChevronRight,
  Library,
  Sparkles,
  CalendarDays,
  ArrowRight,
} from 'lucide-react';

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
    supabase.from('songs').select('*', {
      count: 'exact',
      head: true,
    }),
    supabase
      .from('songs')
      .select('*', { count: 'exact', head: true })
      .eq('language', 'te'),
    supabase
      .from('songs')
      .select('*', { count: 'exact', head: true })
      .eq('language', 'en'),
    supabase
      .from('songs')
      .select('id, title, language, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const stats = [
    {
      label: 'Total Songs',
      value: totalSongs ?? 0,
      subtitle: 'Songs in your collection',
      icon: Library,
      iconStyle: 'bg-[#EEE5F7] text-[#7043A1]',
      accent: 'bg-[#7043A1]',
    },
    {
      label: 'Telugu Songs',
      value: teluguSongs ?? 0,
      subtitle: 'Telugu worship lyrics',
      icon: Music2,
      iconStyle: 'bg-[#F7ECD5] text-[#A17B38]',
      accent: 'bg-[#D8B66C]',
    },
    {
      label: 'English Songs',
      value: englishSongs ?? 0,
      subtitle: 'English worship lyrics',
      icon: Music2,
      iconStyle: 'bg-[#E7EEF8] text-[#5277A2]',
      accent: 'bg-[#7799C1]',
    },
  ];

  return (
    <div className="min-w-0 text-white">
      {/* Dashboard toolbar */}
      <header className="border-b border-white/10 bg-[#24103F]/55 px-4 py-5 backdrop-blur-xl sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D8B66C]">
              WorshipVerse / Administration
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-[29px]">
              Dashboard
            </h1>

            <p className="mt-1 text-xs text-white/50 sm:text-sm">
              Manage your worship library in one place.
            </p>
          </div>

          <Link
            href="/admin/songs/new"
            className="inline-flex items-center gap-2 rounded-xl bg-[#D8B66C] px-4 py-3 text-xs font-bold text-[#24103F] shadow-lg transition hover:bg-[#E9CB89] sm:text-sm"
          >
            <CirclePlus size={17} />
            Publish Song
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1180px] space-y-7 px-4 py-6 sm:px-7 sm:py-8">
        {/* Welcome */}
        <section className="relative overflow-hidden rounded-2xl border border-[#D8B66C]/20 bg-gradient-to-r from-[#39205C] via-[#321950] to-[#27133F] p-5 shadow-xl sm:p-7">
          <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-[#D8B66C]/10 blur-3xl" />

          <div className="relative flex items-center justify-between gap-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[#D8B66C]">
                <Sparkles size={15} />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em]">
                  WorshipVerse Studio
                </span>
              </div>

              <h2 className="mt-3 text-xl font-bold sm:text-2xl">
                Welcome back!
              </h2>

              <p className="mt-2 max-w-lg text-xs leading-6 text-white/65 sm:text-sm">
                Your space to publish worship lyrics,
                organize songs and inspire your community.
              </p>

              <Link
                href="/admin/songs"
                className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#F0D79B] hover:text-white"
              >
                Explore Library
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="relative hidden h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-[#D8B66C]/30 lg:block">
              <Image
                src="/images/worship-instruments.jpg"
                alt="Worship instruments"
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold">
                Library Overview
              </h2>
              <p className="mt-1 text-xs text-white/45">
                Live statistics from your song collection.
              </p>
            </div>

            <span className="inline-flex items-center gap-2 text-[11px] text-[#D8B66C]/80">
              <Library size={14} />
              Song Library
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="relative overflow-hidden rounded-2xl border border-[#EAE2D7] bg-[#FAF8F4] p-5 text-[#24103F] shadow-lg transition hover:-translate-y-0.5"
                >
                  <div
                    className={`absolute left-0 top-0 h-1 w-full ${stat.accent}`}
                  />

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-[#82758C]">
                        {stat.label}
                      </p>

                      <p className="mt-3 text-3xl font-extrabold tracking-tight text-[#32165C]">
                        {stat.value}
                      </p>
                    </div>

                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.iconStyle}`}
                    >
                      <Icon size={20} strokeWidth={1.8} />
                    </div>
                  </div>

                  <p className="mt-3 text-[11px] text-gray-500">
                    {stat.subtitle}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick actions */}
        <section>
          <h2 className="mb-4 text-lg font-bold">
            Quick Actions
          </h2>

          <div className="grid gap-4 xl:grid-cols-2">
            <Link
              href="/admin/songs"
              className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition hover:border-[#D8B66C]/35 hover:bg-white/[0.10]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D8B66C]/15 text-[#D8B66C]">
                <Music2 size={21} />
              </span>

              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold">
                  Manage Songs
                </h3>
                <p className="mt-1 text-xs text-white/45">
                  Browse and organize your library.
                </p>
              </div>

              <ChevronRight
                size={17}
                className="shrink-0 text-white/35 transition group-hover:translate-x-1"
              />
            </Link>

            <Link
              href="/admin/songs/new"
              className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition hover:border-[#D8B66C]/35 hover:bg-white/[0.10]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D8B66C]/15 text-[#D8B66C]">
                <CirclePlus size={21} />
              </span>

              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold">
                  Publish Song
                </h3>
                <p className="mt-1 text-xs text-white/45">
                  Add new worship lyrics.
                </p>
              </div>

              <ChevronRight
                size={17}
                className="shrink-0 text-white/35 transition group-hover:translate-x-1"
              />
            </Link>
          </div>
        </section>

        {/* Recent songs */}
        <section className="overflow-hidden rounded-2xl border border-[#EAE2D7] bg-[#FAF8F4] text-[#24103F] shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE3DA] px-5 py-5 sm:px-6">
            <div>
              <h2 className="text-lg font-bold text-[#32165C]">
                Recently Published
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Your five latest worship songs.
              </p>
            </div>

            <Link
              href="/admin/songs"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#F1E6CC] px-3 py-2 text-xs font-semibold text-[#80601F] hover:bg-[#EAD9B3]"
            >
              View All
              <ArrowUpRight size={14} />
            </Link>
          </div>

          {songsError ? (
            <p role="alert" className="p-6 text-sm text-red-700">
              Unable to load songs. Please refresh the page.
            </p>
          ) : recentSongs?.length ? (
            <div className="divide-y divide-[#EAE3DA]">
              {recentSongs.map((song) => (
                <div
                  key={song.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-white sm:px-6"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-[#E8DFD1]">
                      <Image
                        src="/images/worship-instruments.jpg"
                        alt="Worship song artwork"
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-[#32165C]">
                        {song.title}
                      </p>

                      <span className="mt-1 inline-block rounded-full bg-[#F1E6CC] px-2.5 py-0.5 text-[10px] font-semibold text-[#80601F]">
                        {song.language === 'te'
                          ? 'తెలుగు'
                          : 'English'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                    <CalendarDays size={13} />

                    {song.created_at
                      ? new Date(
                          song.created_at
                        ).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          timeZone: 'UTC',
                        })
                      : '—'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-9 text-center">
              <Music2
                size={30}
                className="mx-auto text-[#A17B38]"
              />

              <h3 className="mt-3 font-bold text-[#32165C]">
                Your Library Is Ready
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Publish your first Telugu or English worship song.
              </p>

              <Link
                href="/admin/songs/new"
                className="mt-5 inline-flex rounded-xl bg-[#32165C] px-5 py-3 text-sm font-semibold text-white hover:bg-[#48247C]"
              >
                Publish Your First Song
              </Link>
            </div>
          )}
        </section>

        <footer className="pb-4 text-center text-[11px] text-white/35">
          WorshipVerse · Every Song, A Prayer. Every Verse, A Praise.
        </footer>
      </div>
    </div>
  );
}
