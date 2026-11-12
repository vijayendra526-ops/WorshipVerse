
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function NewSongPage() {
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState<'te' | 'en'>('te');
  const [lyrics, setLyrics] = useState('');
  const [lyricsTransliteration, setLyricsTransliteration] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setSuccess(false);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('Please sign in again.');
      }

      const role = user.app_metadata?.role;

      if (role !== 'admin' && role !== 'super_admin') {
        throw new Error('You are not authorized to publish songs.');
      }

      if (language === 'te' && !lyricsTransliteration.trim()) {
        throw new Error('Please enter the English transliteration of Telugu lyrics.');
      }

      if (youtubeUrl.trim()) {
        const url = new URL(youtubeUrl.trim());

        if (
          !['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com']
            .includes(url.hostname)
        ) {
          throw new Error('Please enter a valid YouTube link.');
        }
      }

      const { error } = await supabase.from('songs').insert({
        title: title.trim(),
        language,
        lyrics: lyrics.trim(),
        lyrics_transliteration:
          language === 'te' ? lyricsTransliteration.trim() : null,
        youtube_url: youtubeUrl.trim() || null,
        created_by: user.id,
      });

      if (error) throw error;

      setSuccess(true);
      setMessage('Your worship song has been published successfully!');
      setTitle('');
      setLanguage('te');
      setLyrics('');
      setLyricsTransliteration('');
      setYoutubeUrl('');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Unable to publish song.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF8F4] text-[#24103F]">
      <header className="border-b border-[#E9E1D3] bg-white px-5 py-5 sm:px-10">
        <div className="mx-auto max-w-4xl">
          <Link href="/admin" className="text-sm font-semibold text-[#8B6B35]">
            ← Back to Dashboard
          </Link>

          <p className="mt-5 text-xs font-bold tracking-[0.2em] text-[#A17B39]">
            WORSHIPVERSE ADMINISTRATION
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-[#32165C]">
            Add New Song
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Share another song of praise with your church community.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-4xl p-5 py-8 sm:p-10">
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-[#32165C] to-[#24103F] p-6 text-white">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#D8B66C]">
            SONG PUBLISHING
          </p>

          <h2 className="mt-2 text-xl font-bold">
            Every Song, A Prayer.
          </h2>

          <p className="mt-2 text-sm text-white/70">
            Add lyrics and a YouTube link to your worship library.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-7 rounded-2xl border border-[#EDE5D8] bg-white p-6 shadow-sm sm:p-9"
        >
          <div>
            <label className="mb-2 block text-sm font-bold text-[#32165C]">
              Song Title *
            </label>

            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter the worship song title"
              className="w-full rounded-xl border border-[#E5DFD5] bg-[#FAF8F4] px-4 py-4 text-gray-900 outline-none transition focus:border-[#A17B39] focus:ring-2 focus:ring-[#D8B66C]/30"
            />
          </div>

          <div>
            <label className="mb-3 block text-sm font-bold text-[#32165C]">
              Song Language *
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLanguage('te')}
                className={`rounded-xl border p-4 text-sm font-semibold transition ${
                  language === 'te'
                    ? 'border-[#32165C] bg-[#32165C] text-white'
                    : 'border-[#E5DFD5] bg-[#FAF8F4] text-[#32165C]'
                }`}
              >
                తెలుగు
                <span className="mt-1 block text-xs opacity-70">
                  Telugu
                </span>
              </button>

              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`rounded-xl border p-4 text-sm font-semibold transition ${
                  language === 'en'
                    ? 'border-[#32165C] bg-[#32165C] text-white'
                    : 'border-[#E5DFD5] bg-[#FAF8F4] text-[#32165C]'
                }`}
              >
                English
                <span className="mt-1 block text-xs opacity-70">
                  English
                </span>
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-[#32165C]">
              {language === 'te' ? 'Telugu Song Lyrics *' : 'Song Lyrics *'}
            </label>

            <textarea
              required
              rows={14}
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder={
                language === 'te'
                  ? 'ఇక్కడ పూర్తి పాట సాహిత్యాన్ని నమోదు చేయండి...'
                  : 'Enter the complete song lyrics here...'
              }
              className="w-full resize-y rounded-xl border border-[#E5DFD5] bg-[#FAF8F4] px-4 py-4 text-gray-900 leading-7 outline-none transition focus:border-[#A17B39] focus:ring-2 focus:ring-[#D8B66C]/30"
            />

            <p className="mt-2 text-xs text-gray-400">
              Keep the original line breaks to preserve the song format.
            </p>
          </div>

          {language === 'te' && (
            <div>
              <label className="mb-2 block text-sm font-bold text-[#32165C]">
                English Transliteration *
              </label>

              <p className="mb-3 text-xs leading-5 text-gray-500">
                Enter the same Telugu lyrics using English letters.
                Do not translate the lyrics into English.
              </p>

              <textarea
                required
                rows={14}
                value={lyricsTransliteration}
                onChange={(e) => setLyricsTransliteration(e.target.value)}
                placeholder={
                  'Enter Telugu lyrics in English letters...\n\nExample:\nNee prema chaalunu\nNee krupa chaalunu'
                }
                className="w-full resize-y rounded-xl border border-[#E5DFD5] bg-[#FAF8F4] px-4 py-4 text-gray-900 leading-7 outline-none transition focus:border-[#A17B39] focus:ring-2 focus:ring-[#D8B66C]/30"
              />

              <p className="mt-2 text-xs text-gray-400">
                Keep the same line breaks as the original Telugu lyrics.
              </p>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-bold text-[#32165C]">
              YouTube Video Link
              <span className="ml-2 font-normal text-gray-400">
                (Optional)
              </span>
            </label>

            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full rounded-xl border border-[#E5DFD5] bg-[#FAF8F4] px-4 py-4 text-gray-900 outline-none transition focus:border-[#A17B39] focus:ring-2 focus:ring-[#D8B66C]/30"
            />
          </div>

          {message && (
            <div
              className={`rounded-xl p-4 text-sm ${
                success
                  ? 'border border-green-200 bg-green-50 text-green-800'
                  : 'border border-red-200 bg-red-50 text-red-700'
              }`}
              role="status"
            >
              {message}
            </div>
          )}

          <div className="flex flex-wrap gap-3 border-t border-[#F0EBE3] pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-[#32165C] px-6 py-4 font-bold text-white shadow-sm transition hover:bg-[#24103F] disabled:opacity-60"
            >
              {loading ? 'Publishing...' : 'Publish Song →'}
            </button>

            <Link
              href="/admin"
              className="rounded-xl border border-[#E5DFD5] px-6 py-4 text-center text-sm font-semibold text-[#32165C] hover:bg-[#FAF8F4]"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
