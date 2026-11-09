
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Song = {
  id: string;
  title: string;
  language: 'te' | 'en';
  youtube_url: string | null;
  created_at: string;
};

type Props = {
  initialSongs: Song[];
};

export default function SongManager({ initialSongs }: Props) {
  const [songs, setSongs] = useState(initialSongs);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'te' | 'en'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const filteredSongs = useMemo(() => {
    return songs.filter((song) => {
      const matchesSearch = song.title
        .toLowerCase()
        .includes(search.toLowerCase().trim());

      const matchesLanguage =
        filter === 'all' || song.language === filter;

      return matchesSearch && matchesLanguage;
    });
  }, [songs, search, filter]);

  async function handleDelete(song: Song) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${song.title}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(song.id);

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
        throw new Error('You are not authorized to delete songs.');
      }

      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', song.id);

      if (error) throw error;

      setSongs((current) =>
        current.filter((item) => item.id !== song.id)
      );

      router.refresh();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : 'Unable to delete song.'
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Library statistics */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'All Songs', value: songs.length },
          {
            label: 'Telugu',
            value: songs.filter((song) => song.language === 'te').length,
          },
          {
            label: 'English',
            value: songs.filter((song) => song.language === 'en').length,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-[#EDE5D8] bg-white p-4 shadow-sm"
          >
            <p className="text-xs text-gray-500 sm:text-sm">{item.label}</p>
            <p className="mt-2 text-2xl font-extrabold text-[#32165C]">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Search and filters */}
      <div className="rounded-2xl border border-[#EDE5D8] bg-white p-5 shadow-sm">
        <label
          htmlFor="song-search"
          className="mb-2 block text-sm font-bold text-[#32165C]"
        >
          Search your library
        </label>

        <input
          id="song-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by song title..."
          className="w-full rounded-xl border border-[#E5DFD5] bg-[#FAF8F4] px-4 py-3 text-gray-900 outline-none focus:border-[#A17B39] focus:ring-2 focus:ring-[#D8B66C]/30"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'All Songs' },
            { value: 'te', label: 'Telugu' },
            { value: 'en', label: 'English' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                setFilter(option.value as 'all' | 'te' | 'en')
              }
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                filter === option.value
                  ? 'bg-[#32165C] text-white'
                  : 'border border-[#E5DFD5] bg-[#FAF8F4] text-[#32165C] hover:bg-[#F4EFF9]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Song list */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#32165C]">
            Your Song Library
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Showing {filteredSongs.length} of {songs.length} songs
          </p>
        </div>

        <Link
          href="/admin/songs/new"
          className="rounded-xl bg-[#32165C] px-4 py-3 text-sm font-bold text-white hover:bg-[#24103F]"
        >
          + Add Song
        </Link>
      </div>

      {filteredSongs.length > 0 ? (
        <div className="space-y-3">
          {filteredSongs.map((song) => (
            <article
              key={song.id}
              className="rounded-2xl border border-[#EDE5D8] bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F4EFF9] text-2xl text-[#A17B39]">
                    ♫
                  </div>

                  <div className="min-w-0">
                    <h3 className="break-words font-bold text-[#32165C]">
                      {song.title}
                    </h3>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#F4EFF9] px-3 py-1 text-xs font-semibold text-[#32165C]">
                        {song.language === 'te' ? 'తెలుగు · Telugu' : 'English'}
                      </span>

                      <span className="text-xs text-gray-400">
                        {new Date(song.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {song.youtube_url && (
                      <a
                        href={song.youtube_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-block text-xs font-semibold text-[#A17B39] underline"
                      >
                        Watch on YouTube ↗
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex w-full gap-2 sm:w-auto">
                  <Link
                    href={`/admin/songs/${song.id}/edit`}
                    className="flex-1 rounded-lg border border-[#32165C] px-4 py-2 text-center text-sm font-semibold text-[#32165C] hover:bg-[#F4EFF9] sm:flex-none"
                  >
                    Edit
                  </Link>

                  <button
                    type="button"
                    disabled={deletingId === song.id}
                    onClick={() => handleDelete(song)}
                    className="flex-1 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 sm:flex-none"
                  >
                    {deletingId === song.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#EDE5D8] bg-white px-6 py-14 text-center shadow-sm">
          <div className="text-5xl text-[#D8B66C]">♫</div>
          <h3 className="mt-4 text-lg font-bold text-[#32165C]">
            {songs.length === 0
              ? 'Your song library is empty'
              : 'No matching songs found'}
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {songs.length === 0
              ? 'Publish your first worship song to get started.'
              : 'Try another title or change the language filter.'}
          </p>

          {songs.length === 0 && (
            <Link
              href="/admin/songs/new"
              className="mt-5 inline-block rounded-xl bg-[#32165C] px-5 py-3 text-sm font-bold text-white"
            >
              + Publish First Song
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
