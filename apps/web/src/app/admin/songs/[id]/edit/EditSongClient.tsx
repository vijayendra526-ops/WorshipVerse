
'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  ChevronRight,
  Music2,
  Pencil,
  FileText,
  Languages,
  Video,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  ArrowLeft,
  BookOpen,
  ShieldCheck,
  Save,
  CalendarCheck,
} from 'lucide-react';

type SongLanguage = 'te' | 'en';

const inputClass =
  'w-full rounded-xl border border-[#E5DFD5] bg-[#FAF8F4] px-4 py-3.5 text-sm text-[#32165C] outline-none transition placeholder:text-gray-400 focus:border-[#D8B66C] focus:ring-2 focus:ring-[#D8B66C]/20';

const textareaClass =
  'w-full resize-y rounded-xl border border-[#E5DFD5] bg-[#FAF8F4] px-4 py-3.5 text-sm leading-7 text-[#32165C] outline-none transition placeholder:text-gray-400 focus:border-[#D8B66C] focus:ring-2 focus:ring-[#D8B66C]/20';

export default function EditSongClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [language, setLanguage] =
    useState<SongLanguage>('te');
  const [lyrics, setLyrics] = useState('');
  const [lyricsTransliteration, setLyricsTransliteration] =
    useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const songId = params.id;

  // Load existing song details from Supabase.
  useEffect(() => {
    let cancelled = false;

    async function loadSong() {
      setLoading(true);
      setLoadError('');

      try {
        if (!songId) {
          throw new Error('Invalid song ID.');
        }

        const supabase = createClient();

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace('/login');
          return;
        }

        const role = user.app_metadata?.role;

        if (
          role !== 'admin' &&
          role !== 'super_admin'
        ) {
          router.replace('/');
          return;
        }

        const { data: song, error } = await supabase
          .from('songs')
          .select(
            'title, language, lyrics, lyrics_transliteration, youtube_url'
          )
          .eq('id', songId)
          .single();

        if (error) throw error;

        if (!song) {
          throw new Error('Song not found.');
        }

        if (cancelled) return;

        setTitle(song.title ?? '');
        setLanguage(
          song.language === 'en' ? 'en' : 'te'
        );
        setLyrics(song.lyrics ?? '');
        setLyricsTransliteration(
          song.lyrics_transliteration ?? ''
        );
        setYoutubeUrl(song.youtube_url ?? '');
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : 'Unable to load song.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSong();

    return () => {
      cancelled = true;
    };
  }, [songId, router]);

  function markEdited() {
    if (success || message) {
      setSuccess(false);
      setMessage('');
    }
  }

  const titleReady = title.trim().length > 0;
  const lyricsReady = lyrics.trim().length > 0;
  const transliterationReady =
    language === 'en' ||
    lyricsTransliteration.trim().length > 0;

  const readyToSave =
    titleReady && lyricsReady && transliterationReady;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setMessage('');
    setSuccess(false);

    try {
      if (!songId) {
        throw new Error('Invalid song ID.');
      }

      if (!title.trim()) {
        throw new Error('Please enter the song title.');
      }

      if (!lyrics.trim()) {
        throw new Error('Please enter the song lyrics.');
      }

      if (
        language === 'te' &&
        !lyricsTransliteration.trim()
      ) {
        throw new Error(
          'Please enter the English transliteration of Telugu lyrics.'
        );
      }

      // Validate the optional YouTube URL.
      const cleanYoutubeUrl = youtubeUrl.trim();

      if (cleanYoutubeUrl) {
        let parsedUrl: URL;

        try {
          parsedUrl = new URL(cleanYoutubeUrl);
        } catch {
          throw new Error(
            'Please enter a valid YouTube link.'
          );
        }

        const allowedHosts = [
          'youtube.com',
          'www.youtube.com',
          'm.youtube.com',
          'youtu.be',
        ];

        if (
          !['http:', 'https:'].includes(
            parsedUrl.protocol
          ) ||
          !allowedHosts.includes(
            parsedUrl.hostname.toLowerCase()
          )
        ) {
          throw new Error(
            'Please enter a valid YouTube link.'
          );
        }
      }

      const supabase = createClient();

      // Verify admin access before saving.
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Please sign in again.');
      }

      const role = user.app_metadata?.role;

      if (
        role !== 'admin' &&
        role !== 'super_admin'
      ) {
        throw new Error(
          'You are not authorized to edit songs.'
        );
      }

      // Update the existing song only.
      const { data: updatedSong, error } = await supabase
        .from('songs')
        .update({
          title: title.trim(),
          language,
          lyrics: lyrics.trim(),
          lyrics_transliteration:
            language === 'te'
              ? lyricsTransliteration.trim()
              : null,
          youtube_url: cleanYoutubeUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', songId)
        .select('id')
        .maybeSingle();

      if (error) throw error;

      if (!updatedSong) {
        throw new Error(
          'Song could not be updated. Check your permissions.'
        );
      }

      setSuccess(true);
      setMessage('Song updated successfully!');

      router.refresh();
    } catch (error) {
      setSuccess(false);
      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to update song.'
      );
    } finally {
      setSaving(false);
    }
  }

  // Loading screen inside the shared admin layout.
  if (loading) {
    return (
      <main className="flex min-h-[75vh] items-center justify-center px-5 text-white">
        <div
          role="status"
          className="w-full max-w-md rounded-2xl border border-[#D8B66C]/20 bg-[#321950] p-8 text-center shadow-xl"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D8B66C]/10 text-[#D8B66C]">
            <Music2 size={28} />
          </div>

          <h1 className="mt-5 text-xl font-bold">
            Loading Song
          </h1>

          <p className="mt-2 text-sm text-white/55">
            Fetching your worship song details...
          </p>

          <LoaderCircle
            size={23}
            className="mx-auto mt-6 animate-spin text-[#D8B66C]"
          />
        </div>
      </main>
    );
  }

  // Loading errors.
  if (loadError) {
    return (
      <main className="flex min-h-[75vh] items-center justify-center px-5 text-white">
        <div className="w-full max-w-md rounded-2xl border border-red-400/20 bg-[#321950] p-8 text-center">
          <AlertCircle
            size={32}
            className="mx-auto text-red-300"
          />

          <h1 className="mt-4 text-xl font-bold">
            Unable to Load Song
          </h1>

          <p
            role="alert"
            className="mt-3 text-sm text-white/65"
          >
            {loadError}
          </p>

          <Link
            href="/admin/songs"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#D8B66C] px-5 py-3 text-sm font-bold text-[#24103F]"
          >
            <ArrowLeft size={16} />
            Back to Manage Songs
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen min-w-0 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#24103F]/55 px-4 py-5 backdrop-blur-xl sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center gap-2 text-[11px] text-white/45"
            >
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 hover:text-[#D8B66C]"
              >
                <LayoutDashboard size={13} />
                Dashboard
              </Link>

              <ChevronRight size={13} />

              <Link
                href="/admin/songs"
                className="hover:text-[#D8B66C]"
              >
                Manage Songs
              </Link>

              <ChevronRight size={13} />

              <span className="font-semibold text-[#D8B66C]">
                Edit Song
              </span>
            </nav>

            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-[29px]">
              Edit Song
            </h1>

            <p className="mt-1 text-xs text-white/55 sm:text-sm">
              Update your song details and worship lyrics.
            </p>
          </div>

          <Link
            href="/admin/songs"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-xs font-semibold text-white transition hover:bg-white/10"
          >
            <ArrowLeft size={16} />
            Manage Songs
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1180px] space-y-6 px-4 py-6 sm:px-7 sm:py-8">
        {/* Introduction */}
        <section className="relative overflow-hidden rounded-2xl border border-[#D8B66C]/20 bg-gradient-to-r from-[#39205C] via-[#321950] to-[#27133F] p-5 shadow-lg sm:p-6">
          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#D8B66C]/25 bg-[#D8B66C]/10 text-[#D8B66C]">
              <Sparkles size={22} />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D8B66C]">
                WorshipVerse Song Editor
              </p>

              <h2 className="mt-1.5 text-lg font-bold sm:text-xl">
                Every Verse, A Praise.
              </h2>

              <p className="mt-1 text-xs leading-5 text-white/60 sm:text-sm">
                Refine your published worship song while
                keeping its meaning and lyrics intact.
              </p>
            </div>
          </div>
        </section>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
          {/* Edit form */}
          <form
            onSubmit={handleSubmit}
            className="min-w-0 overflow-hidden rounded-2xl border border-[#EAE2D7] bg-[#FAF8F4] text-[#24103F] shadow-xl"
          >
            {/* Song details */}
            <section className="border-b border-[#EAE3DA] p-5 sm:p-7">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1E9F7] text-[#7043A1]">
                  <Pencil size={19} />
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#32165C]">
                    Song Details
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Edit the song title and language.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="edit-song-title"
                    className="mb-2 block text-sm font-bold text-[#32165C]"
                  >
                    Song Title
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <input
                    id="edit-song-title"
                    type="text"
                    required
                    value={title}
                    onChange={(event) => {
                      markEdited();
                      setTitle(event.target.value);
                    }}
                    placeholder="Enter the worship song title"
                    className={inputClass}
                  />
                </div>

                <div>
                  <p
                    id="edit-language-label"
                    className="mb-3 text-sm font-bold text-[#32165C]"
                  >
                    Song Language
                    <span className="ml-1 text-red-500">*</span>
                  </p>

                  <div
                    role="group"
                    aria-labelledby="edit-language-label"
                    className="grid grid-cols-2 gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        markEdited();
                        setLanguage('te');
                      }}
                      aria-pressed={language === 'te'}
                      className={`rounded-xl border p-4 text-left transition ${
                        language === 'te'
                          ? 'border-[#D8B66C] bg-[#32165C] text-white shadow-md'
                          : 'border-[#E5DFD5] bg-white text-[#32165C] hover:border-[#D8B66C]'
                      }`}
                    >
                      <Languages
                        size={19}
                        className={
                          language === 'te'
                            ? 'text-[#D8B66C]'
                            : 'text-[#8A6E3B]'
                        }
                      />

                      <span className="mt-3 block text-sm font-bold">
                        తెలుగు
                      </span>

                      <span className="mt-1 block text-xs opacity-70">
                        Telugu
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        markEdited();
                        setLanguage('en');
                      }}
                      aria-pressed={language === 'en'}
                      className={`rounded-xl border p-4 text-left transition ${
                        language === 'en'
                          ? 'border-[#D8B66C] bg-[#32165C] text-white shadow-md'
                          : 'border-[#E5DFD5] bg-white text-[#32165C] hover:border-[#D8B66C]'
                      }`}
                    >
                      <Languages
                        size={19}
                        className={
                          language === 'en'
                            ? 'text-[#D8B66C]'
                            : 'text-[#8A6E3B]'
                        }
                      />

                      <span className="mt-3 block text-sm font-bold">
                        English
                      </span>

                      <span className="mt-1 block text-xs opacity-70">
                        English Songs
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Lyrics section */}
            <section className="border-b border-[#EAE3DA] p-5 sm:p-7">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7ECD5] text-[#A17B38]">
                  <FileText size={19} />
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#32165C]">
                    Song Lyrics
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Update lyrics while preserving verse formatting.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="edit-song-lyrics"
                    className="mb-2 block text-sm font-bold text-[#32165C]"
                  >
                    {language === 'te'
                      ? 'Telugu Lyrics'
                      : 'English Lyrics'}

                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <textarea
                    id="edit-song-lyrics"
                    required
                    rows={12}
                    value={lyrics}
                    onChange={(event) => {
                      markEdited();
                      setLyrics(event.target.value);
                    }}
                    placeholder={
                      language === 'te'
                        ? 'ఇక్కడ పాట సాహిత్యాన్ని నమోదు చేయండి...'
                        : 'Enter the original song lyrics...'
                    }
                    className={textareaClass}
                  />

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
                    <span>
                      Preserve the original line breaks.
                    </span>

                    <span>
                      {lyrics.length} characters
                    </span>
                  </div>
                </div>

                {language === 'te' && (
                  <div>
                    <label
                      htmlFor="edit-song-transliteration"
                      className="mb-2 block text-sm font-bold text-[#32165C]"
                    >
                      English Transliteration
                      <span className="ml-1 text-red-500">*</span>
                    </label>

                    <p className="mb-3 text-xs leading-5 text-gray-500">
                      Enter the same Telugu lyrics using
                      English letters. Do not translate
                      them into English.
                    </p>

                    <textarea
                      id="edit-song-transliteration"
                      required
                      rows={12}
                      value={lyricsTransliteration}
                      onChange={(event) => {
                        markEdited();
                        setLyricsTransliteration(
                          event.target.value
                        );
                      }}
                      placeholder={
                        'Example:\nYesu Naa Rakshakudu\nNannu Preminchina Devudu'
                      }
                      className={textareaClass}
                    />

                    <p className="mt-2 text-xs text-gray-400">
                      Keep the same line breaks as the
                      Telugu lyrics.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* YouTube section */}
            <section className="border-b border-[#EAE3DA] p-5 sm:p-7">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FCE8E7] text-[#B94C48]">
                  <Video size={20} />
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#32165C]">
                    YouTube Video
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Update the associated video link.
                  </p>
                </div>
              </div>

              <label
                htmlFor="edit-song-youtube"
                className="mb-2 block text-sm font-bold text-[#32165C]"
              >
                YouTube Link

                <span className="ml-2 text-xs font-normal text-gray-400">
                  Optional
                </span>
              </label>

              <input
                id="edit-song-youtube"
                type="url"
                value={youtubeUrl}
                onChange={(event) => {
                  markEdited();
                  setYoutubeUrl(event.target.value);
                }}
                placeholder="https://www.youtube.com/watch?v=..."
                className={inputClass}
              />

              <p className="mt-2 text-xs text-gray-400">
                Leave this empty to remove an existing video link.
              </p>
            </section>

            {/* Save section */}
            <section className="space-y-5 p-5 sm:p-7">
              {message && (
                <div
                  role={success ? 'status' : 'alert'}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
                    success
                      ? 'border-green-200 bg-green-50 text-green-800'
                      : 'border-red-200 bg-red-50 text-red-700'
                  }`}
                >
                  {success ? (
                    <CheckCircle2
                      size={19}
                      className="shrink-0"
                    />
                  ) : (
                    <AlertCircle
                      size={19}
                      className="shrink-0"
                    />
                  )}

                  <div>
                    <p className="font-semibold">
                      {success
                        ? 'Changes saved'
                        : 'Unable to save'}
                    </p>

                    <p className="mt-1">
                      {message}
                    </p>

                    {success && (
                      <Link
                        href="/admin/songs"
                        className="mt-2 inline-block font-semibold underline"
                      >
                        Return to Manage Songs
                      </Link>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#32165C] px-5 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#48247C] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <LoaderCircle
                        size={18}
                        className="animate-spin"
                      />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>

                <Link
                  href="/admin/songs"
                  className="rounded-xl border border-[#E5DFD5] bg-white px-5 py-3.5 text-center text-sm font-semibold text-[#32165C] transition hover:bg-[#F4EFF9]"
                >
                  Cancel
                </Link>
              </div>

              <p className="text-center text-xs text-gray-400">
                Changes are saved only when you click Save Changes.
              </p>
            </section>
          </form>

          {/* Sidebar preview */}
          <aside className="min-w-0 space-y-4">
            <div className="overflow-hidden rounded-2xl border border-[#D8B66C]/20 bg-[#321950] p-5 shadow-lg">
              <div className="flex items-center gap-2 text-[#D8B66C]">
                <BookOpen size={17} />

                <h3 className="text-sm font-bold">
                  Song Preview
                </h3>
              </div>

              <p className="mt-2 text-xs text-white/45">
                Preview your changes before saving.
              </p>

              <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.05] p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D8B66C]/15 text-[#D8B66C]">
                  <Music2 size={22} />
                </div>

                <h4 className="mt-3 break-words text-sm font-bold leading-6">
                  {title.trim() || 'Your song title'}
                </h4>

                <span className="mt-2 inline-block rounded-full border border-[#D8B66C]/25 bg-[#D8B66C]/10 px-2.5 py-1 text-[11px] font-semibold text-[#E8CA88]">
                  {language === 'te'
                    ? 'తెలుగు · Telugu'
                    : 'English'}
                </span>

                <p className="mt-4 line-clamp-6 whitespace-pre-line break-words text-xs leading-6 text-white/55">
                  {lyrics.trim() ||
                    'Your song lyrics will appear here.'}
                </p>
              </div>
            </div>

            {/* Checklist */}
            <div className="rounded-2xl border border-white/10 bg-[#2C174A] p-5">
              <div className="flex items-center gap-2 text-[#D8B66C]">
                <ShieldCheck size={17} />

                <h3 className="text-sm font-bold">
                  Editing Checklist
                </h3>
              </div>

              <div className="mt-5 space-y-4">
                {[
                  {
                    label: 'Song title',
                    complete: titleReady,
                  },
                  {
                    label: 'Original lyrics',
                    complete: lyricsReady,
                  },
                  {
                    label:
                      language === 'te'
                        ? 'English transliteration'
                        : 'Language selected',
                    complete: transliterationReady,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2
                      size={17}
                      className={
                        item.complete
                          ? 'text-[#D8B66C]'
                          : 'text-white/25'
                      }
                    />

                    <span
                      className={`text-xs ${
                        item.complete
                          ? 'text-white/85'
                          : 'text-white/45'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="text-xs font-semibold text-[#D8B66C]">
                  {readyToSave
                    ? 'Required fields complete'
                    : 'Complete required fields'}
                </p>

                <p className="mt-1 text-xs leading-5 text-white/45">
                  Review your changes before saving.
                </p>
              </div>
            </div>

            {/* Security information */}
            <div className="rounded-2xl border border-[#D8B66C]/15 bg-[#2C174A] p-5">
              <div className="flex items-center gap-2 text-[#D8B66C]">
                <CalendarCheck size={17} />

                <h3 className="text-sm font-bold">
                  Song Management
                </h3>
              </div>

              <p className="mt-3 text-xs leading-6 text-white/55">
                Saving updates the existing song in
                WorshipVerse. It does not create a
                duplicate entry.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
