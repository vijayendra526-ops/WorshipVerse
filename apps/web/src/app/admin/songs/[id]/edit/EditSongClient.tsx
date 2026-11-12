
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function EditSongPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState<'te' | 'en'>('te');
  const [lyrics, setLyrics] = useState('');
  const [lyricsTransliteration, setLyricsTransliteration] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadSong() {
      try {
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

        if (role !== 'admin' && role !== 'super_admin') {
          router.replace('/');
          return;
        }

        const { data: song, error } = await supabase
          .from('songs')
          .select(
            'title, language, lyrics, lyrics_transliteration, youtube_url'
          )
          .eq('id', params.id)
          .single();

        if (error) throw error;

        setTitle(song.title);
        setLanguage(song.language);
        setLyrics(song.lyrics);
        setLyricsTransliteration(song.lyrics_transliteration ?? '');
        setYoutubeUrl(song.youtube_url ?? '');
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : 'Unable to load song.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadSong();
  }, [params.id, router]);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setSuccess(false);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Please sign in again.');
      }

      const role = user.app_metadata?.role;

      if (role !== 'admin' && role !== 'super_admin') {
        throw new Error('You are not authorized to edit songs.');
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
        throw new Error('Please enter the Telugu transliteration.');
      }

      if (youtubeUrl.trim()) {
        let url: URL;

        try {
          url = new URL(youtubeUrl.trim());
        } catch {
          throw new Error('Please enter a valid YouTube link.');
        }

        if (
          ![
            'youtube.com',
            'www.youtube.com',
            'youtu.be',
            'm.youtube.com',
          ].includes(url.hostname)
        ) {
          throw new Error('Please enter a valid YouTube link.');
        }
      }

      const { error } = await supabase
        .from('songs')
        .update({
          title: title.trim(),
          language,
          lyrics: lyrics.trim(),
          lyrics_transliteration:
            language === 'te'
              ? lyricsTransliteration.trim()
              : null,
          youtube_url: youtubeUrl.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id);

      if (error) throw error;

      setSuccess(true);
      setMessage('Song updated successfully!');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to update song.'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAF8F4]">
        <p className="font-semibold text-[#32165C]">
          Loading song...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF8F4] text-[#24103F]">
      <header className="border-b border-[#E9E1D3] bg-white px-5 py-6 sm:px-10">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/admin/songs"
            className="text-sm font-semibold text-[#8B6B35]"
          >
            ← Back to Manage Songs
          </Link>

          <p className="mt-6 text-xs font-bold tracking-[0.2em] text-[#A17B39]">
            WORSHIPVERSE ADMINISTRATION
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-[#32165C]">
            Edit Song
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Update your worship song details and lyrics.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-4xl p-5 py-8 sm:p-10">
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-[#32165C] to-[#24103F] p-6 text-white">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#D8B66C]">
            SONG EDITOR
          </p>

          <h2 className="mt-2 text-xl font-bold">
            Every Verse, A Praise.
          </h2>

          <p className="mt-2 text-sm text-white/70">
            Make changes to your published worship song.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-7 rounded-2xl border border-[#EDE5D8] bg-white p-6 shadow-sm sm:p-9"
        >
          {/* Song Title */}
          <div>
            <label className="mb-2 block text-sm font-bold text-[#32165C]">
              Song Title *
            </label>

            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-[#E5DFD5] bg-[#FAF8F4] px-4 py-4 text-gray-900 outline-none focus:border-[#A17B39]"
            />
          </div>

          {/* Song Language */}
          <div>
            <label className="mb-3 block text-sm font-bold text-[#32165C]">
              Song Language *
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLanguage('te')}
                className={`rounded-xl border p-4 font-semibold ${
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
                className={`rounded-xl border p-4 font-semibold ${
                  language === 'en'
                    ? 'border-[#32165C] bg-[#32165C] text-white'
                    : 'border-[#E5DFD5] bg-[#FAF8F4] text-[#32165C]'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Original Lyrics */}
          <div>
            <label className="mb-2 block text-sm font-bold text-[#32165C]">
              Song Lyrics *
            </label>

            <textarea
              required
              rows={14}
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="Enter the original song lyrics..."
              className="w-full resize-y rounded-xl border border-[#E5DFD5] bg-[#FAF8F4] px-4 py-4 leading-7 text-gray-900 outline-none focus:border-[#A17B39]"
            />
          </div>

          {/* Telugu Transliteration */}
          {language === 'te' && (
            <div>
              <label className="mb-2 block text-sm font-bold text-[#32165C]">
                Telugu Transliteration (English Letters) *
              </label>

              <textarea
                required
                rows={14}
                value={lyricsTransliteration}
                onChange={(e) =>
                  setLyricsTransliteration(e.target.value)
                }
                placeholder={`Example:\nYesu Naa Rakshakudu\nNannu Preminchina Devudu`}
                className="w-full resize-y rounded-xl border border-[#E5DFD5] bg-[#FAF8F4] px-4 py-4 leading-7 text-gray-900 outline-none focus:border-[#A17B39]"
              />

              <p className="mt-2 text-xs text-gray-500">
                Write the Telugu song using English letters.
                This is transliteration, not an English translation.
              </p>
            </div>
          )}

          {/* YouTube Link */}
          <div>
            <label className="mb-2 block text-sm font-bold text-[#32165C]">
              YouTube Link (Optional)
            </label>

            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full rounded-xl border border-[#E5DFD5] bg-[#FAF8F4] px-4 py-4 text-gray-900 outline-none focus:border-[#A17B39]"
            />
          </div>

          {/* Status Message */}
          {message && (
            <p
              role="status"
              className={`rounded-xl p-4 text-sm ${
                success
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {message}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 border-t border-[#F0EBE3] pt-6">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-[#32165C] px-6 py-4 font-bold text-white hover:bg-[#24103F] disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Changes →'}
            </button>

            <Link
              href="/admin/songs"
              className="rounded-xl border border-[#E5DFD5] px-6 py-4 text-sm font-semibold text-[#32165C]"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
