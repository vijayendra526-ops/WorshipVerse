
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function HomePage() {
  const [language, setLanguage] = useState<'en' | 'te'>('te');
  const [userEmail, setUserEmail] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);

  const isTelugu = language === 'te';

  // Load authentication state only after the component mounts.
  useEffect(() => {
    const supabase = createClient();
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (active) {
        setUserEmail(data.user?.email ?? '');
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (active) {
          setUserEmail(session?.user?.email ?? '');
        }
      }
    );

    return () => {
      active = false;
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

  const features = [
    {
      icon: '♫',
      title: isTelugu ? 'ఆరాధన గీతాలు' : 'Worship Library',
      description: isTelugu
        ? 'తెలుగు మరియు ఆంగ్ల ఆరాధన పాటలను కనుగొనండి.'
        : 'Discover Christian worship songs in Telugu and English.',
    },
    {
      icon: '↓',
      title: isTelugu ? 'ఆఫ్‌లైన్ వినియోగం' : 'Offline Listening',
      description: isTelugu
        ? 'పాటలను డౌన్‌లోడ్ చేసి ఎప్పుడైనా వినండి.'
        : 'Download songs and access them even without internet.',
    },
    {
      icon: '♡',
      title: isTelugu ? 'ఇష్టమైన పాటలు' : 'Your Favourites',
      description: isTelugu
        ? 'మీకు ఇష్టమైన పాటలను భద్రపరచుకోండి.'
        : 'Save your favourite songs for quick access.',
    },
    {
      icon: '☷',
      title: isTelugu ? 'వ్యక్తిగత ప్లేలిస్టులు' : 'Personal Playlists',
      description: isTelugu
        ? 'మీ పాటలతో ప్రత్యేకమైన ప్లేలిస్టులు సృష్టించండి.'
        : 'Create playlists and organise the songs you love.',
    },
  ];

  return (
    <main className="min-h-screen bg-[#FAF8F4] text-[#24103F]">

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#24103F] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/worshipverse-logo.png"
              alt="WorshipVerse logo"
              width={52}
              height={52}
              priority
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
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-8 text-sm text-white/80 sm:flex">
            <Link href="#home" className="transition hover:text-[#D8B66C]">
              Home
            </Link>
            <Link href="#languages" className="transition hover:text-[#D8B66C]">
              Languages
            </Link>
            <Link href="#features" className="transition hover:text-[#D8B66C]">
              Features
            </Link>
            <Link href="/download" className="transition hover:text-[#D8B66C]">
              Download
            </Link>
          </nav>

          {/* Account and language controls */}
          <div className="flex items-center gap-2 sm:gap-3">

            <button
              type="button"
              onClick={() => setLanguage(isTelugu ? 'en' : 'te')}
              className="rounded-full border border-[#D8B66C] px-3 py-2 text-xs font-semibold text-[#E8C77E] transition hover:bg-[#D8B66C] hover:text-[#24103F]"
            >
              {isTelugu ? 'English →' : 'తెలుగు →'}
            </button>

            {userEmail ? (
              <div className="relative">

                <button
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  aria-expanded={profileOpen}
                  className="flex items-center gap-2 rounded-full border border-[#D8B66C]/50 px-2 py-2 text-xs text-white transition hover:bg-white/10 sm:px-3 sm:text-sm"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D8B66C] font-bold text-[#24103F]">
                    {userEmail[0].toUpperCase()}
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

                    <div className="absolute right-0 top-full z-50 mt-3 w-64 rounded-2xl border border-[#E9E1D3] bg-white p-3 text-[#32165C] shadow-2xl">

                      <div className="border-b border-[#E9E1D3] px-3 py-3">
                        <p className="text-xs text-gray-400">
                          Signed in as
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold">
                          {userEmail}
                        </p>
                      </div>

                      <div className="py-2">
                        {[
                          ['My Profile', '/profile'],
                          ['My Favourites', '/favourites'],
                          ['My Playlists', '/playlists'],
                          ['Account Settings', '/settings'],
                        ].map(([label, href]) => (
                          <Link
                            key={href}
                            href={href}
                            onClick={() => setProfileOpen(false)}
                            className="block rounded-lg px-3 py-2 text-sm transition hover:bg-[#F4EFFA]"
                          >
                            {label}
                          </Link>
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
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-gradient-to-r from-[#E8C77E] to-[#D8B66C] px-4 py-2.5 text-xs font-bold text-[#24103F] shadow-md transition hover:-translate-y-0.5 hover:shadow-lg sm:px-5 sm:text-sm"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Mobile navigation */}
        <nav className="flex items-center justify-center gap-8 border-t border-white/10 px-3 py-3 text-xs text-white/75 sm:hidden">
          <Link href="#languages" className="hover:text-[#D8B66C]">
            Languages
          </Link>
          <Link href="#features" className="hover:text-[#D8B66C]">
            Features
          </Link>
          <Link href="/download" className="hover:text-[#D8B66C]">
            Download
          </Link>
        </nav>
      </header>

      {/* Premium hero */}
      <section
        id="home"
        className="relative isolate flex min-h-[510px] items-center overflow-hidden bg-[#1B0D2D] text-white sm:min-h-[570px]"
      >
        <Image
          src="/images/worshipverse-hero-artwork.png"
          alt="A cross illuminated by a beautiful sunrise"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-20 object-cover object-center"
        />

        {/* Image overlays */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#1B0D2D] via-[#24103F]/90 to-[#24103F]/10" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#1B0D2D]/40 via-transparent to-[#1B0D2D]/10" />

        <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-28">
          <div className="max-w-3xl">

            <div className="inline-flex items-center gap-3 rounded-full border border-[#D8B66C]/50 bg-[#24103F]/40 px-4 py-2 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-[#E8C77E] shadow-[0_0_12px_#D8B66C]" />
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#E8C77E] sm:text-xs">
                {isTelugu ? 'ఆరాధన • స్తుతి • గీతాలు' : 'WORSHIP • PRAISE • SONGS'}
              </span>
            </div>

            <h2 className="mt-7 font-serif text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
              {isTelugu ? 'ప్రతి పాట ఒక ప్రార్థన.' : 'Songs of Worship'}
              <span className="mt-2 block italic text-[#E8C77E]">
                {isTelugu ? 'ప్రతి వాక్యం ఒక స్తుతి.' : 'for Every Heart.'}
              </span>
            </h2>

            <p className="mt-7 max-w-xl text-base leading-8 text-white/85 sm:text-lg">
              {isTelugu
                ? 'తెలుగు మరియు ఆంగ్ల క్రైస్తవ ఆరాధన గీతాలను ఒకే చోట కనుగొనండి. మీ హృదయాన్ని ఆరాధనతో నింపుకోండి.'
                : 'Discover Telugu and English Christian worship songs, lyrics and praise in one beautiful place.'}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/songs?language=te"
                className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#F2D18A] to-[#D8B66C] px-7 py-4 text-sm font-bold text-[#24103F] shadow-[0_8px_30px_rgba(216,182,108,0.25)] transition hover:-translate-y-1 hover:shadow-xl"
              >
                {isTelugu ? 'పాటలను అన్వేషించండి' : 'Explore Songs'}
                <span className="text-lg">→</span>
              </Link>

              <Link
                href="/download"
                className="inline-flex items-center gap-3 rounded-full border border-[#E8C77E] bg-[#24103F]/30 px-7 py-4 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-[#D8B66C] hover:text-[#24103F]"
              >
                <span className="text-lg">↓</span>
                {isTelugu ? 'యాప్ డౌన్‌లోడ్' : 'Get the App'}
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-3 text-xs text-white/80">
              <span>♫ Telugu Worship</span>
              <span className="text-[#E8C77E]">•</span>
              <span>♫ English Worship</span>
              <span className="text-[#E8C77E]">•</span>
              <span>✦ Praise Together</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick feature strip */}
      <section className="border-y border-[#D8B66C]/20 bg-gradient-to-r from-[#1B0D2D] via-[#32134F] to-[#1B0D2D] text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-white/15 px-4 py-6 sm:grid-cols-4 lg:px-8">
          {[
            ['♫', 'Worship Library', 'Telugu & English'],
            ['↓', 'Offline Listening', 'Anytime, Anywhere'],
            ['♡', 'Your Favourites', 'Save for Later'],
            ['☷', 'Personal Playlists', 'Organise Easily'],
          ].map(([icon, title, subtitle]) => (
            <div key={title} className="flex items-center justify-center gap-3 px-3 py-3">
              <span className="font-serif text-3xl text-[#E8C77E]">{icon}</span>
              <div>
                <p className="text-xs font-bold sm:text-sm">{title}</p>
                <p className="mt-1 text-[10px] text-white/60 sm:text-xs">{subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

{/* Language collections */}
<section className="py-12 sm:py-16">
  <div className="mx-auto max-w-7xl px-5 sm:px-8">
    <div className="mb-7 flex items-end justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#B18A45]">
          Explore the collection
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#24103F] sm:text-3xl">
          Songs in your language
        </h2>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Link
        href="/songs?language=te"
        className="group relative isolate flex min-h-[150px] items-end overflow-hidden rounded-2xl border border-[#E9E2D5] p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:min-h-[175px] sm:p-6"
      >
        <Image
          src="/images/telugu-worship.jpg"
          alt="Telugu Christian worship"
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          className="absolute inset-0 -z-20 object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#160B2B]/90 via-[#160B2B]/55 to-transparent" />
        <div className="flex w-full items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#E7C982]">
              Telugu collection
            </p>
            <h3 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
              తెలుగు పాటలు
            </h3>
            <p className="mt-1 text-sm text-white/80">
              Explore Telugu worship songs
            </p>
          </div>
          <span className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/40 text-xl text-white transition group-hover:bg-white group-hover:text-[#24103F]">
            →
          </span>
        </div>
      </Link>

      <Link
        href="/songs?language=en"
        className="group relative isolate flex min-h-[150px] items-end overflow-hidden rounded-2xl border border-[#E9E2D5] p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:min-h-[175px] sm:p-6"
      >
        <Image
          src="/images/english-worship.jpg"
          alt="English Christian worship"
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          className="absolute inset-0 -z-20 object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#160B2B]/90 via-[#160B2B]/55 to-transparent" />
        <div className="flex w-full items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#E7C982]">
              English collection
            </p>
            <h3 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
              English Songs
            </h3>
            <p className="mt-1 text-sm text-white/80">
              Explore English worship songs
            </p>
          </div>
          <span className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/40 text-xl text-white transition group-hover:bg-white group-hover:text-[#24103F]">
            →
          </span>
        </div>
      </Link>
    </div>
  </div>
</section>


{/* Features */}
<section
  id="features"
  className="relative isolate overflow-hidden border-y border-[#E9E1D3] py-16 sm:py-20"
>
  <Image
    src="/images/english-worship.jpg"
    alt="Christian worship atmosphere"
    fill
    sizes="100vw"
    className="absolute inset-0 -z-20 object-cover"
  />
  <div className="absolute inset-0 -z-10 bg-[#FAF8F4]/95" />

  <div className="mx-auto max-w-7xl px-5 lg:px-8">
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <p className="text-[10px] font-bold tracking-[0.25em] text-[#A17B38]">
        {isTelugu ? 'WORSHIPVERSE ప్రత్యేకతలు' : 'MADE FOR YOUR WORSHIP'}
      </p>

      <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-[#32165C] sm:text-4xl">
        {isTelugu ? 'ఆరాధనకు మరింత దగ్గరగా' : 'A Better Way to Worship'}
      </h2>

      <p className="mt-4 text-sm leading-7 text-gray-600">
        {isTelugu
          ? 'మీ ఆరాధన అనుభవాన్ని సులభంగా మరియు ప్రత్యేకంగా మార్చే సదుపాయాలు.'
          : 'Thoughtful features to make your worship experience simple and meaningful.'}
      </p>
    </div>

    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {features.map((feature, index) => {
        const featureImages = [
          '/images/telugu-worship.jpg',
          '/images/english-worship.jpg',
          '/images/worshipverse-hero-artwork.png',
          '/images/telugu-worship.jpg',
        ];

        return (
          <div
            key={feature.title}
            className="group overflow-hidden rounded-2xl border border-[#E9E1D3] bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl"
          >
            <div className="relative h-36 overflow-hidden">
              <Image
                src={featureImages[index]}
                alt={feature.title}
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover transition duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#24103F]/80 to-transparent" />
              <span className="absolute bottom-3 left-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#D8B66C] text-2xl text-[#24103F]">
                {feature.icon}
              </span>
            </div>

            <div className="p-5">
              <h3 className="text-lg font-bold text-[#32165C]">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-gray-500">
                {feature.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  </div>
</section>

{/* Call to action */}
<section className="relative isolate overflow-hidden px-5 py-24 text-center text-white sm:py-32">
  <Image
    src="/images/worshipverse-hero-artwork.png"
    alt="Cross illuminated by golden sunrise"
    fill
    sizes="100vw"
    className="absolute inset-0 -z-20 object-cover object-center"
  />

  <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#170A27]/95 via-[#24103F]/85 to-[#170A27]/75" />

  <div className="relative mx-auto max-w-3xl">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#D8B66C]/60 bg-white/10 font-serif text-4xl text-[#E8C77E] backdrop-blur-sm">
      ✦
    </div>

    <p className="mt-7 text-[10px] font-bold tracking-[0.3em] text-[#D8B66C]">
      SHARON A.G. CHURCH
    </p>

    <h2 className="mt-5 font-serif text-3xl font-bold tracking-tight sm:text-5xl">
      {isTelugu ? 'ఆరాధనలో మాతో చేరండి' : 'Let’s Worship Together'}
    </h2>

    <p className="mx-auto mt-5 max-w-xl text-sm leading-8 text-white/80 sm:text-base">
      {isTelugu
        ? 'మీ ఆరాధన ప్రయాణాన్ని WorshipVerse తో ప్రారంభించండి.'
        : 'Discover songs, lift your voice and make every moment an offering of praise.'}
    </p>

    <Link
      href="/songs?language=te"
      className="mt-9 inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#E8C77E] to-[#D8B66C] px-8 py-4 text-sm font-bold text-[#24103F] shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
    >
      {isTelugu ? 'ఇప్పుడే ప్రారంభించండి' : 'Start Exploring'}
      <span className="text-lg">→</span>
    </Link>
  </div>
</section>


      {/* Footer */}
      <footer className="bg-[#170A27] px-5 py-10 text-white/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">

          <div>
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/images/worshipverse-logo.png"
                alt="WorshipVerse logo"
                width={42}
                height={42}
                className="rounded-lg object-contain"
              />
              <span className="font-serif text-xl font-bold text-[#E8C77E]">
                WorshipVerse
              </span>
            </Link>

            <p className="mt-3 text-xs">
              Every song, a prayer. Every lyric, an offering.
            </p>
            <p className="mt-1 text-[10px] tracking-wider text-[#D8B66C]/70">
              SHARON A.G. CHURCH
            </p>
          </div>

          <div className="flex flex-wrap gap-x-7 gap-y-3 text-xs">
            <Link href="/" className="transition hover:text-[#D8B66C]">Home</Link>
            <Link href="/songs?language=te" className="transition hover:text-[#D8B66C]">Songs</Link>
            <Link href="#features" className="transition hover:text-[#D8B66C]">Features</Link>
            <Link href="/download" className="transition hover:text-[#D8B66C]">Download</Link>
            <Link href="/login" className="transition hover:text-[#D8B66C]">Sign In</Link>
          </div>

          <Link
            href="/download"
            className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-gradient-to-r from-[#E8C77E] to-[#D8B66C] px-6 py-3 text-xs font-bold text-[#24103F] transition hover:-translate-y-0.5 hover:shadow-lg md:self-auto"
          >
            ↓ {isTelugu ? 'Android కోసం డౌన్‌లోడ్' : 'Download for Android'}
          </Link>
        </div>

        <div className="mx-auto mt-9 max-w-7xl border-t border-white/10 pt-6 text-center text-[11px]">
          © 2026 WorshipVerse · SHARON A.G. CHURCH. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
