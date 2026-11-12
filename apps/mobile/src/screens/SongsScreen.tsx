
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Keyboard,
  ActivityIndicator,
  Alert,
} from 'react-native';

import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

import Sanscript from '@indic-transliteration/sanscript';

import {
  getOfflineSongs,
  syncOfflineSongs,
} from '../lib/offlineSongs';

import SongDetailsScreen from './SongDetailsScreen';

type Language = 'en' | 'te';

type Song = {
  id: string;
  title: string;
  artist: string | null;
  language: string;
  lyrics: string;
  lyrics_transliteration?: string | null;
  youtube_url: string | null;
};

type SongsScreenProps = {
  language: Language;
  initialSearch?: string;
  onBack: () => void;
};

// Convert Romanized Telugu into Telugu script.
function convertRomanizedTelugu(query: string): string {
  const input = query.trim().toLowerCase();

  if (!input || /[\u0C00-\u0C7F]/.test(input)) {
    return input;
  }

  return Sanscript.t(
    input,
    'itrans_dravidian',
    'telugu'
  );
}

// Normalize Telugu text so short and long vowel differences
// do not prevent a search match.
function normalizeTelugu(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u0C3E-\u0C4C\u0C55-\u0C56]/g, '')
    .replace(/\s+/g, '');
}

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
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Prevent an older language request from overwriting newer results.
  const [requestVersion, setRequestVersion] = useState(0);

  // VOICE SEARCH RESULT
  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results?.[0]?.transcript;

    if (transcript) {
      setSearch(transcript);
    }
  });

  // VOICE SEARCH COMPLETED
  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
  });

  // VOICE SEARCH ERROR
  useSpeechRecognitionEvent('error', (event) => {
    setIsListening(false);
    console.log('Speech recognition error:', event);
  });

  // LOAD CACHED SONGS FIRST, THEN SYNC WITH SUPABASE
  const loadSongs = useCallback(async () => {
    setError('');

    let cachedSongs: Song[] = [];

    // STEP 1: READ LOCAL SQLITE STORAGE
    try {
      cachedSongs = await getOfflineSongs(activeLanguage);

      if (cachedSongs.length > 0) {
        setSongs(cachedSongs);
        setLoading(false);
      } else {
        setSongs([]);
        setLoading(true);
      }
    } catch (cacheError) {
      console.error('Offline storage error:', cacheError);

      setSongs([]);
      setLoading(false);
      setError('Unable to access offline song storage.');
      return;
    }

    // STEP 2: SYNC WITH SUPABASE IN THE BACKGROUND
    try {
      const updatedSongs = await syncOfflineSongs();

      setSongs(
        updatedSongs.filter(
          (song) => song.language === activeLanguage
        )
      );

      setError('');
    } catch (syncError) {
      console.error('Supabase song sync error:', syncError);

      // Keep cached songs if internet is unavailable.
      if (cachedSongs.length === 0) {
        setSongs([]);
        setError(
          'Unable to load songs. Please check your internet connection.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [activeLanguage]);

  // LOAD SONGS WHEN SCREEN OPENS OR LANGUAGE CHANGES
  useEffect(() => {
    loadSongs();
  }, [loadSongs, requestVersion]);

  // START VOICE SEARCH
  const startVoiceSearch = async () => {
    try {
      Keyboard.dismiss();

      await ExpoSpeechRecognitionModule.requestPermissionsAsync();

      setIsListening(true);

      await ExpoSpeechRecognitionModule.start({
        lang: activeLanguage === 'te' ? 'te-IN' : 'en-IN',
        interimResults: false,
        continuous: false,
      });
    } catch (err) {
      console.error('Voice search error:', err);
      setIsListening(false);

      Alert.alert(
        'Voice Search',
        'Unable to start voice search. Please check microphone permissions.'
      );
    }
  };

  // STOP VOICE SEARCH
  const stopVoiceSearch = async () => {
    try {
      await ExpoSpeechRecognitionModule.stop();
    } catch (err) {
      console.error('Unable to stop voice search:', err);
    }

    setIsListening(false);
  };

  // FILTER SONGS
  const filteredSongs = songs.filter((song) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    const title = song.title?.toLowerCase() ?? '';
    const artist = song.artist?.toLowerCase() ?? '';

    // Direct English or Telugu search.
    if (
      title.includes(query) ||
      artist.includes(query)
    ) {
      return true;
    }

    // Romanized Telugu search.
    if (
      activeLanguage === 'te' &&
      /^[a-z\s]+$/i.test(query)
    ) {
      const convertedQuery = convertRomanizedTelugu(query);
      const normalizedQuery = normalizeTelugu(convertedQuery);

      const normalizedTitle = normalizeTelugu(title);
      const normalizedArtist = normalizeTelugu(artist);

      return (
        normalizedTitle.includes(normalizedQuery) ||
        normalizedArtist.includes(normalizedQuery)
      );
    }

    return false;
  });

  // OPEN SONG DETAILS
  if (selectedSong) {
    return (
      <SongDetailsScreen
        song={selectedSong}
        onBack={() => setSelectedSong(null)}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
        >
          <Text style={styles.backText}>
            {activeLanguage === 'te' ? '← వెనుకకు' : '← Back'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.logo}>WorshipVerse</Text>

        <Text style={styles.headerSubtitle}>
          SHARON A.G. CHURCH
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* PAGE INTRODUCTION */}
        <View style={styles.intro}>
          <Text style={styles.eyebrow}>
            WORSHIPVERSE LIBRARY
          </Text>

          <Text style={styles.heading}>
            {activeLanguage === 'te'
              ? 'తెలుగు పాటలు'
              : 'Songs Library'}
          </Text>

          <Text style={styles.description}>
            {activeLanguage === 'te'
              ? 'తెలుగు ఆరాధన పాటలను అన్వేషించండి'
              : 'Discover songs of worship and praise'}
          </Text>
        </View>

        {/* LANGUAGE SELECTOR */}
        <View style={styles.languageContainer}>
          <TouchableOpacity
            style={[
              styles.languageButton,
              activeLanguage === 'te' &&
                styles.activeLanguageButton,
            ]}
            onPress={() => {
              setActiveLanguage('te');
              setSearch('');
            }}
          >
            <Text
              style={[
                styles.languageText,
                activeLanguage === 'te' &&
                  styles.activeLanguageText,
              ]}
            >
              తెలుగు
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.languageButton,
              activeLanguage === 'en' &&
                styles.activeLanguageButton,
            ]}
            onPress={() => {
              setActiveLanguage('en');
              setSearch('');
            }}
          >
            <Text
              style={[
                styles.languageText,
                activeLanguage === 'en' &&
                  styles.activeLanguageText,
              ]}
            >
              English
            </Text>
          </TouchableOpacity>
        </View>

        {/* SEARCH */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={
              activeLanguage === 'te'
                ? 'పాట పేరు లేదా గాయకుడి పేరు వెతకండి'
                : 'Search songs or artists...'
            }
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />

          <TouchableOpacity
            style={[
              styles.voiceButton,
              isListening && styles.listeningButton,
            ]}
            onPress={
              isListening ? stopVoiceSearch : startVoiceSearch
            }
          >
            <Text style={styles.voiceButtonText}>
              {isListening ? '■' : '🎙'}
            </Text>
          </TouchableOpacity>
        </View>

        {isListening && (
          <Text style={styles.listeningText}>
            {activeLanguage === 'te'
              ? 'వింటున్నాను... మాట్లాడండి'
              : 'Listening... Speak now'}
          </Text>
        )}

        {/* SONG COUNT */}
        {!loading && !error && (
          <Text style={styles.songCount}>
            {filteredSongs.length}{' '}
            {activeLanguage === 'te' ? 'పాటలు' : 'Songs'}
          </Text>
        )}

        {/* LOADING */}
        {loading && (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="large" color="#32165C" />

            <Text style={styles.statusText}>
              {activeLanguage === 'te'
                ? 'పాటలు లోడ్ అవుతున్నాయి...'
                : 'Loading songs...'}
            </Text>
          </View>
        )}

        {/* ERROR */}
        {!loading && error !== '' && (
          <View style={styles.statusContainer}>
            <Text style={styles.errorText}>{error}</Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => setRequestVersion((v) => v + 1)}
            >
              <Text style={styles.retryButtonText}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* EMPTY STATE */}
        {!loading &&
          !error &&
          filteredSongs.length === 0 && (
            <View style={styles.statusContainer}>
              <Text style={styles.emptyIcon}>♫</Text>

              <Text style={styles.emptyTitle}>
                {search.trim()
                  ? activeLanguage === 'te'
                    ? 'పాటలు కనుగొనబడలేదు'
                    : 'No songs found'
                  : activeLanguage === 'te'
                    ? 'ఇంకా పాటలు లేవు'
                    : 'No songs available'}
              </Text>

              <Text style={styles.emptyDescription}>
                {search.trim()
                  ? 'Try searching with another name.'
                  : 'Songs will appear here when they are available.'}
              </Text>
            </View>
          )}

        {/* SONG LIST */}
        {!loading &&
          !error &&
          filteredSongs.map((song) => (
            <TouchableOpacity
              key={song.id}
              style={styles.songCard}
              activeOpacity={0.8}
              onPress={() => {
                Keyboard.dismiss();
                setSelectedSong(song);
              }}
            >
              <View style={styles.songIcon}>
                <Text style={styles.songIconText}>♫</Text>
              </View>

              <View style={styles.songInfo}>
                <Text
                  style={styles.songTitle}
                  numberOfLines={2}
                >
                  {song.title}
                </Text>

                <Text style={styles.artist}>
                  {song.artist || 'WorshipVerse'}
                </Text>

                <Text style={styles.songLanguage}>
                  {song.language === 'te' ? 'తెలుగు' : 'English'}
                </Text>
              </View>

              <View style={styles.viewButton}>
                <Text style={styles.viewButtonText}>
                  {activeLanguage === 'te'
                    ? 'చూడండి'
                    : 'View Song'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>WorshipVerse</Text>

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
  container: {
    flex: 1,
    backgroundColor: '#FAF8F4',
  },

  header: {
    backgroundColor: '#24103F',
    paddingTop: 48,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },

  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 14,
  },

  backText: {
    color: '#D8B66C',
    fontSize: 15,
    fontWeight: '600',
  },

  logo: {
    color: '#D8B66C',
    fontSize: 25,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  headerSubtitle: {
    color: '#FFFFFF',
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 5,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 30,
  },

  intro: {
    marginBottom: 22,
  },

  eyebrow: {
    color: '#A18450',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 10,
  },

  heading: {
    color: '#24103F',
    fontSize: 29,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  description: {
    color: '#777',
    fontSize: 14,
    lineHeight: 21,
  },

  languageContainer: {
    flexDirection: 'row',
    backgroundColor: '#EEE9F2',
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
  },

  languageButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 9,
  },

  activeLanguageButton: {
    backgroundColor: '#32165C',
  },

  languageText: {
    color: '#5C5266',
    fontSize: 14,
    fontWeight: '600',
  },

  activeLanguageText: {
    color: '#FFFFFF',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E0EA',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    minHeight: 52,
  },

  searchInput: {
    flex: 1,
    color: '#24103F',
    fontSize: 14,
    paddingVertical: 12,
  },

  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#32165C',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  listeningButton: {
    backgroundColor: '#A33B3B',
  },

  voiceButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
  },

  listeningText: {
    color: '#A33B3B',
    fontSize: 12,
    marginBottom: 12,
  },

  songCount: {
    color: '#888',
    fontSize: 12,
    marginTop: 12,
    marginBottom: 8,
  },

  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 55,
    paddingHorizontal: 20,
  },

  statusText: {
    color: '#777',
    fontSize: 14,
    marginTop: 14,
  },

  errorText: {
    color: '#A33B3B',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
  },

  retryButton: {
    backgroundColor: '#32165C',
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 9,
    marginTop: 16,
  },

  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  emptyIcon: {
    color: '#D8B66C',
    fontSize: 42,
    marginBottom: 12,
  },

  emptyTitle: {
    color: '#24103F',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  emptyDescription: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },

  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEE8F0',
  },

  songIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#EEE8F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  songIconText: {
    color: '#32165C',
    fontSize: 25,
    fontWeight: 'bold',
  },

  songInfo: {
    flex: 1,
    paddingRight: 8,
  },

  songTitle: {
    color: '#24103F',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 5,
  },

  artist: {
    color: '#777',
    fontSize: 12,
    marginBottom: 5,
  },

  songLanguage: {
    color: '#A18450',
    fontSize: 11,
    fontWeight: '600',
  },

  viewButton: {
    backgroundColor: '#32165C',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
  },

  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },

  footer: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E8E0E9',
    marginTop: 35,
    paddingTop: 24,
  },

  footerLogo: {
    color: '#32165C',
    fontSize: 20,
    fontWeight: 'bold',
  },

  footerTagline: {
    color: '#888',
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
  },

  footerChurch: {
    color: '#A18450',
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 10,
  },
});
