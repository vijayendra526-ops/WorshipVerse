import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import Sanscript from '@indic-transliteration/sanscript';
import { getOfflineSongs, syncOfflineSongs } from '../lib/offlineSongs';
import SongDetailsScreen from './SongDetailsScreen';

type Language = 'te' | 'en';

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

const COLORS = {
  dark: '#24103F',
  purple: '#32165C',
  gold: '#D8B66C',
  cream: '#FAF8F4',
  muted: '#746D7B',
  border: '#E9E1ED',
};

/** Search normalization works for both Telugu script and Roman letters. */
function normalizeText(value: string): string {
  return (value || '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^a-z0-9\u0C00-\u0C7F\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** ITRANS is an approximation: everyday Roman Telugu has many spellings. */
function getCandidates(query: string, language: Language): string[] {
  const candidates = [normalizeText(query)];
  const trimmed = query.trim();

  if (language === 'te' && /^[a-z\s]+$/i.test(trimmed)) {
    try {
      candidates.push(
        normalizeText(Sanscript.t(trimmed, 'itrans_dravidian', 'telugu'))
      );
    } catch (error) {
      console.warn('Roman Telugu search conversion:', error);
    }
  }

  return [...new Set(candidates.filter(Boolean))];
}

function scoreSong(song: Song, candidates: string[], language: Language): number {
  const title = normalizeText(song.title);
  let romanTitle = '';

  if (language === 'te' && /[\u0C00-\u0C7F]/.test(song.title)) {
    try {
      romanTitle = normalizeText(
        Sanscript.t(song.title, 'telugu', 'itrans_dravidian')
      );
    } catch {
      // Matching still works with the original Telugu title.
    }
  }

  let best = 0;
  for (const candidate of candidates) {
    if (candidate === title) best = Math.max(best, 4);
    else if (title.startsWith(candidate)) best = Math.max(best, 3);
    else if (title.includes(candidate)) best = Math.max(best, 2);

    if (romanTitle) {
      if (romanTitle === candidate) best = Math.max(best, 3);
      else if (romanTitle.includes(candidate)) best = Math.max(best, 1);
    }
  }
  return best;
}

export default function SongsScreen({
  language,
  initialSearch = '',
  onBack,
}: SongsScreenProps) {
  const [activeLanguage, setActiveLanguage] = useState<Language>(language);
  const [songs, setSongs] = useState<Song[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [alphabetical, setAlphabetical] = useState(false);

  const isTe = activeLanguage === 'te';

  useEffect(() => {
    setActiveLanguage(language);
  }, [language]);

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results?.[0]?.transcript;
    if (transcript) setSearch(transcript);
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.warn('Speech recognition error:', event);
    setIsListening(false);
  });

  // Render cached results immediately, and then refresh from Supabase.
  // A cancelled request cannot overwrite a newer language selection.
  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setRefreshing(false);
      setError('');
      setSongs([]);
      let cached: Song[] = [];

      try {
        cached = (await getOfflineSongs(activeLanguage)) as Song[];
        if (!active) return;
        if (cached.length > 0) {
          setSongs(cached);
          setLoading(false);
          setRefreshing(true);
        }
      } catch (cacheError) {
        // Web previews may lack working SQLite; online songs can still load.
        console.warn('Offline cache unavailable:', cacheError);
      }

      try {
        const synced = (await syncOfflineSongs()) as Song[];
        if (!active) return;
        setSongs(synced.filter((song) => song.language === activeLanguage));
        setError('');
      } catch (syncError) {
        console.warn('Song sync unavailable:', syncError);
        if (!active) return;
        if (cached.length === 0) {
          setError(
            isTe
              ? 'పాటలను లోడ్ చేయలేకపోయాము. ఇంటర్నెట్ కనెక్షన్‌ను తనిఖీ చేయండి.'
              : 'Unable to load songs. Check your internet connection.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [activeLanguage, retryKey]);

  async function startVoiceSearch() {
    try {
      Keyboard.dismiss();
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          isTe ? 'మైక్రోఫోన్ అనుమతి' : 'Microphone permission',
          isTe
            ? 'వాయిస్ సెర్చ్ కోసం మైక్రోఫోన్ అనుమతి ఇవ్వండి.'
            : 'Allow microphone access to search by voice.'
        );
        return;
      }
      setIsListening(true);
      await ExpoSpeechRecognitionModule.start({
        lang: isTe ? 'te-IN' : 'en-IN',
        interimResults: false,
        continuous: false,
      });
    } catch (voiceError) {
      console.warn('Voice search unavailable:', voiceError);
      setIsListening(false);
      Alert.alert(
        'Voice Search',
        'Voice search is unavailable. Try a native development build and check microphone permissions.'
      );
    }
  }

  async function stopVoiceSearch() {
    try {
      await ExpoSpeechRecognitionModule.stop();
    } catch (voiceError) {
      console.warn('Could not stop voice search:', voiceError);
    } finally {
      setIsListening(false);
    }
  }

  function chooseLanguage(next: Language) {
    if (next === activeLanguage) return;
    setActiveLanguage(next);
    setSearch('');
    Keyboard.dismiss();
    if (isListening) void stopVoiceSearch();
  }

  const candidates = useMemo(
    () => getCandidates(search, activeLanguage),
    [search, activeLanguage]
  );

  const filteredSongs = useMemo(() => {
    if (!candidates.length) return songs;
    return songs
      .map((song) => ({ song, score: scoreSong(song, candidates, activeLanguage) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ song }) => song);
  }, [songs, candidates, activeLanguage]);

  const visibleSongs = useMemo(() => {
    if (!alphabetical) return filteredSongs;
    return [...filteredSongs].sort((a, b) => a.title.localeCompare(b.title, activeLanguage));
  }, [filteredSongs, alphabetical, activeLanguage]);

  if (selectedSong) {
    return (
      <SongDetailsScreen
        song={selectedSong}
        onBack={() => setSelectedSong(null)}
      />
    );
  }

  return (
    <View style={styles.root}>
      {/* Compact, sticky Stitch header. Existing navigation stays with the parent app. */}
      <View style={styles.header}>
        <View style={styles.brandGroup}>
          <TouchableOpacity onPress={onBack} style={styles.back} accessibilityLabel="Back to home" accessibilityRole="button">
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Image source={require('../../assets/worshipverse-logo.png')} style={styles.logo} resizeMode="contain" />
          <View style={styles.brandCopy}>
            <Text style={styles.brandTitle}>WorshipVerse</Text>
            <View style={styles.churchBadge}><Text style={styles.churchBadgeText}>SHARON A.G. CHURCH</Text></View>
          </View>
        </View>
        <View style={styles.langSwitcher}>
          <TouchableOpacity style={[styles.langButton, isTe && styles.langActive]} onPress={() => chooseLanguage('te')}>
            <Text style={[styles.langLabel, isTe && styles.langActiveText]}>తెలుగు</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.langButton, !isTe && styles.langActive]} onPress={() => chooseLanguage('en')}>
            <Text style={[styles.langLabel, !isTe && styles.langActiveText]}>ENG</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* The original Stitch screen starts immediately with its hymnal search card. */}
        <View style={styles.searchCard}>
          <View style={styles.searchField}>
            <Text style={styles.searchGlyph}>⌕</Text>
            <TextInput
              style={styles.searchInput}
              placeholder={isTe ? 'పాట పేరు వెతకండి...' : 'Search song titles...'}
              placeholderTextColor="#A18C8C"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              returnKeyType="search"
              accessibilityLabel="Search worship songs"
            />
            {!!search && (
              <TouchableOpacity onPress={() => setSearch('')} style={styles.clearButton} accessibilityLabel="Clear search">
                <Text style={styles.clearText}>×</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.voiceBanner}
            onPress={() => void (isListening ? stopVoiceSearch() : startVoiceSearch())}
            accessibilityRole="button"
            accessibilityLabel={isListening ? 'Stop voice search' : 'Start voice search'}
          >
            <View style={styles.voiceRound}><Text style={styles.voiceGlyph}>{isListening ? '■' : '🎤'}</Text></View>
            <View style={styles.voiceCopy}>
              <Text style={styles.voiceTitle}>{isListening ? (isTe ? 'వింటున్నాము...' : 'Listening...') : (isTe ? 'వాయిస్ సెర్చ్ సిద్ధంగా ఉంది' : 'Voice search is ready')}</Text>
              <Text style={styles.voiceHint}>{isTe ? 'పాట పేరు స్పష్టంగా పలకండి' : 'Say the song title clearly'}</Text>
            </View>
            <View style={styles.listenButton}><Text style={styles.listenText}>{isListening ? (isTe ? 'ఆపు' : 'STOP') : (isTe ? 'వినుము' : 'LISTEN')}</Text></View>
          </TouchableOpacity>
        </View>

        {/* Functional chips only: no invented BPM, key, or category metadata. */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsRow}>
          <TouchableOpacity style={styles.chipSelected} onPress={() => chooseLanguage(isTe ? 'en' : 'te')} accessibilityLabel="Change song language">
            <Text style={styles.chipSelectedText}>◎  {isTe ? 'భాష: తెలుగు' : 'Language: English'}  ⌄</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chip} onPress={() => setAlphabetical((value) => !value)} accessibilityRole="button">
            <Text style={styles.chipText}>{alphabetical ? (isTe ? '✓ పేరు క్రమం' : '✓ A–Z order') : (isTe ? 'పేరు క్రమం A–Z' : 'Sort A–Z')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chip} onPress={() => setRetryKey((value) => value + 1)} accessibilityRole="button">
            <Text style={styles.chipText}>↻  {isTe ? 'అప్‌డేట్' : 'Refresh'}</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.registryBar}>
          <View style={styles.registryLeft}>
            <View style={styles.goldDot} />
            <Text style={styles.registryText}>{isTe ? 'మొత్తం పాటలు' : 'Total songs'}: {loading && !songs.length ? '…' : visibleSongs.length}</Text>
          </View>
          <Text style={styles.registryRight}>{refreshing ? (isTe ? 'అప్‌డేట్ అవుతోంది…' : 'Syncing…') : alphabetical ? 'A–Z ↓' : (isTe ? 'పాటల జాబితా' : 'Song directory')}</Text>
        </View>

        {loading && songs.length === 0 && (
          <View style={styles.centerState}><ActivityIndicator color="#F0BF5C" size="large" /><Text style={styles.stateText}>{isTe ? 'పాటలను లోడ్ చేస్తున్నాము...' : 'Loading songs...'}</Text></View>
        )}
        {!loading && !!error && songs.length === 0 && (
          <View style={styles.centerState}>
            <Text style={styles.stateTitle}>{isTe ? 'పాటలు అందుబాటులో లేవు' : 'Songs unavailable'}</Text>
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity onPress={() => setRetryKey((v) => v + 1)} style={styles.retryButton}><Text style={styles.retryText}>{isTe ? 'మళ్లీ ప్రయత్నించండి' : 'Try again'}</Text></TouchableOpacity>
          </View>
        )}
        {!loading && !error && visibleSongs.length === 0 && (
          <View style={styles.centerState}>
            <Text style={styles.stateTitle}>{search.trim() ? (isTe ? 'పాటలు కనబడలేదు' : 'No matching songs') : (isTe ? 'ఇంకా పాటలు లేవు' : 'No songs yet')}</Text>
            <Text style={styles.stateText}>{search.trim() ? (isTe ? 'మరొక పాట పేరుతో వెతకండి.' : 'Try a different song title.') : (isTe ? 'కొత్త పాటలు జోడించినప్పుడు ఇక్కడ కనిపిస్తాయి.' : 'Songs appear here when published.')}</Text>
          </View>
        )}

        {/* Featured first result mirrors Stitch's expanded image-backed first song. */}
        {visibleSongs.length > 0 && (
          <TouchableOpacity
            style={styles.featuredCard}
            activeOpacity={0.85}
            onPress={() => { Keyboard.dismiss(); setSelectedSong(visibleSongs[0]); }}
            accessibilityRole="button"
            accessibilityLabel={`View song ${visibleSongs[0].title}`}
          >
            <View style={styles.featuredArt}>
              <Image source={require('../../assets/worship-instruments.png')} style={styles.featuredImage} resizeMode="cover" />
              <View style={styles.featuredScrim} />
              <View style={styles.featuredBadge}><Text style={styles.featuredBadgeText}>{isTe ? 'ఆరాధన గీతం' : 'WORSHIP SONG'}</Text></View>
              <View style={styles.featuredOpen}><Text style={styles.featuredOpenText}>›</Text></View>
            </View>
            <View style={styles.featuredBody}>
              <Text style={styles.featuredTitle}>{visibleSongs[0].title}</Text>
              {!!visibleSongs[0].artist && <Text style={styles.featuredArtist}>♫  {visibleSongs[0].artist}</Text>}
              <Text numberOfLines={2} style={styles.featuredExcerpt}>{(visibleSongs[0].lyrics || '').replace(/\s+/g, ' ').trim()}</Text>
              <View style={styles.featuredActions}>
                <Text style={styles.featuredType}>{isTe ? 'తెలుగు ఆరాధన' : 'ENGLISH WORSHIP'}</Text>
                <Text style={styles.featuredRead}>{isTe ? 'సాహిత్యం  →' : 'Lyrics  →'}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Number boxes instead of fabricated hymnal numbers: the data has no hymn_number field. */}
        {visibleSongs.slice(1).map((song) => (
          <TouchableOpacity
            key={song.id}
            style={styles.compactCard}
            activeOpacity={0.85}
            onPress={() => { Keyboard.dismiss(); setSelectedSong(song); }}
            accessibilityRole="button"
            accessibilityLabel={`View song ${song.title}`}
          >
            <View style={styles.hymnTile}><Text style={styles.hymnTileNote}>♫</Text></View>
            <View style={styles.compactBody}>
              <Text style={styles.compactTitle} numberOfLines={2}>{song.title}</Text>
              {!!song.artist && <Text style={styles.compactArtist} numberOfLines={1}>{song.artist}</Text>}
              <Text style={styles.compactExcerpt} numberOfLines={2}>{(song.lyrics || '').replace(/\s+/g, ' ').trim()}</Text>
              <View style={styles.compactFoot}><Text style={styles.compactFootLabel}>{isTe ? 'ఆరాధన గీతం' : 'WORSHIP SONG'}</Text><Text style={styles.compactFootLink}>{isTe ? 'సాహిత్యం' : 'Lyrics'}  ›</Text></View>
            </View>
          </TouchableOpacity>
        ))}

        {visibleSongs.length > 0 && (
          <View style={styles.footer}><View style={styles.footerRule} /><Text style={styles.footerText}>WorshipVerse  •  SHARON A.G. CHURCH</Text></View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1E0E19' },
  header: { height: 79, paddingHorizontal: 10, backgroundColor: '#1E0E19', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#38232F' },
  brandGroup: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 },
  back: { width: 26, height: 40, justifyContent: 'center' },
  backText: { fontSize: 29, color: '#F0BF5C', lineHeight: 34 },
  logo: { height: 32, width: 32, marginRight: 7 },
  brandCopy: { justifyContent: 'center', flex: 1, minWidth: 0 },
  brandTitle: { color: '#F0BF5C', fontSize: 20, lineHeight: 24, fontFamily: 'serif' },
  churchBadge: { backgroundColor: '#322200', borderRadius: 20, alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, marginTop: 3 },
  churchBadgeText: { color: '#F0BF5C', fontWeight: '800', fontSize: 8, letterSpacing: 0.8 },
  langSwitcher: { flexDirection: 'row', padding: 3, backgroundColor: '#422F3B', borderRadius: 22, alignItems: 'center', marginLeft: 5 },
  langButton: { borderRadius: 18, paddingHorizontal: 9, paddingVertical: 8 },
  langActive: { backgroundColor: '#4A0E17' },
  langLabel: { color: '#D9C1C1', fontWeight: '700', fontSize: 11 },
  langActiveText: { color: '#F0BF5C' },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 10, paddingBottom: 32 },
  searchCard: { marginHorizontal: 15, backgroundColor: '#2B1A25', borderRadius: 14, padding: 10, gap: 9 },
  searchField: { backgroundColor: '#422F3B', borderRadius: 10, minHeight: 49, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
  searchGlyph: { fontSize: 26, color: '#F0BF5C', marginRight: 8 },
  searchInput: { flex: 1, minWidth: 0, fontSize: 14, color: '#F7DBEA', paddingVertical: 9 },
  clearButton: { paddingHorizontal: 5, paddingVertical: 7 },
  clearText: { color: '#D9C1C1', fontSize: 20 },
  voiceBanner: { backgroundColor: '#4A0E17', borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 9, gap: 8 },
  voiceRound: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F0BF5C', alignItems: 'center', justifyContent: 'center' },
  voiceGlyph: { fontSize: 16 },
  voiceCopy: { flex: 1, minWidth: 0 },
  voiceTitle: { color: '#F0BF5C', fontSize: 12, fontWeight: '800' },
  voiceHint: { color: '#D9C1C1', fontSize: 10, marginTop: 2 },
  listenButton: { backgroundColor: '#6B4331', paddingHorizontal: 9, paddingVertical: 7, borderRadius: 16 },
  listenText: { color: '#F0BF5C', fontWeight: '800', fontSize: 10 },
  chipsScroll: { marginTop: 13, maxHeight: 45 },
  chipsRow: { paddingHorizontal: 15, alignItems: 'center', gap: 7, paddingBottom: 3 },
  chipSelected: { backgroundColor: '#F0BF5C', borderRadius: 25, paddingHorizontal: 12, paddingVertical: 9 },
  chipSelectedText: { color: '#261900', fontSize: 11, fontWeight: '800' },
  chip: { backgroundColor: '#2B1A25', borderRadius: 25, paddingHorizontal: 12, paddingVertical: 9 },
  chipText: { color: '#D9C1C1', fontSize: 11, fontWeight: '600' },
  registryBar: { marginHorizontal: 15, marginTop: 11, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  registryLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  goldDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F0BF5C' },
  registryText: { color: '#F0BF5C', fontSize: 11, fontWeight: '700' },
  registryRight: { color: '#D9C1C1', fontSize: 10 },
  featuredCard: { marginHorizontal: 15, marginBottom: 12, backgroundColor: '#2B1A25', borderRadius: 14, overflow: 'hidden' },
  featuredArt: { height: 112, backgroundColor: '#180913', position: 'relative' },
  featuredImage: { width: '100%', height: '100%', opacity: 0.82 },
  featuredScrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(30,14,25,0.2)' },
  featuredBadge: { position: 'absolute', top: 9, left: 9, borderRadius: 18, paddingVertical: 4, paddingHorizontal: 9, backgroundColor: '#4A0E17' },
  featuredBadgeText: { color: '#F0BF5C', fontSize: 10, fontWeight: '700' },
  featuredOpen: { position: 'absolute', bottom: 9, right: 10, width: 37, height: 37, borderRadius: 19, backgroundColor: '#F0BF5C', alignItems: 'center', justifyContent: 'center' },
  featuredOpenText: { color: '#261900', fontSize: 29, lineHeight: 33 },
  featuredBody: { paddingHorizontal: 13, paddingTop: 12, paddingBottom: 12 },
  featuredTitle: { color: '#F7DBEA', fontSize: 19, fontWeight: '700', lineHeight: 27 },
  featuredArtist: { color: '#D9C1C1', fontSize: 12, marginTop: 5 },
  featuredExcerpt: { color: '#D9C1C1', fontSize: 12, lineHeight: 18, marginTop: 8 },
  featuredActions: { borderTopColor: '#54434366', borderTopWidth: 1, marginTop: 12, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  featuredType: { color: '#F0BF5C', fontWeight: '700', fontSize: 10 },
  featuredRead: { color: '#F0BF5C', fontWeight: '800', fontSize: 12 },
  compactCard: { marginHorizontal: 15, marginBottom: 11, padding: 12, borderRadius: 13, backgroundColor: '#2B1A25', flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  hymnTile: { backgroundColor: '#422F3B', width: 43, height: 43, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  hymnTileNote: { color: '#F0BF5C', fontSize: 23 },
  compactBody: { flex: 1, minWidth: 0 },
  compactTitle: { color: '#F7DBEA', fontWeight: '700', fontSize: 16, lineHeight: 22 },
  compactArtist: { color: '#D9C1C1', fontSize: 11, marginTop: 4 },
  compactExcerpt: { color: '#D9C1C1', fontSize: 11, lineHeight: 17, marginTop: 7 },
  compactFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  compactFootLabel: { color: '#F0BF5C', fontSize: 10 },
  compactFootLink: { color: '#F0BF5C', fontSize: 11, fontWeight: '700' },
  centerState: { paddingVertical: 40, alignItems: 'center', paddingHorizontal: 20 },
  stateTitle: { color: '#F7DBEA', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  stateText: { color: '#D9C1C1', fontSize: 13, textAlign: 'center', marginTop: 8 },
  retryButton: { borderRadius: 10, backgroundColor: '#F0BF5C', paddingHorizontal: 16, paddingVertical: 10, marginTop: 15 },
  retryText: { color: '#261900', fontWeight: '800' },
  footer: { paddingTop: 24, paddingBottom: 12, alignItems: 'center' },
  footerRule: { width: 48, height: 2, backgroundColor: '#544343' },
  footerText: { color: '#F0BF5C', fontSize: 10, marginTop: 10 },
});
