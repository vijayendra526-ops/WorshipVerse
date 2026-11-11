
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Playlist = {
  id: string;
  name: string;
  created_at: string;
};

type Song = {
  id: string;
  title: string;
  artist: string | null;
  language: string;
};

export default function PlaylistsPage() {
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  const [userId, setUserId] = useState('');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [playlistSongs, setPlaylistSongs] = useState<Song[]>([]);
  const [playlistName, setPlaylistName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadData() {
      const { data: { user }, error: authError } =
        await supabase.auth.getUser();

      if (authError || !user) {
        router.replace('/login');
        return;
      }

      setUserId(user.id);

      const [playlistResult, songResult] = await Promise.all([
        supabase
          .from('playlists')
          .select('id, name, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),

        supabase
          .from('songs')
          .select('id, title, artist, language')
          .order('title'),
      ]);

      if (playlistResult.error || songResult.error) {
        setMessage(
          playlistResult.error?.message ||
          songResult.error?.message ||
          'Unable to load data.'
        );
      } else {
        setPlaylists(playlistResult.data ?? []);
        setSongs(songResult.data ?? []);
      }

      setLoading(false);
    }

    loadData();
  }, [router, supabase]);

  async function createPlaylist(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const name = playlistName.trim();
    if (!name || !userId || saving) return;

    setSaving(true);
    setMessage('');

    const { data, error } = await supabase
      .from('playlists')
      .insert({ name, user_id: userId })
      .select('id, name, created_at')
      .single();

    if (error) {
      setMessage(error.message);
    } else if (data) {
      setPlaylists((current) => [data, ...current]);
      setPlaylistName('');
      setSelectedPlaylist(data);
      setPlaylistSongs([]);
      setMessage('Playlist created successfully!');
    }

    setSaving(false);
  }

  async function openPlaylist(playlist: Playlist) {
    setSelectedPlaylist(playlist);
    setMessage('');

    const { data, error } = await supabase
      .from('playlist_songs')
      .select(`
        song_id,
        songs (
          id,
          title,
          artist,
          language
        )
      `)
      .eq('playlist_id', playlist.id)
      .order('added_at', { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    const result = (data ?? [])
      .map((item) => item.songs)
      .filter(Boolean) as unknown as Song[];

    setPlaylistSongs(result);
  }

  async function addSong(songId: string) {
    if (!selectedPlaylist || saving) return;

    if (playlistSongs.some((song) => song.id === songId)) {
      setMessage('This song is already in the playlist.');
      return;
    }

    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('playlist_songs')
      .insert({
        playlist_id: selectedPlaylist.id,
        song_id: songId,
      });

    if (error) {
      setMessage(error.message);
    } else {
      await openPlaylist(selectedPlaylist);
      setMessage('Song added to playlist!');
    }

    setSaving(false);
  }

  async function removeSong(songId: string) {
    if (!selectedPlaylist || saving) return;

    setSaving(true);

    const { error } = await supabase
      .from('playlist_songs')
      .delete()
      .eq('playlist_id', selectedPlaylist.id)
      .eq('song_id', songId);

    if (error) {
      setMessage(error.message);
    } else {
      setPlaylistSongs((current) =>
        current.filter((song) => song.id !== songId)
      );
      setMessage('Song removed from playlist.');
    }

    setSaving(false);
  }

  async function renamePlaylist(playlist: Playlist) {
    const newName = window.prompt('Enter the new playlist name:', playlist.name);
    if (newName === null) return;

    const name = newName.trim();
    if (!name || name === playlist.name || saving) return;

    setSaving(true);

    const { error } = await supabase
      .from('playlists')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', playlist.id)
      .eq('user_id', userId);

    if (error) {
      setMessage(error.message);
    } else {
      setPlaylists((current) =>
        current.map((item) =>
          item.id === playlist.id ? { ...item, name } : item
        )
      );

      setSelectedPlaylist({ ...playlist, name });
      setMessage('Playlist renamed successfully!');
    }

    setSaving(false);
  }

  async function deletePlaylist(playlist: Playlist) {
    if (!window.confirm(`Delete "${playlist.name}"?`)) return;
    if (saving) return;

    setSaving(true);

    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', playlist.id)
      .eq('user_id', userId);

    if (error) {
      setMessage(error.message);
    } else {
      setPlaylists((current) =>
        current.filter((item) => item.id !== playlist.id)
      );

      if (selectedPlaylist?.id === playlist.id) {
        setSelectedPlaylist(null);
        setPlaylistSongs([]);
      }

      setMessage('Playlist deleted.');
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAF8F4] text-[#32165C]">
        Loading playlists...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF8F4] text-[#24103F]">
      <header className="bg-[#32165C] px-5 py-5 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            WorshipVerse
          </Link>
          <Link href="/" className="text-sm text-[#D8B66C] hover:underline">
            Home
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-[#9B7A3C]">
          Your Personal Music Collection
        </p>

        <h1 className="mt-2 text-3xl font-bold text-[#32165C]">
          ♫ My Playlists
        </h1>

        <p className="mt-2 text-gray-600">
          Create your own worship collections.
        </p>

        <form onSubmit={createPlaylist} className="mt-8 flex flex-wrap gap-3">
          <input
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            maxLength={60}
            required
            placeholder="Enter playlist name"
            className="min-w-0 flex-1 rounded-xl border border-[#E9E1D3] bg-white px-4 py-3 outline-none focus:border-[#65409A]"
          />

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#32165C] px-6 py-3 font-semibold text-white disabled:opacity-50"
          >
            + Create Playlist
          </button>
        </form>

        {message && (
          <p role="status" className="mt-4 rounded-xl bg-[#F4EFF9] p-3 text-sm text-[#65409A]">
            {message}
          </p>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <section>
            <h2 className="mb-4 text-xl font-bold text-[#32165C]">
              Your Playlists ({playlists.length})
            </h2>

            {playlists.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#D8B66C] bg-white p-8 text-center text-gray-500">
                No playlists yet. Create your first playlist!
              </div>
            ) : (
              <div className="space-y-3">
                {playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className={`rounded-2xl border bg-white p-4 ${
                      selectedPlaylist?.id === playlist.id
                        ? 'border-[#65409A] ring-2 ring-[#65409A]/10'
                        : 'border-[#E8E0D2]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => openPlaylist(playlist)}
                      className="w-full text-left"
                    >
                      <span className="font-bold text-[#32165C]">
                        ♫ {playlist.name}
                      </span>
                      <span className="mt-1 block text-xs text-gray-400">
                        Created {new Date(playlist.created_at).toLocaleDateString()}
                      </span>
                    </button>

                    <div className="mt-3 flex gap-4 text-sm">
                      <button
                        type="button"
                        onClick={() => renamePlaylist(playlist)}
                        className="font-semibold text-[#65409A] hover:underline"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePlaylist(playlist)}
                        className="font-semibold text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#E8E0D2] bg-white p-5 sm:p-7">
            {selectedPlaylist ? (
              <>
                <h2 className="text-xl font-bold text-[#32165C]">
                  {selectedPlaylist.name}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {playlistSongs.length} songs in this playlist
                </p>

                <div className="mt-5 space-y-3">
                  {playlistSongs.map((song) => (
                    <div
                      key={song.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-[#FAF8F4] p-3"
                    >
                      <div>
                        <p className="font-semibold">{song.title}</p>
                        <p className="text-xs text-gray-500">
                          {song.artist || 'WorshipVerse'} · {song.language === 'te' ? 'Telugu' : 'English'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeSong(song.id)}
                        className="text-sm font-semibold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  {playlistSongs.length === 0 && (
                    <p className="rounded-xl bg-[#FAF8F4] p-5 text-center text-sm text-gray-500">
                      This playlist is empty. Add some songs below.
                    </p>
                  )}
                </div>

                <div className="mt-7 border-t border-[#E9E1D3] pt-5">
                  <h3 className="mb-3 font-bold text-[#32165C]">
                    Add Songs
                  </h3>

                  <div className="max-h-80 space-y-2 overflow-y-auto">
                    {songs.map((song) => {
                      const alreadyAdded = playlistSongs.some(
                        (item) => item.id === song.id
                      );

                      return (
                        <div
                          key={song.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-[#F0EBE3] p-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {song.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {song.language === 'te' ? 'Telugu' : 'English'}
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={alreadyAdded || saving}
                            onClick={() => addSong(song.id)}
                            className="shrink-0 rounded-lg bg-[#32165C] px-3 py-2 text-xs font-semibold text-white disabled:bg-gray-300"
                          >
                            {alreadyAdded ? 'Added' : '+ Add'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center text-center">
                <span className="text-5xl text-[#D8B66C]">♫</span>
                <h2 className="mt-4 text-xl font-bold text-[#32165C]">
                  Select a Playlist
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  Choose a playlist or create a new one to get started.
                </p>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
