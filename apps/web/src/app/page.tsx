
'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function HomePage() {
  const [language, setLanguage] = useState<'en' | 'te'>('te');
  const [userEmail, setUserEmail] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);

  const isTelugu = language === 'te';

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? '');
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserEmail(session?.user?.email ?? '');
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    window.location.href = '/login';
  }

  function handleLanguageChange() {
    setLanguage(isTelugu ? 'en' : 'te');
  }

  return (
    <main className="min-h-screen bg-[#FAF8F4] text-[#24103F]">

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#24103F] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-5 lg:px-8">

          <a href="/" className="flex items-center gap-3">
            <Image
              src="/images/worshipverse-logo.png"
              alt="WorshipVerse logo"
              width={52}
              height={52}
              className="rounded-xl object-contain"
            />

            <div>
              <h1 className="text-lg font-bold tracking-wide sm:text-xl">
                WorshipVerse
              </h1>
              <p className="text-[9px] tracking-[0.2em] text-[#D8B66C]">
                SHARON A.G. CHURCH
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-8 text-sm text-white/80 sm:flex">
            <a href="#home" className="transition hover:text-[#D8B66C]">
              Home
            </a>
            <a href="#languages" className="transition hover:text-[#D8B66C]">
              Languages
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">

            {/* Account */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                aria-expanded={profileOpen}
                className="flex items-center gap-2 rounded-full border border-[#D8B66C]/50 px-2 py-2 text-xs text-white transition hover:bg-white/10 sm:px-3 sm:text-sm"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D8B66C] font-bold text-[#24103F]">
                  {userEmail ? userEmail[0].toUpperCase() : 'U'}
                </span>

                <span className="hidden sm:inline">My Account</span>
                <span>⌄</span>
              </button>

              {profileOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close account menu"
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setProfileOpen(false)}
                  />

                  <div className="absolute right-0 top-full z-50 mt-3 w-64 rounded-2xl border border-[#E9E1D3] bg-white p-3 text-[#32165C] shadow-xl">

                    <div className="border-b border-[#E9E1D3] px-3 py-3">
                      <p className="text-xs text-gray-400">
                        Signed in as
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold">
                        {userEmail || 'WorshipVerse Member'}
                      </p>
                    </div>

                    <div className="py-2">
                      {[
                        ['My Profile', '/profile'],
                        ['My Favourites', '/favourites'],
                        ['My Playlists', '/playlists'],
                        ['Account Settings', '/settings'],
                      ].map(([label, href]) => (
                        <a
                          key={href}
                          href={href}
                          className="block rounded-lg px-3 py-2 text-sm transition hover:bg-[#F4EFFA]"
                        >
                          {label}
                        </a>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full rounded-lg border-t border-[#E9E1D3] px-3 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Language switch */}
            <button
              type="button"
              onClick={handleLanguageChange}
              className="rounded-full border border-[#D8B66C]/60 px-3 py-2 text-xs font-semibold text-[#D8B66C] transition hover:bg-white/10"
            >
              {isTelugu ? 'English' : 'తెలుగు'}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        id="home"
        className="relative overflow-hidden bg-[#24103F] text-white"
      >
        <div className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#65409A]/25 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-[450px] w-[450px] rounded-full bg-[#D8B66C]/10 blur-[120px]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 sm:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-28">

          {/* Hero content */}
          <div>
            <div className="inline-flex items-center gap-3 rounded-full border border-[#D8B66C]/35 bg-white/[0.04] px-4 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D8B66C]" />
              <span className="text-[10px] font-semibold tracking-[0.24em] text-[#D8B66C]">
                {isTelugu
                  ? 'ఆరాధన • స్తుతి • గీతాలు'
                  : 'WORSHIP • PRAISE • SONGS'}
              </span>
            </div>

            <h2 className="mt-8 max-w-2xl text-4xl font-semibold leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl">
              {isTelugu
                ? 'ప్రతి పాట ఒక ప్రార్థన.'
                : 'Let your heart'}
              <span className="mt-2 block text-[#D8B66C]">
                {isTelugu
                  ? 'ప్రతి వాక్యం ఒక స్తుతి.'
                  : 'sing in worship.'}
              </span>
            </h2>

            <p className="mt-7 max-w-xl text-sm leading-8 text-white/65 sm:text-base">
              {isTelugu
                ? 'తెలుగు మరియు ఆంగ్ల క్రైస్తవ ఆరాధన గీతాలను ఒకే చోట కనుగొనండి.'
                : 'Discover Telugu and English Christian worship songs, lyrics and praise in one place.'}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3 text-xs text-white/50">
              <span>♫ Telugu Worship</span>
              <span className="text-[#D8B66C]">•</span>
              <span>♫ English Worship</span>
              <span className="text-[#D8B66C]">•</span>
              <span>✦ Praise Together</span>
            </div>
          </div>

          {/* Premium visual panel */}
          <div className="mx-auto w-full max-w-md">

            <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.06] p-3 shadow-2xl backdrop-blur-sm sm:p-5">

              <div className="relative flex min-h-[330px] flex-col items-center justify-center overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#65409A] via-[#43236F] to-[#32165C] px-6 py-10 text-center">

                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-white/10" />
                <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full border border-white/10" />
                <div className="absolute -bottom-28 -left-16 h-64 w-64 rounded-full border border-[#D8B66C]/15" />

                <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-[#D8B66C]/50 bg-white/[0.08] shadow-xl">
                  <span className="text-5xl text-[#D8B66C]">♫</span>
                </div>

                <p className="relative mt-9 text-[10px] font-semibold tracking-[0.3em] text-[#D8B66C]">
                  WORSHIPVERSE
                </p>

                <h3 className="relative mt-4 text-3xl font-semibold tracking-tight text-white">
                  {isTelugu ? 'స్తుతి గీతాలు' : 'Songs of Praise'}
                </h3>

                <p className="relative mt-4 max-w-xs text-sm leading-7 text-white/65">
                  {isTelugu
                    ? 'కలిసి పాడుదాం. కలిసి ఆరాధిద్దాం.'
                    : 'Sing together. Worship together. Grow together.'}
                </p>

                <div className="relative mt-8 h-px w-16 bg-[#D8B66C]/60" />

                <p className="relative mt-5 text-[10px] tracking-[0.2em] text-white/50">
                  EVERY SONG, A PRAYER
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 px-3 py-5">
                <span className="text-xs text-white/60">
                  SHARON A.G. CHURCH
                </span>
                <span className="text-xs font-semibold tracking-wider text-[#D8B66C]">
                  EST. WORSHIPVERSE
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Language selection */}
      <section
        id="languages"
        className="mx-auto max-w-7xl px-5 py-20 sm:py-24 lg:px-8"
      >
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <p className="text-[10px] font-bold tracking-[0.25em] text-[#A17B38]">
              {isTelugu ? 'భాషను ఎంచుకోండి' : 'EXPLORE BY LANGUAGE'}
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#32165C] sm:text-4xl">
              {isTelugu
                ? 'మీ భాషలో ఆరాధించండి'
                : 'Worship in your language.'}
            </h2>
          </div>

          <p className="max-w-sm text-sm leading-7 text-gray-500">
            {isTelugu
              ? 'మీకు ఇష్టమైన భాషలో ఆరాధన గీతాలను కనుగొనండి.'
              : 'Discover songs of praise and worship in the language closest to your heart.'}
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">

          {/* Telugu card */}
          <a
            href="/songs?language=te"
            className="group relative min-h-[270px] overflow-hidden rounded-[1.75rem] border border-[#E9E1D3] bg-[#24103F] p-7 text-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#D8B66C]/60 hover:shadow-xl sm:p-9"
          >
            <div className="absolute -right-12 -top-16 h-64 w-64 rounded-full border border-white/10 transition duration-500 group-hover:scale-110" />
            <div className="absolute -right-4 -top-8 h-44 w-44 rounded-full border border-[#D8B66C]/20" />

            <div className="relative flex h-full flex-col justify-between gap-8">

              <div>
                <p className="text-[10px] font-semibold tracking-[0.25em] text-[#D8B66C]">
                  01 · TELUGU COLLECTION
                </p>

                <h3 className="mt-7 text-5xl font-semibold tracking-tight sm:text-6xl">
                  తెలుగు
                </h3>

                <p className="mt-3 text-sm text-white/65">
                  Telugu Christian worship and praise songs
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-white/15 pt-5">
                <span className="text-xs font-semibold tracking-[0.15em] text-[#D8B66C]">
                  EXPLORE SONGS
                </span>

                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D8B66C]/50 text-[#D8B66C] transition group-hover:bg-[#D8B66C] group-hover:text-[#24103F]">
                  ↗
                </span>
              </div>
            </div>
          </a>

          {/* English card */}
          <a
            href="/songs?language=en"
            className="group relative min-h-[270px] overflow-hidden rounded-[1.75rem] border border-[#E9E1D3] bg-gradient-to-br from-[#43236F] to-[#24103F] p-7 text-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#D8B66C]/60 hover:shadow-xl sm:p-9"
          >
            <div className="absolute -right-12 -top-16 h-64 w-64 rounded-full border border-white/10 transition duration-500 group-hover:scale-110" />
            <div className="absolute -right-4 -top-8 h-44 w-44 rounded-full border border-[#D8B66C]/20" />

            <div className="relative flex h-full flex-col justify-between gap-8">

              <div>
                <p className="text-[10px] font-semibold tracking-[0.25em] text-[#D8B66C]">
                  02 · ENGLISH COLLECTION
                </p>

                <h3 className="mt-7 text-5xl font-semibold tracking-tight sm:text-6xl">
                  English
                </h3>

                <p className="mt-3 text-sm text-white/65">
                  English Christian worship and praise songs
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-white/15 pt-5">
                <span className="text-xs font-semibold tracking-[0.15em] text-[#D8B66C]">
                  EXPLORE SONGS
                </span>

                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D8B66C]/50 text-[#D8B66C] transition group-hover:bg-[#D8B66C] group-hover:text-[#24103F]">
                  ↗
                </span>
              </div>
            </div>
          </a>
        </div>
      </section>

      {/* Call to action */}
      <section className="bg-[#32165C] px-5 py-16 text-center text-white">
        <p className="text-[10px] font-bold tracking-[0.25em] text-[#D8B66C]">
          SHARON A.G. CHURCH
        </p>

        <h2 className="mt-4 text-3xl font-semibold tracking-tight">
          {isTelugu ? 'ఆరాధనలో మాతో చేరండి' : 'Be Part of the Worship'}
        </h2>

        <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-white/65">
          {isTelugu
            ? 'మీ ఆరాధన ప్రయాణాన్ని WorshipVerse తో ప్రారంభించండి.'
            : 'Start your worship journey with WorshipVerse.'}
        </p>
      </section>

      {/* Footer */}
<footer className="bg-[#1B0D2D] px-5 py-9 text-center text-sm text-white/50">
  <p className="font-semibold text-white">WorshipVerse</p>

  <p className="mt-2 text-xs text-[#D8B66C]">
    Every Song, A Prayer. Every Verse, A Praise.
  </p>

  <a
  href="/download"
  className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#D8B66C]/60 px-5 py-3 text-xs font-semibold tracking-wider text-[#D8B66C] transition hover:bg-[#D8B66C] hover:text-[#24103F]"
>
    <span>⬇</span>
    {isTelugu ? 'Android కోసం డౌన్‌లోడ్ చేయండి' : 'Download for Android'}
  </a>

  <p className="mt-5 text-xs">
    © 2026 WorshipVerse · SHARON A.G. CHURCH
  </p>
</footer>
    </main>
  );
}
