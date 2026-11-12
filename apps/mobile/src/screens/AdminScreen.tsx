
import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
  StatusBar,
  TextInput,
  Modal,
} from 'react-native';

import { supabase } from '../lib/supabase';
import ManageSongsScreen from './ManageSongsScreen';

const COLORS = {
  purple: '#32165C',
  deepPurple: '#24103F',
  gold: '#D8B66C',
  ivory: '#FAF8F4',
  white: '#FFFFFF',
  muted: '#77717F',
  border: '#EEE9F2',
};

type RecentSong = {
  id: string;
  title: string;
  language: string;
  created_at: string;
};

export default function AdminScreen() {
  const [email, setEmail] = useState('');
  const [songCount, setSongCount] = useState<number | null>(null);
  const [teluguCount, setTeluguCount] = useState(0);
  const [englishCount, setEnglishCount] = useState(0);
  const [recentSongs, setRecentSongs] = useState<RecentSong[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Song form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState<'te' | 'en'>('te');
  const [lyrics, setLyrics] = useState('');
  const [lyricsTransliteration, setLyricsTransliteration] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [saving, setSaving] = useState(false);

  // Manage Songs navigation state
  const [showManageSongs, setShowManageSongs] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert('Authentication Error', 'Please sign in again.');
        setLoading(false);
        return;
      }

      setEmail(user.email ?? '');

      const [total, telugu, english, recent] = await Promise.all([
        supabase.from('songs').select('*', {
          count: 'exact',
          head: true,
        }),

        supabase
          .from('songs')
          .select('*', { count: 'exact', head: true })
          .eq('language', 'te'),

        supabase
          .from('songs')
          .select('*', { count: 'exact', head: true })
          .eq('language', 'en'),

        supabase
          .from('songs')
          .select('id, title, language, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      if (total.error || telugu.error || english.error || recent.error) {
        Alert.alert(
          'Dashboard Error',
          total.error?.message ||
            telugu.error?.message ||
            english.error?.message ||
            recent.error?.message ||
            'Unable to load dashboard data.'
        );
      } else {
        setSongCount(total.count ?? 0);
        setTeluguCount(telugu.count ?? 0);
        setEnglishCount(english.count ?? 0);
        setRecentSongs(recent.data ?? []);
      }
    } catch (error) {
      Alert.alert(
        'Dashboard Error',
        error instanceof Error ? error.message : 'Unable to load dashboard.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSong() {
    if (!title.trim() || !lyrics.trim()) {
      Alert.alert(
        'Missing Details',
        'Please enter the song title and lyrics.'
      );
      return;
    }

    if (language === 'te' && !lyricsTransliteration.trim()) {
      Alert.alert(
        'Missing Details',
        'Please enter the English transliteration of Telugu lyrics.'
      );
      return;
    }

    if (youtubeUrl.trim()) {
      try {
        const parsedUrl = new URL(youtubeUrl.trim());

        const allowedHosts = [
          'youtube.com',
          'www.youtube.com',
          'm.youtube.com',
          'youtu.be',
        ];

        if (
          !['http:', 'https:'].includes(parsedUrl.protocol) ||
          !allowedHosts.includes(parsedUrl.hostname)
        ) {
          Alert.alert('Invalid Link', 'Please enter a valid YouTube URL.');
          return;
        }
      } catch {
        Alert.alert('Invalid Link', 'Please enter a valid YouTube URL.');
        return;
      }
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (
        userError ||
        !user ||
        !['admin', 'super_admin'].includes(
          String(user.app_metadata?.role)
        )
      ) {
        Alert.alert(
          'Access Denied',
          'Administrator access is required.'
        );
        return;
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

      if (error) {
        Alert.alert('Could Not Publish', error.message);
        return;
      }

      setTitle('');
      setLanguage('te');
      setLyrics('');
      setLyricsTransliteration('');
      setYoutubeUrl('');
      setShowAddForm(false);

      await loadDashboard();

      Alert.alert(
        'Success',
        'Your song has been published successfully!'
      );
    } catch (error) {
      Alert.alert(
        'Could Not Publish',
        error instanceof Error ? error.message : 'Unable to publish song.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert('Sign Out Failed', error.message);
    }
  }

  // Open Manage Songs instead of showing the placeholder alert.
  if (showManageSongs) {
    return (
      <ManageSongsScreen
        onBack={() => {
          setShowManageSongs(false);
          void loadDashboard();
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>WORSHIPVERSE</Text>
            <Text style={styles.church}>SHARON A.G. CHURCH</Text>
          </View>

          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
        </View>

        {/* Welcome */}
        <View style={styles.welcome}>
          <Text style={styles.welcomeLabel}>ADMINISTRATION</Text>
          <Text style={styles.heading}>Dashboard</Text>
          <Text style={styles.subtitle}>
            Manage your worship library.
          </Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        {/* Library Statistics */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Library Overview</Text>

          <TouchableOpacity onPress={loadDashboard} disabled={loading}>
            <Text style={styles.refresh}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Total Songs */}
        <View style={styles.totalCard}>
          <View>
            <Text style={styles.totalLabel}>
              TOTAL PUBLISHED SONGS
            </Text>

            {loading ? (
              <ActivityIndicator
                color={COLORS.gold}
                style={{ marginTop: 12 }}
              />
            ) : (
              <Text style={styles.totalCount}>
                {songCount ?? 0}
              </Text>
            )}

            <Text style={styles.totalCaption}>
              Songs in your library
            </Text>
          </View>

          <View style={styles.musicIcon}>
            <Text style={styles.musicIconText}>♫</Text>
          </View>
        </View>

        {/* Telugu and English Statistics */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statSymbol}>తెలుగు</Text>
            <Text style={styles.statCount}>
              {loading ? '—' : teluguCount}
            </Text>
            <Text style={styles.statLabel}>Telugu Songs</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statSymbol}>EN</Text>
            <Text style={styles.statCount}>
              {loading ? '—' : englishCount}
            </Text>
            <Text style={styles.statLabel}>English Songs</Text>
          </View>
        </View>

        {/* Recently Published */}
        <Text style={styles.sectionTitle}>
          Recently Published
        </Text>

        <View style={styles.recentList}>
          {loading ? (
            <ActivityIndicator color={COLORS.purple} />
          ) : recentSongs.length > 0 ? (
            recentSongs.map((song) => (
              <View key={song.id} style={styles.recentSongCard}>
                <View style={styles.recentSongIcon}>
                  <Text style={styles.recentSongIconText}>♫</Text>
                </View>

                <View style={styles.recentSongContent}>
                  <Text
                    style={styles.recentSongTitle}
                    numberOfLines={1}
                  >
                    {song.title}
                  </Text>

                  <Text style={styles.recentSongLanguage}>
                    {song.language === 'te' ? 'Telugu' : 'English'}
                  </Text>
                </View>

                <Text style={styles.recentSongDate}>
                  {song.created_at
                    ? new Date(song.created_at).toLocaleDateString()
                    : ''}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyRecent}>
              No songs published yet.
            </Text>
          )}
        </View>

        {/* Song Management */}
        <Text style={styles.sectionTitle}>Song Management</Text>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => setShowAddForm(true)}
        >
          <View style={styles.actionIcon}>
            <Text style={styles.actionIconText}>＋</Text>
          </View>

          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Add New Song</Text>
            <Text style={styles.actionDescription}>
              Publish a Telugu or English worship song.
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => setShowManageSongs(true)}
        >
          <View style={styles.actionIcon}>
            <Text style={styles.actionIconText}>♫</Text>
          </View>

          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Manage Songs</Text>
            <Text style={styles.actionDescription}>
              View, edit and organize your library.
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>WorshipVerse Admin</Text>
          <Text style={styles.footerText}>
            Every Song, A Prayer. Every Verse, A Praise.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.signOut}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>
          WORSHIPVERSE • ADMIN PANEL
        </Text>
      </ScrollView>

      {/* Add Song Modal */}
      <Modal
        visible={showAddForm}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddForm(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalEyebrow}>SONG LIBRARY</Text>
                  <Text style={styles.modalTitle}>Add New Song</Text>
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowAddForm(false)}
                  disabled={saving}
                >
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Song Title *</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter song title"
                placeholderTextColor="#A49BAA"
                value={title}
                onChangeText={setTitle}
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

              <Text style={styles.inputLabel}>
                {language === 'te'
                  ? 'Telugu Song Lyrics *'
                  : 'Song Lyrics *'}
              </Text>

              <TextInput
                style={[styles.input, styles.lyricsInput]}
                placeholder={
                  language === 'te'
                    ? 'ఇక్కడ పూర్తి పాట సాహిత్యాన్ని నమోదు చేయండి...'
                    : 'Enter complete song lyrics...'
                }
                placeholderTextColor="#A49BAA"
                value={lyrics}
                onChangeText={setLyrics}
                multiline
                textAlignVertical="top"
              />

              {language === 'te' && (
                <>
                  <Text style={styles.inputLabel}>
                    English Transliteration *
                  </Text>

                  <Text style={styles.helperText}>
                    Enter the same Telugu lyrics using English letters.
                    Do not translate them into English.
                  </Text>

                  <TextInput
                    style={[styles.input, styles.lyricsInput]}
                    placeholder={
                      'Enter Telugu lyrics in English letters...\n\nExample:\nNee prema chaalunu\nNee krupa chaalunu'
                    }
                    placeholderTextColor="#A49BAA"
                    value={lyricsTransliteration}
                    onChangeText={setLyricsTransliteration}
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
                placeholder="https://youtube.com/..."
                placeholderTextColor="#A49BAA"
                value={youtubeUrl}
                onChangeText={setYoutubeUrl}
                autoCapitalize="none"
                keyboardType="url"
              />

              <TouchableOpacity
                style={[
                  styles.publishButton,
                  saving && styles.disabledButton,
                ]}
                onPress={handleAddSong}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.publishButtonText}>
                    Publish Song
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddForm(false)}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
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
    paddingHorizontal: 24,
    paddingTop: 55,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  brand: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: 2,
  },

  church: {
    color: COLORS.gold,
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 5,
  },

  adminBadge: {
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  adminBadgeText: {
    color: COLORS.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

  welcome: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 24,
  },

  welcomeLabel: {
    color: '#A17D43',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },

  heading: {
    color: COLORS.purple,
    fontSize: 32,
    fontWeight: '800',
    marginTop: 7,
  },

  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 5,
  },

  email: {
    color: COLORS.purple,
    fontSize: 12,
    marginTop: 12,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 14,
  },

  sectionTitle: {
    color: COLORS.purple,
    fontSize: 17,
    fontWeight: '800',
    marginHorizontal: 24,
    marginTop: 28,
    marginBottom: 14,
  },

  refresh: {
    color: '#9A7439',
    fontSize: 13,
    fontWeight: '700',
  },

  totalCard: {
    marginHorizontal: 24,
    backgroundColor: COLORS.purple,
    borderRadius: 20,
    padding: 23,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  totalLabel: {
    color: '#E8D8B5',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },

  totalCount: {
    color: COLORS.white,
    fontSize: 42,
    fontWeight: '800',
    marginTop: 7,
  },

  totalCaption: {
    color: '#D8CBE5',
    fontSize: 12,
    marginTop: 3,
  },

  musicIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#4A2C70',
    alignItems: 'center',
    justifyContent: 'center',
  },

  musicIconText: {
    color: COLORS.gold,
    fontSize: 34,
  },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginTop: 14,
    gap: 12,
  },

  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 17,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statSymbol: {
    color: '#A17D43',
    fontSize: 13,
    fontWeight: '800',
  },

  statCount: {
    color: COLORS.purple,
    fontSize: 27,
    fontWeight: '800',
    marginTop: 10,
  },

  statLabel: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 4,
  },

  recentList: {
    marginHorizontal: 24,
    gap: 10,
  },

  recentSongCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  recentSongIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F1EAF8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  recentSongIconText: {
    color: COLORS.purple,
    fontSize: 23,
  },

  recentSongContent: {
    flex: 1,
    marginLeft: 12,
  },

  recentSongTitle: {
    color: COLORS.purple,
    fontSize: 13,
    fontWeight: '800',
  },

  recentSongLanguage: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 4,
  },

  recentSongDate: {
    color: COLORS.muted,
    fontSize: 10,
    marginLeft: 8,
  },

  emptyRecent: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: 'center',
    padding: 20,
    backgroundColor: COLORS.white,
    borderRadius: 14,
  },

  actionCard: {
    marginHorizontal: 24,
    marginBottom: 12,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  actionIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: '#F1EAF8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionIconText: {
    color: COLORS.purple,
    fontSize: 25,
    fontWeight: '700',
  },

  actionContent: {
    flex: 1,
    marginLeft: 13,
  },

  actionTitle: {
    color: COLORS.purple,
    fontSize: 14,
    fontWeight: '800',
  },

  actionDescription: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 4,
  },

  arrow: {
    color: '#A17D43',
    fontSize: 27,
  },

  footerCard: {
    marginHorizontal: 24,
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#F0EAF5',
    alignItems: 'center',
  },

  footerTitle: {
    color: COLORS.purple,
    fontSize: 14,
    fontWeight: '800',
  },

  footerText: {
    color: COLORS.muted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 7,
  },

  signOut: {
    marginHorizontal: 24,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#D9CBE5',
    borderRadius: 13,
    padding: 15,
    alignItems: 'center',
  },

  signOutText: {
    color: COLORS.purple,
    fontSize: 14,
    fontWeight: '700',
  },

  version: {
    color: '#A49BAA',
    fontSize: 9,
    textAlign: 'center',
    letterSpacing: 1.5,
    marginTop: 20,
    marginBottom: 35,
  },

  // Add Song modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 10, 35, 0.65)',
    justifyContent: 'flex-end',
  },

  modalCard: {
    backgroundColor: COLORS.ivory,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 24,
    paddingTop: 25,
    paddingBottom: 30,
    maxHeight: '92%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },

  modalEyebrow: {
    color: '#A17D43',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },

  modalTitle: {
    color: COLORS.purple,
    fontSize: 25,
    fontWeight: '800',
    marginTop: 6,
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
    paddingHorizontal: 15,
    paddingVertical: 14,
    color: COLORS.purple,
    fontSize: 14,
  },

  lyricsInput: {
    minHeight: 150,
    textAlignVertical: 'top',
  },

  helperText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
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

  publishButton: {
    backgroundColor: COLORS.purple,
    borderRadius: 13,
    padding: 17,
    alignItems: 'center',
    marginTop: 28,
  },

  disabledButton: {
    opacity: 0.65,
  },

  publishButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },

  cancelButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 5,
  },

  cancelButtonText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: '700',
  },
});
