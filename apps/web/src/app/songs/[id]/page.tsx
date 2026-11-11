
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FavouriteButton from "../FavouriteButton";

export const instant = false;

type SongDetailProps = {
  params: Promise<{ id: string }>;
};

export default async function SongDetailPage({
  params,
}: SongDetailProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: song, error } = await supabase
    .from("songs")
    .select("id, title, artist, language, lyrics, youtube_url")
    .eq("id", id)
    .single();

  if (error || !song) notFound();

  const isTelugu = song.language === "te";

  return (
    <main className="min-h-screen bg-white text-[#333333]">

      {/* Navigation */}
      <header className="sticky top-0 z-30 border-b border-[#EAE5DC] bg-white/95 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between">

          <Link
            href={`/songs?language=${song.language}`}
            className="flex items-center gap-2 text-sm font-medium text-[#32165C] transition hover:text-[#9B7A3C]"
          >
            <span className="text-xl">←</span>
            {isTelugu ? "పాటలకు తిరిగి వెళ్ళండి" : "Back to Songs"}
          </Link>

          <Link
            href="/"
            className="text-lg font-bold tracking-wide text-[#32165C]"
          >
            <span className="mr-1 text-[#D8B66C]">✦</span>
            WorshipVerse
          </Link>

        </div>
      </header>

      {/* Full-screen song content */}
      <section className="mx-auto flex min-h-[calc(100svh-65px)] max-w-5xl flex-col px-5 py-8 sm:px-10 sm:py-12">

        {/* Song heading */}
        <div className="border-b border-[#EAE5DC] pb-7">

          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9B7A3C]">
            {isTelugu
              ? "తెలుగు ఆరాధన పాట"
              : "WorshipVerse • Worship Song"}
          </p>

          <div className="mt-5 flex items-start justify-between gap-4">

            <div className="min-w-0">

              <h1 className="break-words text-3xl font-bold leading-tight tracking-tight text-[#32165C] sm:text-5xl">
                {song.title}
              </h1>

              <p className="mt-3 text-base text-gray-500">
                {song.artist || "WorshipVerse"}
              </p>

            </div>

            {/* Favourite */}
            <div className="shrink-0 rounded-full border border-[#EAE5DC] bg-[#FAF8F4] p-2">
              <FavouriteButton songId={song.id} />
            </div>

          </div>

          <div className="mt-6 h-[2px] w-16 rounded-full bg-[#D8B66C]" />

        </div>

        {/* Lyrics */}
        <div className="flex-1 py-9 sm:py-12">

          <div className="mb-7 flex items-center gap-3">

            <span className="h-px w-8 bg-[#D8B66C]" />

            <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-[#9B7A3C]">
              {isTelugu ? "పాట సాహిత్యం" : "Song Lyrics"}
            </h2>

          </div>

          <p className="whitespace-pre-wrap break-words text-lg leading-9 text-[#333333] sm:text-xl sm:leading-[2.5rem]">
            {song.lyrics ||
              (isTelugu
                ? "సాహిత్యం అందుబాటులో లేదు."
                : "Lyrics are not available yet.")}
          </p>

        </div>

        {/* Bottom actions */}
        <div className="mt-auto border-t border-[#EAE5DC] pt-6">

          {song.youtube_url && (
            <a
              href={song.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#32165C] px-5 py-4 font-semibold text-white shadow-sm transition hover:bg-[#24103F] hover:shadow-lg sm:mx-auto sm:max-w-sm"
            >
              <span className="text-lg text-[#D8B66C]">▶</span>

              {isTelugu
                ? "YouTube లో పాట వినండి"
                : "Watch on YouTube"}
            </a>
          )}

          <p className="mt-6 text-center text-xs tracking-wide text-gray-400">
            WorshipVerse <span className="text-[#D8B66C]">✦</span> Every song, a prayer.
          </p>

        </div>

      </section>
    </main>
  );
}
