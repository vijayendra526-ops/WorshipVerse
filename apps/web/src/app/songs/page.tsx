
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VoiceSearchForm from "./VoiceSearchForm";
import DownloadAllSongs from "./DownloadAllSongs";
import FavouriteButton from "./FavouriteButton";

export const instant = false;

type SongsPageProps = {
  searchParams: Promise<{
    language?: string;
    q?: string;
  }>;
};

export default async function SongsPage({ searchParams }: SongsPageProps) {
  const { language, q } = await searchParams;

  const selectedLanguage = language === "te" ? "te" : "en";
  const search = q?.trim() ?? "";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let query = supabase
    .from("songs")
    .select("id, title, artist, language, lyrics, youtube_url, created_at")
    .eq("language", selectedLanguage)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  const { data: songs, error } = await query;

  const isTelugu = selectedLanguage === "te";

  return (
    <main className="min-h-screen bg-[#FAF8F4] text-[#24103F]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#24103F]/95 px-5 py-4 text-white shadow-lg backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold tracking-wide"
          >
            <span className="text-2xl text-[#D8B66C]">✦</span>
            WorshipVerse
          </Link>

          <Link
            href="/"
            className="rounded-full border border-[#D8B66C]/50 px-5 py-2 text-sm font-medium text-[#E8D5A5] transition hover:bg-[#D8B66C] hover:text-[#24103F]"
          >
            Home
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Page introduction */}
        <div className="relative mb-9 overflow-hidden rounded-3xl bg-gradient-to-br from-[#32165C] via-[#3B1B69] to-[#24103F] p-7 text-white shadow-xl sm:p-10">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-[#D8B66C]/20" />
          <div className="pointer-events-none absolute -right-4 -top-12 h-48 w-48 rounded-full border border-[#D8B66C]/20" />

          <div className="relative z-10">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-[#D8B66C]">
              WorshipVerse Library
            </p>

            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
              {isTelugu ? "తెలుగు ఆరాధన పాటలు" : "Songs of Worship"}
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-7 text-purple-100 sm:text-base">
              {isTelugu
                ? "మీ హృదయాన్ని దేవుని ఆరాధనలో నింపే తెలుగు పాటలను అన్వేషించండి."
                : "Discover beautiful worship songs and let every lyric bring you closer to God."}
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#D8B66C]/40 bg-white/5 px-4 py-2 text-sm text-[#E8D5A5]">
              <span>✦</span>
              {songs?.length ?? 0} {isTelugu ? "పాటలు" : "Songs"}
            </div>
          </div>
        </div>

        {/* Language selector */}
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#32165C]">
              {isTelugu ? "పాటల సేకరణ" : "Explore Songs"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {isTelugu
                ? "మీకు ఇష్టమైన పాటలను ఎంచుకోండి"
                : "Find your favourite worship songs"}
            </p>
          </div>

          <div className="flex rounded-full border border-[#E8E0D2] bg-white p-1 shadow-sm">
            <Link
              href="/songs?language=te"
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                isTelugu
                  ? "bg-[#32165C] text-white shadow-md"
                  : "text-gray-600 hover:text-[#32165C]"
              }`}
            >
              తెలుగు
            </Link>

            <Link
              href="/songs?language=en"
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                !isTelugu
                  ? "bg-[#32165C] text-white shadow-md"
                  : "text-gray-600 hover:text-[#32165C]"
              }`}
            >
              English
            </Link>
          </div>
        </div>

        {/* Voice search */}
        <div className="mb-4">
          <VoiceSearchForm
            language={selectedLanguage}
            initialQuery={search}
          />
        </div>

        {/* Download songs */}
        <div className="mb-9">
          <DownloadAllSongs />
        </div>

        {/* Song cards */}
        <div>
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
              Unable to load songs: {error.message}
            </div>
          ) : songs && songs.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {songs.map((song) => (
                <article
                  key={song.id}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-[#E8E0D2] bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#D8B66C] hover:shadow-lg"
                >
                  {/* Song name - opens full-screen lyrics */}
                  <Link
                    href={`/songs/${song.id}`}
                    className="flex min-w-0 flex-1 items-center gap-4"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#32165C] to-[#24103F] text-2xl text-[#D8B66C] shadow-sm transition group-hover:scale-105">
                      ♪
                    </div>

                    <div className="min-w-0">
                      <h2 className="break-words text-base font-bold text-[#32165C] transition group-hover:text-[#9B7A3C] sm:text-lg">
                        {song.title}
                      </h2>

                      <p className="mt-1 truncate text-sm text-gray-500">
                        {song.artist || "WorshipVerse"}
                      </p>
                    </div>
                  </Link>

                  {/* Favourite button */}
                  <div className="shrink-0">
                    <FavouriteButton songId={song.id} />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#D8B66C] bg-white p-10 text-center">
              <div className="text-4xl text-[#9B7A3C]">♪</div>

              <h2 className="mt-4 text-xl font-bold text-[#32165C]">
                {isTelugu ? "పాటలు కనుగొనబడలేదు" : "No Songs Found"}
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                {search
                  ? "Try another song title."
                  : "No songs have been published in this language yet."}
              </p>

              {search && (
                <Link
                  href={`/songs?language=${selectedLanguage}`}
                  className="mt-5 inline-block rounded-full bg-[#32165C] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#24103F]"
                >
                  Clear Search
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E8E0D2] bg-white px-5 py-7 text-center">
        <p className="text-sm font-semibold text-[#32165C]">
          WorshipVerse <span className="text-[#D8B66C]">✦</span>
        </p>

        <p className="mt-1 text-xs text-gray-500">
          Every song, a prayer. Every lyric, an offering.
        </p>
      </footer>
    </main>
  );
}
