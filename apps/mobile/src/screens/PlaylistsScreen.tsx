
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

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

type PlaylistSongRow = {
  song_id: string;
  songs: Song | Song[] | null;
};

type PlaylistsScreenProps = {
  onBack: () => void;
};

export default function PlaylistsScreen({ onBack }: PlaylistsScreenProps) {
  const [userId, setUserId] = useState('');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] =
    useState<Playlist | null>(null);
  const [playlistSongs, setPlaylistSongs] = useState<Song[]>([]);
  const [playlistName, setPlaylistName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [renameVisible, setRenameVisible] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renamingPlaylist, setRenamingPlaylist] =
    useState<Playlist | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data: { user }, error: authError } =
      await supabase.auth.getUser();

    if (authError || !user) {
      setLoading(false);
      onBack();
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
          'Unable to load data.',
      );
    } else {
      setPlaylists((playlistResult.data ?? []) as Playlist[]);
      setSongs((songResult.data ?? []) as Song[]);
    }

    setLoading(false);
  }

  async function createPlaylist() {
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
      const newPlaylist = data as Playlist;

      setPlaylists((current) => [newPlaylist, ...current]);
      setPlaylistName('');
      setSelectedPlaylist(newPlaylist);
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

    const rows = (data ?? []) as unknown as PlaylistSongRow[];

    const result = rows.flatMap((item) => {
      if (!item.songs) return [];
      return Array.isArray(item.songs) ? item.songs : [item.songs];
    });

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
    setMessage('');

    const { error } = await supabase
      .from('playlist_songs')
      .delete()
      .eq('playlist_id', selectedPlaylist.id)
      .eq('song_id', songId);

    if (error) {
      setMessage(error.message);
    } else {
      setPlaylistSongs((current) =>
        current.filter((song) => song.id !== songId),
      );
      setMessage('Song removed from playlist.');
    }

    setSaving(false);
  }

  function startRename(playlist: Playlist) {
    setRenamingPlaylist(playlist);
    setRenameValue(playlist.name);
    setRenameVisible(true);
  }

  async function renamePlaylist() {
    if (!renamingPlaylist || saving) return;

    const name = renameValue.trim();

    if (!name || name === renamingPlaylist.name) {
      setRenameVisible(false);
      return;
    }

    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('playlists')
      .update({
        name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', renamingPlaylist.id)
      .eq('user_id', userId);

    if (error) {
      setMessage(error.message);
    } else {
      setPlaylists((current) =>
        current.map((item) =>
          item.id === renamingPlaylist.id
            ? { ...item, name }
            : item,
        ),
      );

      setSelectedPlaylist((current) =>
        current?.id === renamingPlaylist.id
          ? { ...current, name }
          : current,
      );

      setMessage('Playlist renamed successfully!');
      setRenameVisible(false);
    }

    setSaving(false);
  }

  function confirmDelete(playlist: Playlist) {
    Alert.alert(
      'Delete playlist',
      `Are you sure you want to delete "${playlist.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deletePlaylist(playlist),
        },
      ],
    );
  }

  async function deletePlaylist(playlist: Playlist) {
    if (saving) return;

    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', playlist.id)
      .eq('user_id', userId);

    if (error) {
      setMessage(error.message);
    } else {
      setPlaylists((current) =>
        current.filter((item) => item.id !== playlist.id),
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#65409A" />
        <Text style={styles.loadingText}>Loading playlists...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>‹  Home</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>WorshipVerse</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.eyebrow}>YOUR PERSONAL MUSIC COLLECTION</Text>
        <Text style={styles.title}>♫ My Playlists</Text>
        <Text style={styles.subtitle}>
          Create your own worship collections.
        </Text>

        <View style={styles.createCard}>
          <Text style={styles.sectionTitle}>Create a playlist</Text>

          <TextInput
            value={playlistName}
            onChangeText={setPlaylistName}
            maxLength={60}
            placeholder="Enter playlist name"
            placeholderTextColor="#999"
            style={styles.input}
          />

          <TouchableOpacity
            style={[
              styles.primaryButton,
              (saving || !playlistName.trim()) && styles.disabledButton,
            ]}
            disabled={saving || !playlistName.trim()}
            onPress={createPlaylist}
          >
            <Text style={styles.primaryButtonText}>
              {saving ? 'Please wait...' : '+ Create Playlist'}
            </Text>
          </TouchableOpacity>
        </View>

        {message ? (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>{message}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Your Playlists ({playlists.length})
          </Text>

          {playlists.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                No playlists yet. Create your first playlist!
              </Text>
            </View>
          ) : (
            playlists.map((playlist) => (
              <View
                key={playlist.id}
                style={[
                  styles.playlistCard,
                  selectedPlaylist?.id === playlist.id &&
                    styles.selectedPlaylistCard,
                ]}
              >
                <TouchableOpacity
                  style={styles.playlistMain}
                  onPress={() => openPlaylist(playlist)}
                >
                  <Text style={styles.playlistName}>
                    ♫ {playlist.name}
                  </Text>
                  <Text style={styles.dateText}>
                    Created {new Date(playlist.created_at).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() => startRename(playlist)}
                    disabled={saving}
                  >
                    <Text style={styles.renameText}>Rename</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => confirmDelete(playlist)}
                    disabled={saving}
                  >
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.detailsCard}>
          {selectedPlaylist ? (
            <>
              <Text style={styles.sectionTitle}>
                {selectedPlaylist.name}
              </Text>
              <Text style={styles.detailsSubtitle}>
                {playlistSongs.length} songs in this playlist
              </Text>

              {playlistSongs.length === 0 ? (
                <Text style={styles.emptyText}>
                  This playlist is empty. Add some songs below.
                </Text>
              ) : (
                playlistSongs.map((song) => (
                  <View key={song.id} style={styles.songRow}>
                    <View style={styles.songInfo}>
                      <Text style={styles.songTitle}>{song.title}</Text>
                      <Text style={styles.songArtist}>
                        {song.artist || 'WorshipVerse'} ·{' '}
                        {song.language === 'te' ? 'Telugu' : 'English'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => removeSong(song.id)}
                      disabled={saving}
                    >
                      <Text style={styles.deleteText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}

              <View style={styles.addSongsSection}>
                <Text style={styles.sectionTitle}>Add Songs</Text>

                {songs.map((song) => {
                  const alreadyAdded = playlistSongs.some(
                    (item) => item.id === song.id,
                  );

                  return (
                    <View key={song.id} style={styles.addSongRow}>
                      <View style={styles.songInfo}>
                        <Text style={styles.songTitle}>{song.title}</Text>
                        <Text style={styles.songArtist}>
                          {song.language === 'te' ? 'Telugu' : 'English'}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.addButton,
                          alreadyAdded && styles.addedButton,
                        ]}
                        disabled={alreadyAdded || saving}
                        onPress={() => addSong(song.id)}
                      >
                        <Text style={styles.addButtonText}>
                          {alreadyAdded ? 'Added' : '+ Add'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </>
          ) : (
            <View style={styles.selectPrompt}>
              <Text style={styles.musicIcon}>♫</Text>
              <Text style={styles.sectionTitle}>Select a Playlist</Text>
              <Text style={styles.detailsSubtitle}>
                Choose a playlist or create a new one to get started.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={renameVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rename Playlist</Text>

            <TextInput
              value={renameValue}
              onChangeText={setRenameValue}
              maxLength={60}
              placeholder="Enter new playlist name"
              placeholderTextColor="#999"
              style={styles.input}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setRenameVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryButton}
                disabled={saving || !renameValue.trim()}
                onPress={renamePlaylist}
              >
                <Text style={styles.primaryButtonText}>
                  {saving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F4',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF8F4',
  },
  loadingText: {
    marginTop: 12,
    color: '#32165C',
    fontSize: 15,
  },
  header: {
    minHeight: 62,
    backgroundColor: '#32165C',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    minWidth: 75,
  },
  backText: {
    color: '#D8B66C',
    fontSize: 15,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 75,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 45,
  },
  eyebrow: {
    color: '#9B7A3C',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.2,
  },
  title: {
    color: '#32165C',
    fontSize: 29,
    fontWeight: 'bold',
    marginTop: 8,
  },
  subtitle: {
    color: '#777',
    fontSize: 14,
    marginTop: 7,
    marginBottom: 22,
  },
  createCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: '#E8E0D2',
  },
  section: {
    marginTop: 25,
  },
  sectionTitle: {
    color: '#32165C',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9E1D3',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: '#24103F',
    fontSize: 15,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#32165C',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.5,
  },
  messageBox: {
    marginTop: 15,
    padding: 13,
    borderRadius: 12,
    backgroundColor: '#F4EFF9',
  },
  messageText: {
    color: '#65409A',
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D8B66C',
    padding: 22,
  },
  emptyText: {
    color: '#777',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
  playlistCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E8E0D2',
    padding: 15,
    marginBottom: 11,
  },
  selectedPlaylistCard: {
    borderColor: '#65409A',
    borderWidth: 2,
  },
  playlistMain: {
    paddingBottom: 8,
  },
  playlistName: {
    color: '#32165C',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateText: {
    color: '#999',
    fontSize: 11,
    marginTop: 5,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 22,
    marginTop: 7,
  },
  renameText: {
    color: '#65409A',
    fontSize: 13,
    fontWeight: 'bold',
  },
  deleteText: {
    color: '#C0392B',
    fontSize: 13,
    fontWeight: 'bold',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8E0D2',
    padding: 17,
    marginTop: 25,
  },
  detailsSubtitle: {
    color: '#888',
    fontSize: 13,
    marginTop: -5,
    marginBottom: 15,
  },
  songRow: {
    backgroundColor: '#FAF8F4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: '#32165C',
    fontSize: 14,
    fontWeight: '600',
  },
  songArtist: {
    color: '#888',
    fontSize: 11,
    marginTop: 4,
  },
  addSongsSection: {
    borderTopWidth: 1,
    borderTopColor: '#E9E1D3',
    marginTop: 20,
    paddingTop: 18,
  },
  addSongRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: 11,
    borderWidth: 1,
    borderColor: '#F0EBE3',
    borderRadius: 11,
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: '#32165C',
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  addedButton: {
    backgroundColor: '#A9A9A9',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectPrompt: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  musicIcon: {
    color: '#D8B66C',
    fontSize: 45,
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 10, 35, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FAF8F4',
    borderRadius: 18,
    padding: 20,
  },
  modalTitle: {
    color: '#32165C',
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 17,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },
  cancelButton: {
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#65409A',
    fontWeight: '600',
  },
});
