
'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Image from 'next/image';
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
  const [selectedPlaylist, setSelectedPlaylist] =
    useState<Playlist | null>(null);
  const [playlistSongs, setPlaylistSongs] = useState<Song[]>([]);
  const [playlistName, setPlaylistName] = useState('');
  const [songSearch, setSongSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadData() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!active) return;

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

      if (!active) return;

      if (playlistResult.error || songResult.error) {
        setMessage(
          playlistResult.error?.message ||
            songResult.error?.message ||
            'Unable to load data.'
        );
        setError(true);
      } else {
        setPlaylists(playlistResult.data ?? []);
        setSongs(songResult.data ?? []);
      }

      setLoading(false);
    }

    loadData();

    return () => {
      active = false;
    };
  }, [router, supabase]);

  async function createPlaylist(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const name = playlistName.trim();
    if (!name || !userId || saving) return;

    setSaving(true);
    setMessage('');
    setError(false);

    try {
      const { data, error: insertError } = await supabase
        .from('playlists')
        .insert({ name, user_id: userId })
        .select('id, name, created_at')
        .single();

      if (insertError) {
        setMessage(insertError.message);
        setError(true);
      } else if (data) {
        setPlaylists((current) => [data, ...current]);
        setPlaylistName('');
        setSelectedPlaylist(data);
        setPlaylistSongs([]);
        setSongSearch('');
        setMessage('Playlist created successfully!');
      }
    } catch {
      setMessage('Unable to create playlist.');
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  async function openPlaylist(playlist: Playlist) {
    setSelectedPlaylist(playlist);
    setPlaylistSongs([]);
    setLoadingSongs(true);
    setMessage('');
    setError(false);

    const { data, error: fetchError } = await supabase
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

    if (fetchError) {
      setMessage(fetchError.message);
      setError(true);
    } else {
      const result = (data ?? [])
        .map((item) => item.songs)
        .filter(Boolean) as unknown as Song[];

      setPlaylistSongs(result);
    }

    setLoadingSongs(false);
  }

  async function addSong(songId: string) {
    if (!selectedPlaylist || saving || loadingSongs) return;

    if (playlistSongs.some((song) => song.id === songId)) {
      setMessage('This song is already in the playlist.');
      return;
    }

    setSaving(true);
    setMessage('');
    setError(false);

    const { error: insertError } = await supabase
      .from('playlist_songs')
      .insert({
        playlist_id: selectedPlaylist.id,
        song_id: songId,
      });

    if (insertError) {
      setMessage(insertError.message);
      setError(true);
    } else {
      const addedSong = songs.find((song) => song.id === songId);

      if (addedSong) {
        setPlaylistSongs((current) => [addedSong, ...current]);
      }

      setMessage('Song added to playlist!');
    }

    setSaving(false);
  }

  async function removeSong(songId: string) {
    if (!selectedPlaylist || saving || loadingSongs) return;

    setSaving(true);
    setMessage('');
    setError(false);

    const { error: removeError } = await supabase
      .from('playlist_songs')
      .delete()
      .eq('playlist_id', selectedPlaylist.id)
      .eq('song_id', songId);

    if (removeError) {
      setMessage(removeError.message);
      setError(true);
    } else {
      setPlaylistSongs((current) =>
        current.filter((song) => song.id !== songId)
      );
      setMessage('Song removed from playlist.');
    }

    setSaving(false);
  }

  async function renamePlaylist(playlist: Playlist) {
    const newName = window.prompt(
      'Enter the new playlist name:',
      playlist.name
    );

    if (newName === null) return;

    const name = newName.trim();
    if (!name || name === playlist.name || saving) return;

    setSaving(true);
    setMessage('');
    setError(false);

    const { error: updateError } = await supabase
      .from('playlists')
      .update({
        name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', playlist.id)
      .eq('user_id', userId);

    if (updateError) {
      setMessage(updateError.message);
      setError(true);
    } else {
      setPlaylists((current) =>
        current.map((item) =>
          item.id === playlist.id ? { ...item, name } : item
        )
      );

      setSelectedPlaylist((current) =>
        current?.id === playlist.id
          ? { ...current, name }
          : current
      );

      setMessage('Playlist renamed successfully!');
    }

    setSaving(false);
  }

  async function deletePlaylist(playlist: Playlist) {
    if (!window.confirm(`Delete "${playlist.name}"?`)) return;
    if (saving) return;

    setSaving(true);
    setMessage('');
    setError(false);

    const { error: deleteError } = await supabase
      .from('playlists')
      .delete()
      .eq('id', playlist.id)
      .eq('user_id', userId);

    if (deleteError) {
      setMessage(deleteError.message);
      setError(true);
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

  const filteredSongs = songs.filter((song) =>
    song.title.toLocaleLowerCase().includes(
      songSearch.trim().toLocaleLowerCase()
    )
  );

  const backgroundStyle = {
    backgroundImage:
      "linear-gradient(rgba(36, 16, 63, 0.78), rgba(36, 16, 63, 0.88)), url('/images/worship-background.jpg')",
  };

  if (loading) {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-cover bg-center text-white"
        style={backgroundStyle}
      >
        Loading playlists...
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat text-white"
      style={backgroundStyle}
    >
      <header className="border-b border-white/15 bg-[#24103F]/75 px-5 py-4 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="text-xl font-bold">
            <span className="text-[#D8B66C]">Worship</span>Verse
          </Link>

          <Link
            href="/songs"
            className="rounded-xl border border-[#D8B66C]/50 px-4 py-2 text-sm font-semibold text-[#F1D99D] hover:bg-white/10"
          >
            Browse Songs
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D8B66C]">
            Your Personal Music Collection
          </p>

          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            <span className="text-[#D8B66C]">♫</span> My Playlists
          </h1>

          <p className="mt-2 text-sm text-white/75">
            Create and organise your favourite worship collections.
          </p>
        </div>

        <form
          onSubmit={createPlaylist}
          className="flex flex-col gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md sm:flex-row"
        >
          <input
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            maxLength={60}
            required
            placeholder="Enter playlist name"
            aria-label="Playlist name"
            className="min-w-0 flex-1 rounded-xl border border-[#E9E1D3] bg-[#FAF8F4] px-4 py-3 text-sm text-[#24103F] outline-none focus:border-[#D8B66C]"
          />

          <button
            type="submit"
            disabled={saving || !userId}
            className="rounded-xl bg-[#D8B66C] px-6 py-3 text-sm font-bold text-[#24103F] transition hover:bg-[#E8C987] disabled:opacity-50"
          >
            + Create Playlist
          </button>
        </form>

        {message && (
          <p
            role={error ? 'alert' : 'status'}
            className={`mt-4 rounded-xl p-3 text-sm ${
              error
                ? 'border border-red-200 bg-red-50 text-red-700'
                : 'border border-[#D8B66C]/40 bg-[#FAF8F4] text-[#32165C]'
            }`}
          >
            {message}
          </p>
        )}

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <section>
            <h2 className="mb-4 text-lg font-bold">
              Your Playlists ({playlists.length})
            </h2>

            {playlists.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#D8B66C]/70 bg-white/10 p-8 text-center text-sm text-white/80">
                No playlists yet. Create your first playlist!
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {playlists.map((playlist) => (
                  <article
                    key={playlist.id}
                    className={`rounded-2xl border bg-[#FAF8F4]/95 p-3 text-[#24103F] shadow-lg transition ${
                      selectedPlaylist?.id === playlist.id
                        ? 'border-[#D8B66C] ring-2 ring-[#D8B66C]/50'
                        : 'border-[#E8E0D2]/60 hover:border-[#D8B66C]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => openPlaylist(playlist)}
                        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#EDE3D2]"
                        aria-label={`Open playlist ${playlist.name}`}
                      >
                        <Image
                          src="/images/worship-instruments.jpg"
                          alt="Worship instruments"
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => openPlaylist(playlist)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <h3 className="line-clamp-2 text-sm font-bold sm:text-base">
                          {playlist.name}
                        </h3>

                        <p className="mt-1 text-xs text-gray-500">
                          Created{' '}
                          {new Date(
                            playlist.created_at
                          ).toLocaleDateString()}
                        </p>

                        <span className="mt-2 inline-block text-xs font-semibold text-[#80601F]">
                          View songs →
                        </span>
                      </button>
                    </div>

                    <div className="mt-3 flex gap-4 border-t border-[#E8E0D2] pt-3 text-xs">
                      <button
                        type="button"
                        onClick={() => renamePlaylist(playlist)}
                        disabled={saving}
                        className="font-semibold text-[#65409A] hover:underline disabled:opacity-50"
                      >
                        Rename
                      </button>

                      <button
                        type="button"
                        onClick={() => deletePlaylist(playlist)}
                        disabled={saving}
                        className="font-semibold text-red-600 hover:underline disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="min-w-0 rounded-2xl border border-[#E8E0D2]/70 bg-[#FAF8F4]/95 p-4 text-[#24103F] shadow-xl sm:p-6">
            {selectedPlaylist ? (
              <>
                <div className="flex items-start gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                    <Image
                      src="/images/worship-instruments.jpg"
                      alt="Playlist artwork"
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="break-words text-lg font-bold text-[#32165C]">
                      {selectedPlaylist.name}
                    </h2>
                    <p className="mt-1 text-xs text-gray-500">
                      {playlistSongs.length}{' '}
                      {playlistSongs.length === 1 ? 'song' : 'songs'}
                    </p>
                  </div>
                </div>

                {loadingSongs ? (
                  <p className="mt-6 text-sm text-gray-500">
                    Loading playlist songs...
                  </p>
                ) : (
                  <>
                    <div className="mt-5 space-y-2">
                      {playlistSongs.map((song) => (
                        <div
                          key={song.id}
                          className="flex items-center gap-3 rounded-xl border border-[#E8E0D2] bg-white p-2.5"
                        >
                          <Link
                            href={`/songs/${song.id}`}
                            className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg"
                          >
                            <Image
                              src="/images/worship-instruments.jpg"
                              alt="Song artwork"
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </Link>

                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/songs/${song.id}`}
                              className="block truncate text-sm font-bold hover:text-[#65409A]"
                            >
                              {song.title}
                            </Link>

                            <p className="truncate text-xs text-gray-500">
                              {song.artist || 'WorshipVerse'} ·{' '}
                              {song.language === 'te'
                                ? 'Telugu'
                                : 'English'}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeSong(song.id)}
                            disabled={saving}
                            className="shrink-0 rounded-lg px-2 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      ))}

                      {playlistSongs.length === 0 && (
                        <div className="rounded-xl border border-dashed border-[#D8B66C] bg-white p-6 text-center text-sm text-gray-500">
                          This playlist is empty. Add some songs below.
                        </div>
                      )}
                    </div>

                    <div className="mt-7 border-t border-[#E9E1D3] pt-5">
                      <h3 className="mb-3 text-base font-bold text-[#32165C]">
                        Add Songs
                      </h3>

                      <input
                        value={songSearch}
                        onChange={(e) => setSongSearch(e.target.value)}
                        placeholder="Search songs by title..."
                        aria-label="Search songs to add"
                        className="mb-4 w-full rounded-xl border border-[#E8E0D2] bg-white px-4 py-3 text-sm outline-none focus:border-[#65409A]"
                      />

                      <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                        {filteredSongs.map((song) => {
                          const alreadyAdded = playlistSongs.some(
                            (item) => item.id === song.id
                          );

                          return (
                            <div
                              key={song.id}
                              className="flex items-center gap-3 rounded-xl border border-[#E8E0D2] bg-white p-2.5"
                            >
                              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg">
                                <Image
                                  src="/images/worship-instruments.jpg"
                                  alt="Song artwork"
                                  fill
                                  sizes="44px"
                                  className="object-cover"
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold">
                                  {song.title}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {song.language === 'te'
                                    ? 'Telugu'
                                    : 'English'}
                                </p>
                              </div>

                              <button
                                type="button"
                                disabled={alreadyAdded || saving}
                                onClick={() => addSong(song.id)}
                                className="shrink-0 rounded-lg bg-[#32165C] px-3 py-2 text-xs font-semibold text-white hover:bg-[#4C2778] disabled:bg-gray-300"
                              >
                                {alreadyAdded ? 'Added' : '+ Add'}
                              </button>
                            </div>
                          );
                        })}

                        {filteredSongs.length === 0 && (
                          <p className="py-5 text-center text-sm text-gray-500">
                            No matching songs found.
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center text-center">
                <span className="text-5xl text-[#C39A48]">♫</span>

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

      <footer className="mt-12 border-t border-white/15 bg-[#24103F]/70 px-5 py-5 text-center text-xs text-white/65">
        © 2026 WorshipVerse
      </footer>
    </main>
  );
}

