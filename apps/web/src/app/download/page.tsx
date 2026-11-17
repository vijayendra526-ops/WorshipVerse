
import Image from 'next/image';
import Link from 'next/link';

const features = [
  {
    icon: 'â™«',
    title: 'Worship Songs',
    description: 'Explore Telugu and English Christian worship songs.',
  },
  {
    icon: 'âŒ•',
    title: 'Voice Search',
    description: 'Find your favourite worship songs using your voice.',
  },
  {
    icon: 'â™¡',
    title: 'Your Favourites',
    description: 'Keep the songs you love together in one place.',
  },
  {
    icon: 'â†“',
    title: 'Offline Access',
    description: 'Read songs you have downloaded without internet.',
  },
];

const installationSteps = [
  {
    number: '01',
    title: 'Download the APK',
    description: 'Tap the Download for Android button.',
  },
  {
    number: '02',
    title: 'Open the downloaded file',
    description: 'Find WorshipVerse.apk in your phoneâ€™s Downloads folder.',
  },
  {
    number: '03',
    title: 'Allow installation',
    description:
      'If Android asks, allow your browser or file manager to install this app.',
  },
  {
    number: '04',
    title: 'Open WorshipVerse',
    description:
      'Complete installation and start exploring worship songs.',
  },
];

export default function DownloadPage() {
  return (
    <main
      className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat text-white"
      style={{
        backgroundImage:
          "linear-gradient(rgba(36, 16, 63, 0.78), rgba(36, 16, 63, 0.88)), url('/images/worship-background.jpg')",
      }}
    >
      <header className="border-b border-white/15 bg-[#24103F]/75 px-5 py-4 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/worshipverse-logo.png"
              alt="WorshipVerse logo"
              width={44}
              height={44}
              className="rounded-xl object-contain"
            />

            <div>
              <h1 className="text-lg font-bold">
                <span className="text-[#D8B66C]">Worship</span>
                Verse
              </h1>
              <p className="text-[9px] tracking-[0.16em] text-[#F1D99D]">
                SHARON A.G. CHURCH
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="rounded-xl border border-[#D8B66C]/50 px-4 py-2 text-sm font-semibold text-[#F1D99D] transition hover:bg-white/10"
          >
            Home
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-9 sm:px-6 sm:py-12">
        <section className="overflow-hidden rounded-3xl border border-white/20 bg-[#24103F]/70 shadow-2xl backdrop-blur-md">
          <div className="grid items-center gap-6 p-6 sm:p-9 md:grid-cols-[1fr_240px]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D8B66C]">
                Worship â€¢ Praise â€¢ Songs
              </p>

              <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
                WorshipVerse
                <span className="mt-1 block text-[#D8B66C]">
                  For Android
                </span>
              </h2>

              <p className="mt-4 max-w-lg text-sm leading-7 text-white/80">
                Take your worship journey wherever you go.
                Discover Telugu and English Christian songs,
                search using your voice and enjoy downloaded
                lyrics offline.
              </p>

              <a
                href="/downloads/worshipverse.apk"
                download="WorshipVerse.apk"
                className="mt-7 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-[#D8B66C] px-7 py-4 text-sm font-bold text-[#24103F] shadow-lg transition hover:bg-[#E8CA83] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D8B66C] sm:w-auto"
              >
                <span aria-hidden="true" className="text-xl">
                  â†“
                </span>
                Download for Android
              </a>

              <p className="mt-3 text-xs text-white/60">
                Android APK Â· Version 1.0.0
              </p>

              <p className="mt-1 text-xs text-white/50">
                Direct download from the WorshipVerse website
              </p>
            </div>

            <div className="flex justify-center">
              <div className="flex h-48 w-48 items-center justify-center rounded-3xl border border-[#D8B66C]/40 bg-white/10 p-7 shadow-xl sm:h-56 sm:w-56">
                <Image
                  src="/images/worshipverse-logo.png"
                  alt="WorshipVerse Android application"
                  width={160}
                  height={160}
                  className="h-auto w-full object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D8B66C]">
              Your Worship Companion
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Everything in One Place
            </h2>

            <p className="mt-2 text-sm text-white/70">
              WorshipVerse features designed for your daily worship.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="flex items-start gap-4 rounded-2xl border border-[#E9E1D3]/80 bg-[#FAF8F4]/95 p-5 text-[#24103F] shadow-lg"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F1E6CC] text-2xl font-bold text-[#80601F]">
                  {feature.icon}
                </div>

                <div>
                  <h3 className="font-bold text-[#32165C]">
                    {feature.title}
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-[#E9E1D3]/80 bg-[#FAF8F4]/95 p-5 text-[#24103F] shadow-xl sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A17B38]">
            Installation Guide
          </p>

          <h2 className="mt-2 text-2xl font-bold text-[#32165C]">
            How to Install WorshipVerse
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            Follow these steps on your Android phone.
          </p>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {installationSteps.map((step) => (
              <div
                key={step.number}
                className="flex gap-4 rounded-2xl border border-[#E9E1D3] bg-white p-4"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#32165C] text-sm font-bold text-[#D8B66C]">
                  {step.number}
                </div>

                <div>
                  <h3 className="font-bold text-[#32165C]">
                    {step.title}
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7 rounded-xl border border-[#D8B66C]/40 bg-[#F4EFF9] p-4">
            <p className="text-sm font-semibold text-[#32165C]">
              Important installation note
            </p>

            <p className="mt-2 text-xs leading-6 text-gray-600">
              WorshipVerse is currently distributed directly
              through this website rather than Google Play.
              Android may ask you to approve installation from
              your browser or file manager. Only install the APK
              from the official WorshipVerse website, and disable
              that installation permission again afterwards.
            </p>
          </div>

          <div className="mt-7 text-center">
            <a
              href="/downloads/worshipverse.apk"
              download="WorshipVerse.apk"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#32165C] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-[#48247C] sm:w-auto"
            >
              â†“ Download WorshipVerse APK
            </a>
          </div>
        </section>

        <div className="mt-8 text-center">
          <Link
            href="/songs"
            className="text-sm font-semibold text-[#F1D99D] hover:underline"
          >
            Browse Worship Songs Online
          </Link>
        </div>
      </div>

      <footer className="border-t border-white/15 bg-[#24103F]/70 px-5 py-6 text-center">
        <p className="font-bold">
          <span className="text-[#D8B66C]">Worship</span>Verse
        </p>

        <p className="mt-2 text-xs text-[#F1D99D]">
          Every Song, A Prayer. Every Verse, A Praise.
        </p>

        <p className="mt-3 text-xs text-white/60">
          Â© 2026 WorshipVerse Â· SHARON A.G. CHURCH
        </p>
      </footer>
    </main>
  );
}

