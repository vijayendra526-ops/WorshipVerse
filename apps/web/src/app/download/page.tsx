
import Image from 'next/image';
import Link from 'next/link';

export default function DownloadPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F4] text-[#24103F]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#24103F] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/worshipverse-logo.png"
              alt="WorshipVerse logo"
              width={48}
              height={48}
              className="rounded-xl object-contain"
            />

            <div>
              <h1 className="text-xl font-bold">WorshipVerse</h1>
              <p className="text-[9px] tracking-[0.2em] text-[#D8B66C]">
                SHARON A.G. CHURCH
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="text-sm text-white/70 transition hover:text-[#D8B66C]"
          >
            Home →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#24103F] px-5 py-20 text-center text-white sm:py-28">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#65409A]/25 blur-[100px]" />

        <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[#D8B66C]/10 blur-[100px]" />

        <div className="relative mx-auto max-w-3xl">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl border border-[#D8B66C]/40 bg-white/[0.06] shadow-xl">
            <Image
              src="/images/worshipverse-logo.png"
              alt="WorshipVerse app"
              width={72}
              height={72}
              className="object-contain"
            />
          </div>

          <p className="mt-8 text-xs font-semibold tracking-[0.3em] text-[#D8B66C]">
            WORSHIP • PRAISE • SONGS
          </p>

          <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-6xl">
            WorshipVerse
            <span className="mt-2 block text-[#D8B66C]">
              Now on Android
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-sm leading-8 text-white/65 sm:text-base">
            Take your worship journey wherever you go.
            Explore Telugu and English Christian worship songs,
            search with your voice and access downloaded songs offline.
          </p>

          {/* APK Download Button */}
          <a
            href="/downloads/worshipverse.apk"
            download="WorshipVerse.apk"
            className="mt-9 inline-flex items-center justify-center gap-3 rounded-full bg-[#D8B66C] px-9 py-4 text-sm font-bold text-[#24103F] shadow-lg transition hover:-translate-y-1 hover:bg-[#E8CA83] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D8B66C]"
          >
            <span className="text-xl" aria-hidden="true">↓</span>
            Download for Android
          </a>

          <p className="mt-4 text-xs text-white/45">
            Android APK · Version 1.0.0
          </p>

          <p className="mt-2 text-[11px] text-white/35">
            Official WorshipVerse Android application
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="text-center">
          <p className="text-[10px] font-bold tracking-[0.25em] text-[#A17B38]">
            YOUR WORSHIP COMPANION
          </p>

          <h2 className="mt-3 text-3xl font-semibold text-[#32165C]">
            Everything in one place
          </h2>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['♫', 'Worship Songs', 'Explore Telugu and English songs.'],
            ['⌕', 'Voice Search', 'Find songs using your voice.'],
            ['♡', 'Your Favourites', 'Keep your favourite songs together.'],
            ['↓', 'Offline Access', 'Access songs you have downloaded.'],
          ].map(([icon, title, description]) => (
            <div
              key={title}
              className="rounded-2xl border border-[#E9E1D3] bg-white p-7 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="text-4xl text-[#A17B38]">{icon}</div>

              <h3 className="mt-5 font-semibold text-[#32165C]">
                {title}
              </h3>

              <p className="mt-3 text-sm leading-7 text-gray-500">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Installation Instructions */}
      <section className="bg-white px-5 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-semibold text-[#32165C]">
            How to install
          </h2>

          <div className="mt-10 space-y-6">
            {[
              [
                '01',
                'Download the APK',
                'Tap the Download for Android button above.',
              ],
              [
                '02',
                'Open the downloaded file',
                'Find WorshipVerse.apk in your phone’s Downloads folder.',
              ],
              [
                '03',
                'Allow installation',
                'If prompted, allow your browser or file manager to install unknown apps.',
              ],
              [
                '04',
                'Start worshipping',
                'Complete installation and open WorshipVerse.',
              ],
            ].map(([number, title, description]) => (
              <div key={number} className="flex gap-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#24103F] text-sm font-bold text-[#D8B66C]">
                  {number}
                </div>

                <div>
                  <h3 className="font-semibold text-[#32165C]">
                    {title}
                  </h3>

                  <p className="mt-1 text-sm leading-7 text-gray-500">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-10 rounded-xl bg-[#FAF8F4] p-5 text-xs leading-6 text-gray-500">
            Note: WorshipVerse is distributed directly through this website.
            Android may ask you to approve installation from this source.
            Only install APKs obtained from the official WorshipVerse website.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1B0D2D] px-5 py-9 text-center text-white/50">
        <p className="font-semibold text-white">WorshipVerse</p>

        <p className="mt-2 text-xs text-[#D8B66C]">
          Every Song, A Prayer. Every Verse, A Praise.
        </p>

        <p className="mt-5 text-xs">
          © 2026 WorshipVerse · SHARON A.G. CHURCH
        </p>

        <Link
          href="/"
          className="mt-5 inline-block text-xs text-[#D8B66C] transition hover:text-white"
        >
          Back to Home
        </Link>
      </footer>
    </main>
  );
}
