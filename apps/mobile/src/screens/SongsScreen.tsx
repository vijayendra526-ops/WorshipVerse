
import React, { useCallback, useEffect, useState } from 'react';

import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
  Keyboard,
} from 'react-native';

import { supabase } from '../lib/supabase';

import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

type Language = 'en' | 'te';

type Song = {
  id: string;
  title: string;
  artist: string | null;
  language: string;
  lyrics: string;
  youtube_url: string | null;
};

type SongsScreenProps = {
  language: Language;
  initialSearch?: string;
  onBack: () => void;
};

export default function SongsScreen({
  language,
  initialSearch = '',
  onBack,
}: SongsScreenProps) {
  const [activeLanguage, setActiveLanguage] =
    useState<Language>(language);

  const [songs, setSongs] = useState<Song[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSongId, setExpandedSongId] =
    useState<string | null>(null);

  const [listening, setListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState('');

  const isTe = activeLanguage === 'te';

  // VOICE RECOGNITION EVENTS

  useSpeechRecognitionEvent('start', () => {
    setListening(true);
    setVoiceMessage(isTe ? 'వింటున్నాను...' : 'Listening...');
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript =
      event.results[0]?.transcript?.trim() ?? '';

    if (transcript) {
      setSearch(transcript);
      setVoiceMessage(
        isTe ? 'గుర్తించబడింది!' : 'Voice recognized!'
      );
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    setListening(false);

    const message =
      event.message || event.error || 'Unknown error';

    setVoiceMessage(
      isTe
        ? `వాయిస్ శోధన లోపం: ${message}`
        : `Voice search error: ${message}`
    );
  });

  useSpeechRecognitionEvent('end', () => {
    setListening(false);
  });

  // LOAD SONGS FROM SUPABASE

  const loadSongs = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: queryError } = await supabase
        .from('songs')
        .select(
          'id, title, artist, language, lyrics, youtube_url'
        )
        .eq('language', activeLanguage)
        .order('created_at', { ascending: false });

      if (queryError) {
        throw queryError;
      }

      setSongs((data ?? []) as Song[]);
    } catch (err: any) {
      console.error('Songs loading error:', err);
      setError(err?.message || 'Unable to load songs.');
      setSongs([]);
    } finally {
      setLoading(false);
    }
  }, [activeLanguage]);

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  // FILTER SONGS

  const filteredSongs = songs.filter((song) => {
    const query = search.trim().toLocaleLowerCase();

    if (!query) return true;

    return (
      song.title.toLocaleLowerCase().includes(query) ||
      (song.artist ?? '').toLocaleLowerCase().includes(query)
    );
  });

  // CHANGE LANGUAGE

  const changeLanguage = (newLanguage: Language) => {
    if (listening) {
      ExpoSpeechRecognitionModule.stop();
    }

    setActiveLanguage(newLanguage);
    setSearch('');
    setExpandedSongId(null);
    setVoiceMessage('');
    Keyboard.dismiss();
  };

  // START VOICE SEARCH

  const startVoiceSearch = async () => {
    try {
      setVoiceMessage('');

      const permission =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();

      if (!permission.granted) {
        setVoiceMessage(
          isTe
            ? 'మైక్రోఫోన్ అనుమతి అవసరం.'
            : 'Microphone permission is required.'
        );
        return;
      }

      Keyboard.dismiss();

      ExpoSpeechRecognitionModule.start({
        lang: activeLanguage === 'te' ? 'te-IN' : 'en-IN',
        interimResults: true,
        continuous: false,
      });
    } catch (err) {
      console.error('Voice search error:', err);
      setListening(false);
      setVoiceMessage(
        isTe
          ? 'వాయిస్ శోధన ప్రారంభించలేకపోయాము.'
          : 'Unable to start voice search.'
      );
    }
  };

  // STOP VOICE SEARCH

  const stopVoiceSearch = () => {
    ExpoSpeechRecognitionModule.stop();
  };

  // EXPAND / COLLAPSE LYRICS

  const toggleLyrics = (id: string) => {
    setExpandedSongId((current) =>
      current === id ? null : id
    );
  };

  // OPEN YOUTUBE

  const openYouTube = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        'Unable to open YouTube',
        'Please check the video link.'
      );
    }
  };

  // SCREEN UI

  return (
    <View style={styles.screen}>
      {/* TOP HEADER */}

      <View style={styles.libraryHeader}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
        >
          <Text style={styles.backText}>
            {isTe ? '← వెనుకకు' : '← Back'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.libraryBrand}>
          WorshipVerse
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.libraryContent}
      >
        {/* LIBRARY TITLE */}

        <View style={styles.libraryIntro}>
          <Text style={styles.eyebrow}>
            WORSHIPVERSE LIBRARY
          </Text>

          <Text style={styles.libraryTitle}>
            {isTe ? 'తెలుగు పాటలు' : 'English Songs'}
          </Text>

          <Text style={styles.librarySubtitle}>
            {isTe
              ? 'తెలుగు ఆరాధన పాటలను అన్వేషించండి'
              : 'Explore English worship songs'}
          </Text>
        </View>

        {/* LANGUAGE BUTTONS */}

        <View style={styles.languageTabs}>
          <TouchableOpacity
            onPress={() => changeLanguage('te')}
            style={[
              styles.languageTab,
              isTe && styles.languageTabActive,
            ]}
          >
            <Text
              style={[
                styles.languageTabText,
                isTe && styles.languageTabTextActive,
              ]}
            >
              తెలుగు
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => changeLanguage('en')}
            style={[
              styles.languageTab,
              !isTe && styles.languageTabActive,
            ]}
          >
            <Text
              style={[
                styles.languageTabText,
                !isTe && styles.languageTabTextActive,
              ]}
            >
              English
            </Text>
          </TouchableOpacity>
        </View>

        {/* SEARCH WITH VOICE SEARCH */}

        <View style={styles.librarySearch}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={
              isTe
                ? 'పాట పేరు ద్వారా వెతకండి...'
                : 'Search songs by title...'
            }
            placeholderTextColor="#93899D"
            style={styles.librarySearchInput}
            returnKeyType="search"
          />

          <TouchableOpacity
            onPress={
              listening ? stopVoiceSearch : startVoiceSearch
            }
            style={[
              styles.voiceSearchButton,
              listening && styles.voiceSearchButtonActive,
            ]}
            activeOpacity={0.8}
          >
            <Text style={styles.voiceSearchButtonText}>
              {listening ? '■' : '🎙'}
            </Text>
          </TouchableOpacity>

          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch('')}
            >
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {!!voiceMessage && (
          <Text style={styles.voiceMessage}>
            {voiceMessage}
          </Text>
        )}

        {/* SONG COUNT */}

        {!loading && !error && (
          <View style={styles.countRow}>
            <Text style={styles.songCount}>
              {filteredSongs.length} {isTe ? 'పాటలు' : 'songs'}
            </Text>
          </View>
        )}

        {/* LOADING */}

        {loading && (
          <View style={styles.stateContainer}>
            <ActivityIndicator
              size="large"
              color="#32165C"
            />

            <Text style={styles.stateText}>
              {isTe
                ? 'పాటలు లోడ్ అవుతున్నాయి...'
                : 'Loading songs...'}
            </Text>
          </View>
        )}

        {/* ERROR */}

        {!loading && !!error && (
          <View style={styles.stateContainer}>
            <Text style={styles.errorText}>
              {error}
            </Text>

            <TouchableOpacity
              onPress={loadSongs}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* EMPTY */}

        {!loading &&
          !error &&
          filteredSongs.length === 0 && (
            <View style={styles.stateContainer}>
              <Text style={styles.emptyIcon}>♫</Text>

              <Text style={styles.emptyTitle}>
                {songs.length === 0
                  ? isTe
                    ? 'ఇంకా తెలుగు పాటలు లేవు'
                    : 'No English songs yet'
                  : isTe
                    ? 'పాటలు కనుగొనబడలేదు'
                    : 'No songs found'}
              </Text>

              <Text style={styles.stateText}>
                {songs.length === 0
                  ? 'Please check back later.'
                  : 'Try another search.'}
              </Text>
            </View>
          )}

        {/* SONG CARDS */}

        {!loading &&
          !error &&
          filteredSongs.length > 0 && (
            <View style={styles.songList}>
              {filteredSongs.map((song) => {
                const expanded =
                  expandedSongId === song.id;

                return (
                  <View
                    key={song.id}
                    style={styles.songCard}
                  >
                    <Text style={styles.songCardTitle}>
                      {song.title}
                    </Text>

                    {!!song.artist && (
                      <Text style={styles.songArtist}>
                        {song.artist}
                      </Text>
                    )}

                    <TouchableOpacity
                      style={styles.lyricsToggle}
                      onPress={() =>
                        toggleLyrics(song.id)
                      }
                      activeOpacity={0.7}
                    >
                      <Text style={styles.lyricsArrow}>
                        {expanded ? '▼' : '▶'}
                      </Text>

                      <Text style={styles.lyricsToggleText}>
                        {isTe
                          ? expanded
                            ? 'సాహిత్యాన్ని దాచండి'
                            : 'సాహిత్యం చూడండి'
                          : expanded
                            ? 'Hide Lyrics'
                            : 'Show Lyrics'}
                      </Text>
                    </TouchableOpacity>

                    {expanded && (
                      <View style={styles.lyricsBox}>
                        <Text style={styles.lyricsText}>
                          {song.lyrics}
                        </Text>
                      </View>
                    )}

                    {!!song.youtube_url && (
                      <TouchableOpacity
                        style={styles.youtubeButton}
                        onPress={() =>
                          openYouTube(song.youtube_url!)
                        }
                        activeOpacity={0.8}
                      >
                        <Text style={styles.youtubeButtonText}>
                          ▶ Watch on YouTube
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}

        {/* FOOTER */}

        <View style={styles.libraryFooter}>
          <Text style={styles.footerBrand}>
            WorshipVerse
          </Text>

          <Text style={styles.footerTagline}>
            Every Song, A Prayer. Every Verse, A Praise.
          </Text>

          <Text style={styles.footerChurch}>
            SHARON A.G. CHURCH
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF8F4',
  },

  // LIBRARY HEADER

  libraryHeader: {
    backgroundColor: '#32165C',
    paddingHorizontal: 18,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  backButton: {
    paddingVertical: 5,
  },

  backText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  libraryBrand: {
    color: '#D8B66C',
    fontSize: 16,
    fontWeight: '800',
  },

  libraryContent: {
    paddingBottom: 30,
  },

  libraryIntro: {
    paddingHorizontal: 18,
    paddingTop: 25,
  },

  eyebrow: {
    color: '#A17B38',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  libraryTitle: {
    color: '#32165C',
    fontSize: 29,
    fontWeight: '800',
    marginTop: 8,
  },

  librarySubtitle: {
    color: '#77717F',
    fontSize: 14,
    marginTop: 8,
  },

  // LANGUAGE TABS

  languageTabs: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    marginTop: 22,
    gap: 10,
  },

  languageTab: {
    borderWidth: 1,
    borderColor: '#32165C',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },

  languageTabActive: {
    backgroundColor: '#32165C',
  },

  languageTabText: {
    color: '#32165C',
    fontSize: 13,
    fontWeight: '700',
  },

  languageTabTextActive: {
    color: '#FFFFFF',
  },

  // SEARCH

  librarySearch: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCD6E2',
    borderRadius: 13,
    marginHorizontal: 18,
    marginTop: 22,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  librarySearchInput: {
    flex: 1,
    color: '#32165C',
    fontSize: 14,
    paddingVertical: 13,
  },

  voiceSearchButton: {
    backgroundColor: '#32165C',
    borderRadius: 10,
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },

  voiceSearchButtonActive: {
    backgroundColor: '#B42318',
  },

  voiceSearchButtonText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
  },

  voiceMessage: {
    color: '#65409A',
    fontSize: 12,
    marginHorizontal: 20,
    marginTop: 8,
  },

  clearSearch: {
    color: '#77717F',
    fontSize: 16,
    padding: 8,
  },

  // SONG COUNT

  countRow: {
    paddingHorizontal: 20,
    marginTop: 22,
    marginBottom: 12,
  },

  songCount: {
    color: '#A17B38',
    fontSize: 13,
    fontWeight: '700',
  },

  // SONG LIST

  songList: {
    paddingHorizontal: 18,
  },

  songCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9E1D3',
    borderRadius: 17,
    padding: 16,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },

  songCardTitle: {
    color: '#32165C',
    fontSize: 19,
    fontWeight: '800',
    lineHeight: 28,
  },

  songArtist: {
    color: '#A17B38',
    fontSize: 12,
    marginTop: 5,
  },

  // LYRICS

  lyricsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 17,
    paddingVertical: 4,
  },

  lyricsArrow: {
    color: '#65409A',
    fontSize: 12,
    marginRight: 9,
  },

  lyricsToggleText: {
    color: '#65409A',
    fontSize: 14,
    fontWeight: '700',
  },

  lyricsBox: {
    backgroundColor: '#FAF8F4',
    borderRadius: 10,
    padding: 13,
    marginTop: 12,
  },

  lyricsText: {
    color: '#51495A',
    fontSize: 14,
    lineHeight: 24,
  },

  // YOUTUBE

  youtubeButton: {
    backgroundColor: '#32165C',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 17,
    alignItems: 'center',
  },

  youtubeButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // LOADING AND ERROR STATES

  stateContainer: {
    paddingHorizontal: 22,
    paddingVertical: 35,
    alignItems: 'center',
  },

  stateText: {
    color: '#77717F',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
  },

  errorText: {
    color: '#B42318',
    fontSize: 13,
    textAlign: 'center',
  },

  retryButton: {
    backgroundColor: '#32165C',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 15,
  },

  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  emptyIcon: {
    color: '#A17B38',
    fontSize: 42,
  },

  emptyTitle: {
    color: '#32165C',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 12,
    textAlign: 'center',
  },

  // FOOTER

  libraryFooter: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 30,
    marginTop: 10,
  },

  footerBrand: {
    color: '#32165C',
    fontSize: 18,
    fontWeight: '800',
  },

  footerTagline: {
    color: '#98712F',
    fontSize: 10,
    marginTop: 7,
    textAlign: 'center',
  },

  footerChurch: {
    color: '#77717F',
    fontSize: 9,
    marginTop: 8,
  },
});
