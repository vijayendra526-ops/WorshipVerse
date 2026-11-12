
import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  StatusBar,
} from 'react-native';

import { supabase } from '../lib/supabase';

const COLORS = {
  purple: '#32165C',
  deepPurple: '#24103F',
  gold: '#D8B66C',
  ivory: '#FAF8F4',
  white: '#FFFFFF',
  muted: '#77717F',
  border: '#EEE9F2',
};

type Language = 'te' | 'en';
type Filter = 'all' | Language;

type Song = {
  id: string;
  title: string;
  language: Language;
  lyrics: string;
  lyrics_transliteration: string | null;
  youtube_url: string | null;
  created_at: string;
};

type Props = {
  onBack: () => void;
};

export default function ManageSongsScreen({ onBack }: Props) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState<Language>('te');
  const [lyrics, setLyrics] = useState('');
  const [lyricsTransliteration, setLyricsTransliteration] =
    useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadSongs();
  }, []);

  async function checkAdmin() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (
      error ||
      !user ||
      !['admin', 'super_admin'].includes(
        String(user.app_metadata?.role)
      )
    ) {
      throw new Error('Administrator access is required.');
    }

    return user;
  }

  async function loadSongs() {
    setLoading(true);

    try {
      await checkAdmin();

      const { data, error } = await supabase
        .from('songs')
        .select(
          'id, title, language, lyrics, lyrics_transliteration, youtube_url, created_at'
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSongs((data ?? []) as Song[]);
    } catch (error) {
      Alert.alert(
        'Unable to Load Songs',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  function openEditor(song: Song) {
    setSelectedSong(song);
    setTitle(song.title);
    setLanguage(song.language);
    setLyrics(song.lyrics);
    setLyricsTransliteration(
      song.lyrics_transliteration ?? ''
    );
    setYoutubeUrl(song.youtube_url ?? '');
  }

  function closeEditor() {
    if (saving) return;

    setSelectedSong(null);
    setTitle('');
    setLanguage('te');
    setLyrics('');
    setLyricsTransliteration('');
    setYoutubeUrl('');
  }

  function validateYouTubeUrl(value: string) {
    if (!value.trim()) return true;

    try {
      const url = new URL(value.trim());

      const allowedHosts = [
        'youtube.com',
        'www.youtube.com',
        'm.youtube.com',
        'youtu.be',
      ];

      return (
        ['http:', 'https:'].includes(url.protocol) &&
        allowedHosts.includes(url.hostname)
      );
    } catch {
      return false;
    }
  }

  async function handleSave() {
    if (!selectedSong) return;

    if (!title.trim()) {
      Alert.alert('Missing Details', 'Please enter the song title.');
      return;
    }

    if (!lyrics.trim()) {
      Alert.alert('Missing Details', 'Please enter the song lyrics.');
      return;
    }

    if (language === 'te' && !lyricsTransliteration.trim()) {
      Alert.alert(
        'Missing Details',
        'Please enter the Telugu transliteration.'
      );
      return;
    }

    if (!validateYouTubeUrl(youtubeUrl)) {
      Alert.alert('Invalid Link', 'Please enter a valid YouTube link.');
      return;
    }

    setSaving(true);

    try {
      await checkAdmin();

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
        .eq('id', selectedSong.id);

      if (error) throw error;

      Alert.alert('Success', 'Song updated successfully!');

      setSelectedSong(null);
      await loadSongs();
    } catch (error) {
      Alert.alert(
        'Update Failed',
        error instanceof Error ? error.message : 'Unable to update song.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteSong(songId: string) {
    setDeletingId(songId);

    try {
      await checkAdmin();

      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', songId);

      if (error) throw error;

      setSongs((current) =>
        current.filter((song) => song.id !== songId)
      );

      Alert.alert('Deleted', 'Song deleted successfully.');
    } catch (error) {
      Alert.alert(
        'Delete Failed',
        error instanceof Error ? error.message : 'Unable to delete song.'
      );
    } finally {
      setDeletingId(null);
    }
  }

  function confirmDelete(song: Song) {
    Alert.alert(
      'Delete Song?',
      `Are you sure you want to delete "${song.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteSong(song.id);
          },
        },
      ]
    );
  }

  const filteredSongs = songs.filter((song) => {
    const matchesSearch = song.title
      .toLowerCase()
      .includes(search.trim().toLowerCase());

    const matchesLanguage =
      filter === 'all' || song.language === filter;

    return matchesSearch && matchesLanguage;
  });

  const teluguCount = songs.filter(
    (song) => song.language === 'te'
  ).length;

  const englishCount = songs.filter(
    (song) => song.language === 'en'
  ).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.brand}>WORSHIPVERSE</Text>
          <Text style={styles.church}>SHARON A.G. CHURCH</Text>
        </View>

        <Text style={styles.adminBadge}>ADMIN</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.pageHeading}>
          <Text style={styles.eyebrow}>SONG LIBRARY</Text>
          <Text style={styles.heading}>Manage Songs</Text>
          <Text style={styles.subtitle}>
            Search, edit and organize your worship songs.
          </Text>
        </View>

        {/* Statistics */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{songs.length}</Text>
            <Text style={styles.statLabel}>All Songs</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{teluguCount}</Text>
            <Text style={styles.statLabel}>Telugu</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{englishCount}</Text>
            <Text style={styles.statLabel}>English</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search songs by title..."
            placeholderTextColor="#A49BAA"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Language Filters */}
        <View style={styles.filterRow}>
          {([
            { label: 'All Songs', value: 'all' },
            { label: 'Telugu', value: 'te' },
            { label: 'English', value: 'en' },
          ] as { label: string; value: Filter }[]).map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.filterButton,
                filter === item.value && styles.filterSelected,
              ]}
              onPress={() => setFilter(item.value)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === item.value && styles.filterTextSelected,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Library Header */}
        <View style={styles.libraryHeader}>
          <View>
            <Text style={styles.libraryTitle}>Your Song Library</Text>
            <Text style={styles.libraryCount}>
              {filteredSongs.length} songs found
            </Text>
          </View>

          <TouchableOpacity
            onPress={loadSongs}
            disabled={loading}
          >
            <Text style={styles.refresh}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator
            color={COLORS.purple}
            size="large"
            style={{ marginTop: 40 }}
          />
        ) : filteredSongs.length > 0 ? (
          <View style={styles.songList}>
            {filteredSongs.map((song) => (
              <View key={song.id} style={styles.songCard}>
                <View style={styles.songTop}>
                  <View style={styles.songIcon}>
                    <Text style={styles.songIconText}>♫</Text>
                  </View>

                  <View style={styles.songInfo}>
                    <Text style={styles.songTitle}>
                      {song.title}
                    </Text>

                    <Text style={styles.songLanguage}>
                      {song.language === 'te' ? 'తెలుగు · Telugu' : 'English'}
                    </Text>

                    <Text style={styles.songDate}>
                      Published:{' '}
                      {song.created_at
                        ? new Date(song.created_at).toLocaleDateString()
                        : 'Unknown'}
                    </Text>
                  </View>
                </View>

                <View style={styles.songActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditor(song)}
                  >
                    <Text style={styles.editButtonText}>Edit Song</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => confirmDelete(song)}
                    disabled={deletingId === song.id}
                  >
                    {deletingId === song.id ? (
                      <ActivityIndicator color="#B42318" />
                    ) : (
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>♫</Text>
            <Text style={styles.emptyTitle}>No Songs Found</Text>
            <Text style={styles.emptyText}>
              {search || filter !== 'all'
                ? 'Try changing your search or language filter.'
                : 'Your song library is ready for new worship songs.'}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.backDashboard}
          onPress={onBack}
        >
          <Text style={styles.backDashboardText}>
            ← Back to Dashboard
          </Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          WORSHIPVERSE • ADMIN PANEL
        </Text>
      </ScrollView>

      {/* Edit Song Modal */}
      <Modal
        visible={selectedSong !== null}
        animationType="slide"
        transparent
        onRequestClose={closeEditor}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.eyebrow}>SONG EDITOR</Text>
                  <Text style={styles.modalTitle}>Edit Song</Text>
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeEditor}
                  disabled={saving}
                >
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Song Title *</Text>

              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter song title"
                placeholderTextColor="#A49BAA"
              />

              <Text style={styles.inputLabel}>Song Language *</Text>

              <View style={styles.languageRow}>
                <TouchableOpacity
                  style={[
                    styles.languageButton,
                    language === 'te' && styles.languageSelected,
                  ]}
                  onPress={() => setLanguage('te')}
                >
                  <Text
                    style={[
                      styles.languageText,
                      language === 'te' && styles.languageTextSelected,
                    ]}
                  >
                    తెలుగు
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.languageButton,
                    language === 'en' && styles.languageSelected,
                  ]}
                  onPress={() => setLanguage('en')}
                >
                  <Text
                    style={[
                      styles.languageText,
                      language === 'en' && styles.languageTextSelected,
                    ]}
                  >
                    English
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Song Lyrics *</Text>

              <TextInput
                style={[styles.input, styles.lyricsInput]}
                value={lyrics}
                onChangeText={setLyrics}
                placeholder="Enter the original song lyrics..."
                placeholderTextColor="#A49BAA"
                multiline
                textAlignVertical="top"
              />

              {language === 'te' && (
                <>
                  <Text style={styles.inputLabel}>
                    Telugu Transliteration (English Letters) *
                  </Text>

                  <Text style={styles.helperText}>
                    Write the Telugu song using English letters.
                    This is transliteration, not an English translation.
                  </Text>

                  <TextInput
                    style={[styles.input, styles.lyricsInput]}
                    value={lyricsTransliteration}
                    onChangeText={setLyricsTransliteration}
                    placeholder={'Example:\nYesu Naa Rakshakudu\nNannu Preminchina Devudu'}
                    placeholderTextColor="#A49BAA"
                    multiline
                    textAlignVertical="top"
                  />
                </>
              )}

              <Text style={styles.inputLabel}>
                YouTube Link (Optional)
              </Text>

              <TextInput
                style={styles.input}
                value={youtubeUrl}
                onChangeText={setYoutubeUrl}
                placeholder="https://www.youtube.com/..."
                placeholderTextColor="#A49BAA"
                autoCapitalize="none"
                keyboardType="url"
              />

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  saving && styles.disabledButton,
                ]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.saveButtonText}>
                    Save Changes
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeEditor}
                disabled={saving}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ivory,
  },
  header: {
    backgroundColor: COLORS.deepPurple,
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 34,
    height: 38,
    justifyContent: 'center',
  },
  backText: {
    color: COLORS.gold,
    fontSize: 34,
  },
  brand: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  church: {
    color: COLORS.gold,
    fontSize: 9,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  adminBadge: {
    color: COLORS.gold,
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 9,
    fontWeight: '800',
  },
  pageHeading: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
  },
  eyebrow: {
    color: '#A17D43',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  heading: {
    color: COLORS.purple,
    fontSize: 29,
    fontWeight: '800',
    marginTop: 7,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 9,
    marginHorizontal: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNumber: {
    color: COLORS.purple,
    fontSize: 23,
    fontWeight: '800',
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 4,
  },
  searchContainer: {
    marginHorizontal: 20,
    marginTop: 22,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  searchIcon: {
    color: '#A17D43',
    fontSize: 25,
  },
  searchInput: {
    flex: 1,
    color: COLORS.purple,
    paddingVertical: 14,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 14,
  },
  filterButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterSelected: {
    backgroundColor: COLORS.purple,
    borderColor: COLORS.purple,
  },
  filterText: {
    color: COLORS.purple,
    fontSize: 11,
    fontWeight: '700',
  },
  filterTextSelected: {
    color: COLORS.white,
  },
  libraryHeader: {
    marginHorizontal: 24,
    marginTop: 27,
    marginBottom: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  libraryTitle: {
    color: COLORS.purple,
    fontSize: 17,
    fontWeight: '800',
  },
  libraryCount: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 4,
  },
  refresh: {
    color: '#9A7439',
    fontWeight: '700',
    fontSize: 12,
  },
  songList: {
    marginHorizontal: 20,
    gap: 12,
  },
  songCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  songTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  songIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#F1EAF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  songIconText: {
    color: COLORS.purple,
    fontSize: 24,
  },
  songInfo: {
    flex: 1,
    marginLeft: 12,
  },
  songTitle: {
    color: COLORS.purple,
    fontSize: 14,
    fontWeight: '800',
  },
  songLanguage: {
    color: '#A17D43',
    fontSize: 11,
    marginTop: 4,
  },
  songDate: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 4,
  },
  songActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0EBE3',
    paddingTop: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: COLORS.purple,
    borderRadius: 9,
    padding: 11,
    alignItems: 'center',
  },
  editButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FFF1F0',
    borderRadius: 9,
    padding: 11,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#B42318',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyCard: {
    marginHorizontal: 20,
    marginTop: 8,
    padding: 30,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyIcon: {
    color: '#A17D43',
    fontSize: 35,
  },
  emptyTitle: {
    color: COLORS.purple,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 10,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 7,
  },
  backDashboard: {
    marginHorizontal: 20,
    marginTop: 25,
    padding: 15,
    borderWidth: 1,
    borderColor: '#D9CBE5',
    borderRadius: 12,
    alignItems: 'center',
  },
  backDashboardText: {
    color: COLORS.purple,
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    color: '#A49BAA',
    fontSize: 9,
    textAlign: 'center',
    letterSpacing: 1.5,
    marginTop: 22,
    marginBottom: 35,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 10, 35, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.ivory,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 28,
    maxHeight: '94%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    color: COLORS.purple,
    fontSize: 25,
    fontWeight: '800',
    marginTop: 5,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0EAF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: COLORS.purple,
    fontSize: 17,
    fontWeight: '700',
  },
  inputLabel: {
    color: COLORS.purple,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 9,
    marginTop: 17,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: COLORS.purple,
    fontSize: 14,
  },
  lyricsInput: {
    minHeight: 145,
    textAlignVertical: 'top',
  },
  languageRow: {
    flexDirection: 'row',
    gap: 12,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    alignItems: 'center',
  },
  languageSelected: {
    backgroundColor: COLORS.purple,
    borderColor: COLORS.purple,
  },
  languageText: {
    color: COLORS.purple,
    fontSize: 14,
    fontWeight: '700',
  },
  languageTextSelected: {
    color: COLORS.white,
  },
  helperText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: COLORS.purple,
    borderRadius: 13,
    padding: 16,
    alignItems: 'center',
    marginTop: 25,
  },
  disabledButton: {
    opacity: 0.65,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
  cancelButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 5,
  },
  cancelText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: '700',
  },
});
