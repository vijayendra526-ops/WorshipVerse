import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getOfflineSongs, syncOfflineSongs } from '../lib/offlineSongs';
import StitchBottomNav from './StitchBottomNav';
import OfflineSongsScreen from './OfflineSongsScreen';

type Language = 'te' | 'en';
type HomeScreenProps = { session: Session | null; onLogin: () => void };
type ProtectedPage = 'profile' | 'favourites' | 'playlists' | 'settings';
type Song = {
  id: string;
  title: string;
  artist: string | null;
  language: string;
  lyrics: string;
  lyrics_transliteration?: string | null;
  youtube_url: string | null;
};

// Preserve the existing screen contracts. Search and microphone open SongsScreen,
// which already owns the live search / native speech-recognition functionality.
const SongsScreen = require('./SongsScreen').default as React.ComponentType<{
  language: Language;
  onBack: () => void;
}>;
const ProfileScreen = require('./ProfileScreen').default as React.ComponentType<{ onBack: () => void }>;
const FavouritesScreen = require('./FavouritesScreen').default as React.ComponentType<{
  onBack: () => void;
  onBrowseSongs: () => void;
}>;
const PlaylistsScreen = require('./PlaylistsScreen').default as React.ComponentType<{ onBack: () => void }>;
const SettingsScreen = require('./SettingsScreen').default as React.ComponentType<{ onBack: () => void }>;
const SongDetailsScreen = require('./SongDetailsScreen').default as React.ComponentType<{
  song: Song;
  onBack: () => void;
  onFavouriteChange?: (isFavourite: boolean) => void;
}>;

const P = {
  bg: '#1E0E19',
  lowest: '#180913',
  card: '#2B1A25',
  cardHigh: '#362530',
  cardHighest: '#422F3B',
  wine: '#4A0E17',
  gold: '#F0BF5C',
  goldPale: '#FFDEA4',
  blush: '#FFB3B6',
  white: '#F7DBEA',
  muted: '#D9C1C1',
  line: '#544343',
};

const COPY = {
  te: {
    home: 'హోమ్', songs: 'పాటలు', saved: 'ఇష్టమైనవి', lists: 'ప్లేలిస్టులు',
    account: 'నా ఖాతా', guest: 'అతిథి', profile: 'నా ప్రొఫైల్', settings: 'సెట్టింగ్స్',
    signIn: 'లాగిన్ / నమోదు', signOut: 'లాగౌట్', close: 'మూసివేయి', cancel: 'రద్దు',
    required: 'లాగిన్ అవసరం', requiredBody: 'ఇష్టమైన పాటలు, ప్లేలిస్టులు మరియు ఖాతా కోసం లాగిన్ చేయండి.',
    promise: 'ఈనాటి వాక్యము · DAILY PROMISE', devotional: 'ప్రభువును సంతోషముతో సేవించుడి',
    library: 'పాటల గ్రంథాలయం', search: 'పాటలు, సాహిత్యం లేదా రచయితను వెతకండి',
    browse: 'అన్ని పాటలు', telugu: 'తెలుగు పాటలు', english: 'English Songs',
    quick: 'త్వరిత ఎంపికలు', fav: 'ఇష్టమైన పాటలు', offline: 'ఆఫ్‌లైన్ పాటలు',
    playlists: 'ప్లేలిస్టులు',
    explore: 'పాటలు చూడండి', church: 'SHARON A.G. CHURCH',
    voice: 'వాయిస్ సెర్చ్', note: 'సెర్చ్ కోసం పాటల గ్రంథాలయాన్ని తెరవండి',
    instrumentKicker: 'ఆదివారం ప్రత్యేక ఆరాధన', instrumentTitle: 'వాయిద్యాలతో స్తుతించుడి',
    instrumentDescription: 'స్తుతి మరియు ఆరాధనకు వాయిద్యాల అందమైన సమ్మేళనం', instrumentAction: 'పాటలు చూడండి',
  },
  en: {
    home: 'Home', songs: 'Songs', saved: 'Favourites', lists: 'Playlists',
    account: 'My account', guest: 'Guest', profile: 'My profile', settings: 'Settings',
    signIn: 'Sign In / Sign Up', signOut: 'Sign out', close: 'Close', cancel: 'Cancel',
    required: 'Sign in required', requiredBody: 'Sign in to use favourites, playlists and account features.',
    promise: 'DAILY PROMISE', devotional: 'Serve the LORD with gladness',
    library: 'Song Library', search: 'Search songs, lyrics or authors',
    browse: 'All Songs', telugu: 'Telugu Songs', english: 'English Songs',
    quick: 'Quick Access', fav: 'Favourites', offline: 'Offline songs',
    playlists: 'Playlists',
    explore: 'Explore songs', church: 'SHARON A.G. CHURCH',
    voice: 'Voice search', note: 'Open the song library to search',
    instrumentKicker: 'SUNDAY WORSHIP FEATURE', instrumentTitle: 'Praise with Instruments',
    instrumentDescription: 'A beautiful blend of instruments for praise and worship', instrumentAction: 'Explore songs',
    librarySongs: 'From your song library', fromLibrary: 'YOUR COLLECTION', viewAll: 'View all',
    loadingSongs: 'Loading songs...', noSongs: 'No songs are available yet.',
    lyricsAction: 'Lyrics', youtubeAction: 'YouTube',
  },
};

export default function HomeScreen({ session, onLogin }: HomeScreenProps) {
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [language, setLanguage] = useState<Language>('te');
  const [songsLanguage, setSongsLanguage] = useState<Language | null>(null);
  const [screen, setScreen] = useState<ProtectedPage | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [featuredSongs, setFeaturedSongs] = useState<Song[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [recentSong, setRecentSong] = useState<Song | null>(null);
  const [showOffline, setShowOffline] = useState(false);
  const t = COPY[language];
  const email = session?.user.email ?? '';

  // Show cached songs first for offline use, then refresh from Supabase.
  useEffect(() => {
    let active = true;

    async function loadHomeSongs() {
      setFeaturedLoading(true);
      try {
        const cached = (await getOfflineSongs(language)) as Song[];
        if (active && cached.length > 0) setFeaturedSongs(cached.slice(0, 3));
      } catch (error) {
        console.warn('Home cached songs unavailable:', error);
      }

      try {
        const synced = (await syncOfflineSongs()) as Song[];
        if (active) {
          setFeaturedSongs(
            synced.filter((song) => song.language === language).slice(0, 3)
          );
        }
      } catch (error) {
        // Keep cached songs visible when the device is offline.
        console.warn('Home song sync unavailable:', error);
      } finally {
        if (active) setFeaturedLoading(false);
      }
    }

    void loadHomeSongs();
    return () => {
      active = false;
    };
  }, [language]);

  async function openSongYouTube(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('YouTube', 'Could not open this YouTube link.');
    }
  }

  function openProtected(next: ProtectedPage) {
    setAccountOpen(false);
    if (!session) {
      setLoginPrompt(true);
      return;
    }
    setScreen(next);
  }
  function startLogin() {
    setAccountOpen(false);
    setLoginPrompt(false);
    onLogin();
  }
  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setAccountOpen(false);
    } catch (e) {
      Alert.alert('Sign out failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSigningOut(false);
    }
  }

  function navigateHome() {
    setSelectedSong(null);
    setSongsLanguage(null);
    setScreen(null);
    setShowOffline(false);
  }
  function navigateSongs() {
    navigateHome();
    setSongsLanguage(language);
  }
  function navigateLyrics() {
    navigateHome();
    if (recentSong) setSelectedSong(recentSong);
    else setSongsLanguage(language);
  }
  function navigateFavourites() {
    navigateHome();
    openProtected('favourites');
  }
  function navigateOffline() {
    navigateHome();
    setShowOffline(true);
  }
  function withNavigation(content: React.ReactNode, active: 'home' | 'songs' | 'lyrics' | 'favourites' | 'offline') {
    return <View style={{ flex: 1, backgroundColor: P.bg }}>
      <View style={{ flex: 1 }}>
        {content}
      </View>
      <StitchBottomNav
        active={active} language={language}
        onHome={navigateHome} onSongs={navigateSongs} onLyrics={navigateLyrics}
        onFavourites={navigateFavourites} onOffline={navigateOffline}
      />
    </View>;
  }

  if (selectedSong) return withNavigation(
    <SongDetailsScreen song={selectedSong} onBack={() => setSelectedSong(null)} />, 'lyrics');
  if (songsLanguage) return withNavigation(
    <SongsScreen language={songsLanguage} onBack={() => setSongsLanguage(null)} />, 'songs');
  if (showOffline) return withNavigation(<OfflineSongsScreen language={language} />, 'offline');
  if (screen === 'profile') return withNavigation(<ProfileScreen onBack={() => setScreen(null)} />, 'home');
  if (screen === 'favourites') return withNavigation(
    <FavouritesScreen onBack={() => setScreen(null)} onBrowseSongs={navigateSongs} />, 'favourites');
  if (screen === 'playlists') return withNavigation(<PlaylistsScreen onBack={() => setScreen(null)} />, 'home');
  if (screen === 'settings') return withNavigation(<SettingsScreen onBack={() => setScreen(null)} />, 'home');

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
      <View style={s.header}>
        <TouchableOpacity
          style={s.brand}
          accessibilityRole="button"
          accessibilityLabel="WorshipVerse home"
          onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
        >
          <Image source={require('../../assets/worshipverse-logo.png')} style={s.logo} />
          <View style={s.brandWords}>
            <Text style={s.brandName}>WorshipVerse</Text>
            <Text style={s.brandChurch}>{t.church}</Text>
          </View>
        </TouchableOpacity>
        <View style={s.headerActions}>
          <View style={s.languagePill}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Telugu interface"
              onPress={() => setLanguage('te')}
              style={[s.languageChoice, language === 'te' && s.languageSelected]}
            >
              <Text style={[s.languageChoiceText, language === 'te' && s.languageSelectedText]}>తెలుగు</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="English interface"
              onPress={() => setLanguage('en')}
              style={[s.languageChoice, language === 'en' && s.languageSelected]}
            >
              <Text style={[s.languageChoiceText, language === 'en' && s.languageSelectedText]}>ENG</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={s.avatar}
            accessibilityRole="button"
            accessibilityLabel="Account menu"
            onPress={() => setAccountOpen(true)}
          >
            <Text style={s.avatarText}>{email ? email[0].toUpperCase() : '♙'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.promiseCard}>
          <View style={s.promiseHeading}>
            <Text style={s.promiseKicker}>✦  {t.promise}</Text>
            <Text style={s.scriptureReference}>కీర్తన 100:2</Text>
          </View>
          <Text style={s.promiseTelugu}>{t.devotional}</Text>
          <Text style={s.promiseEnglish}>“Serve the LORD with gladness.”</Text>
          <View style={s.promiseFooter}>
            <Text style={s.promiseFooterText}>✦  WorshipVerse · {t.church}</Text>
            <TouchableOpacity onPress={() => setSongsLanguage(language)} style={s.promiseAction} accessibilityRole="button">
              <Text style={s.promiseActionText}>{t.explore}  ›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.searchSection}>
          <Text style={s.sectionTitle}>{t.library}</Text>
          <TouchableOpacity
            style={s.searchBar}
            onPress={() => setSongsLanguage(language)}
            accessibilityRole="button"
            accessibilityLabel={t.search}
          >
            <Text style={s.searchIcon}>⌕</Text>
            <Text style={s.searchPlaceholder} numberOfLines={1}>{t.search}</Text>
            <View style={s.mic}>
              <Text style={s.micIcon}>♩</Text>
            </View>
          </TouchableOpacity>
          <Text style={s.searchHelp}>{t.note} · {t.voice}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
          <TouchableOpacity style={[s.chip, s.chipActive]} onPress={() => setSongsLanguage(language)}>
            <Text style={s.chipActiveText}>{t.browse}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.chip} onPress={() => setSongsLanguage('te')}>
            <Text style={s.chipText}>{t.telugu}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.chip} onPress={() => setSongsLanguage('en')}>
            <Text style={s.chipText}>{t.english}</Text>
          </TouchableOpacity>
        </ScrollView>

        <Text style={s.sectionTitle}>{t.quick}</Text>
        <View style={s.quickGrid}>
          <TouchableOpacity style={s.quickCard} onPress={() => setSongsLanguage('te')}>
            <Text style={s.quickSymbol}>♫</Text>
            <Text style={s.quickTitle}>{t.telugu}</Text>
            <Text style={s.quickArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickCard} onPress={() => setSongsLanguage('en')}>
            <Text style={s.quickSymbol}>♬</Text>
            <Text style={s.quickTitle}>{t.english}</Text>
            <Text style={s.quickArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickCard} onPress={() => openProtected('favourites')}>
            <Text style={s.quickSymbol}>♡</Text>
            <Text style={s.quickTitle}>{t.fav}</Text>
            <Text style={s.quickArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickCard} onPress={() => openProtected('playlists')}>
            <Text style={s.quickSymbol}>☷</Text>
            <Text style={s.quickTitle}>{t.playlists}</Text>
            <Text style={s.quickArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Featured worship instruments banner from the Stitch Home design. */}
        <ImageBackground
          source={require('../../assets/worship-instruments.png')}
          style={[s.instrumentBanner, { height: 174, minHeight: 0 }]}
          imageStyle={{ borderRadius: 18 }}
          resizeMode="cover"
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(24, 9, 19, 0.55)',
            padding: 13,
            justifyContent: 'space-between'
          }}>
            <Text style={[s.instrumentKicker, { alignSelf: 'flex-start' }]}>
              {t.instrumentKicker}
            </Text>

            <View style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 8
            }}>
              <View style={{ flex: 1 }}>
                <Text style={[s.instrumentTitle, { fontSize: 17, lineHeight: 22 }]}>
                  {t.instrumentTitle}
                </Text>
                <Text
                  style={[s.instrumentDescription, { fontSize: 10, lineHeight: 14 }]}
                  numberOfLines={2}
                >
                  {t.instrumentDescription}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setSongsLanguage(language)}
                style={[s.instrumentButton, {
                  marginTop: 0,
                  paddingHorizontal: 12,
                  paddingVertical: 8
                }]}
                accessibilityRole="button"
              >
                <Text style={s.instrumentButtonText}>
                  {t.instrumentAction} ›
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>

        {/* Real songs from SQLite/Supabase; no hard-coded sample song data. */}
        <View style={s.homeSongsSection}>
          <View style={s.homeSongsHeading}>
            <View style={s.homeSongsHeadingText}>
              <Text style={s.homeSongsKicker}>{(language === 'te' ? 'పాటల గ్రంథాలయం నుండి' : 'FROM THE LIBRARY')}</Text>
              <Text style={s.homeSongsTitle}>{(language === 'te' ? 'ఆరాధన పాటలు' : 'Worship Songs')}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setSongsLanguage(language)}
              accessibilityRole="button"
            >
              <Text style={s.homeSongsViewAll}>{(language === 'te' ? 'అన్నీ చూడండి' : 'View All')}  ›</Text>
            </TouchableOpacity>
          </View>

          {featuredSongs.map((song) => (
            <View key={song.id} style={s.homeSongCard}>
              <TouchableOpacity
                style={s.homeSongMain}
                onPress={() => { setRecentSong(song); setSelectedSong(song); }}
                accessibilityRole="button"
                accessibilityLabel={`${song.title} lyrics`}
              >
                <Image
                  source={require('../../assets/worship-instruments.png')}
                  style={s.homeSongArtwork}
                />
                <View style={s.homeSongCopy}>
                  <Text style={s.homeSongTitle} numberOfLines={2}>{song.title}</Text>
                  <Text style={s.homeSongArtist} numberOfLines={1}>
                    {song.artist || (song.language === 'te' ? 'తెలుగు ఆరాధన' : 'English worship')}
                  </Text>
                </View>
                <Text style={s.homeSongChevron}>›</Text>
              </TouchableOpacity>
              <View style={s.homeSongActions}>
                <Text style={s.homeSongLanguage}>
                  {song.language === 'te' ? 'తెలుగు' : 'ENGLISH'}
                </Text>
                <TouchableOpacity onPress={() => { setRecentSong(song); setSelectedSong(song); }}>
                  <Text style={s.homeSongActionText}>{(language === 'te' ? 'సాహిత్యం' : 'Lyrics')}</Text>
                </TouchableOpacity>
                {song.youtube_url ? (
                  <TouchableOpacity onPress={() => { void openSongYouTube(song.youtube_url as string); }}>
                    <Text style={s.homeSongActionText}>{(language === 'te' ? 'యూట్యూబ్' : 'YouTube')}  ↗</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ))}

          {featuredLoading && featuredSongs.length === 0 ? (
            <View style={s.homeSongsStatus}>
              <ActivityIndicator color={P.gold} />
              <Text style={s.homeSongsStatusText}>{(language === 'te' ? 'పాటలు లోడ్ అవుతున్నాయి...' : 'Loading songs...')}</Text>
            </View>
          ) : null}
          {!featuredLoading && featuredSongs.length === 0 ? (
            <Text style={s.homeSongsEmpty}>{(language === 'te' ? 'పాటలు అందుబాటులో లేవు' : 'No songs available')}</Text>
          ) : null}
        </View>

        <Text style={s.footer}>© 2026 WorshipVerse · SHARON A.G. CHURCH</Text>
      </ScrollView>

      <StitchBottomNav
        active="home" language={language}
        onHome={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
        onSongs={navigateSongs} onLyrics={navigateLyrics}
        onFavourites={navigateFavourites} onOffline={navigateOffline}
      />

      <Modal visible={accountOpen} transparent animationType="fade" onRequestClose={() => setAccountOpen(false)}>
        <View style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>{t.account}</Text>
            <Text style={s.modalSubtitle}>{email || t.guest}</Text>
            {([
              [t.profile, 'profile'],
              [t.fav, 'favourites'],
              [t.playlists, 'playlists'],
              [t.settings, 'settings'],
            ] as [string, ProtectedPage][]).map(([label, dest]) => (
              <TouchableOpacity key={dest} style={s.modalOption} onPress={() => openProtected(dest)}>
                <Text style={s.modalOptionText}>{label}</Text><Text style={s.modalArrow}>›</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={s.modalOption} onPress={() => setAccountOpen(false)}>
              <Text style={s.modalOptionText}>{t.close}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.modalPrimary} onPress={session ? () => { void signOut(); } : startLogin} disabled={signingOut}>
              {signingOut ? <ActivityIndicator color={P.bg} /> : <Text style={s.modalPrimaryText}>{session ? t.signOut : t.signIn}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={loginPrompt} transparent animationType="fade" onRequestClose={() => setLoginPrompt(false)}>
        <View style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>{t.required}</Text>
            <Text style={s.modalSubtitle}>{t.requiredBody}</Text>
            <TouchableOpacity style={s.modalPrimary} onPress={startLogin}>
              <Text style={s.modalPrimaryText}>{t.signIn}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.modalOption} onPress={() => setLoginPrompt(false)}>
              <Text style={s.modalOptionText}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.bg },
  header: { minHeight: 72, backgroundColor: P.bg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: Platform.OS === 'ios' ? 47 : 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#54434355' },
  brand: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, maxWidth: '51%' },
  logo: { width: 33, height: 33, borderRadius: 8, marginRight: 7 },
  brandWords: { flexShrink: 1 },
  brandName: { color: P.gold, fontSize: 17, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  brandChurch: { color: P.goldPale, fontSize: 8, letterSpacing: 0.5, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  languagePill: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 3, backgroundColor: P.cardHigh },
  languageChoice: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 13 },
  languageSelected: { backgroundColor: P.wine },
  languageChoiceText: { color: P.muted, fontSize: 10, fontWeight: '700' },
  languageSelectedText: { color: P.gold },
  avatar: { backgroundColor: P.cardHighest, borderWidth: 1, borderColor: '#F0BF5C77', width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: P.gold, fontSize: 15, fontWeight: '800' },
  scroll: { paddingHorizontal: 15, paddingTop: 14, paddingBottom: 27 },
  promiseCard: { borderRadius: 18, padding: 17, backgroundColor: P.cardHigh, borderWidth: 1, borderColor: '#F0BF5C25', marginBottom: 24 },
  promiseHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 12 },
  promiseKicker: { color: P.gold, fontSize: 10, fontWeight: '800', letterSpacing: 0.4, flexShrink: 1 },
  scriptureReference: { color: P.muted, backgroundColor: P.cardHighest, fontSize: 10, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12, overflow: 'hidden' },
  promiseTelugu: { color: P.white, fontSize: 21, lineHeight: 34, fontWeight: '600' },
  promiseEnglish: { color: P.goldPale, fontSize: 18, lineHeight: 27, fontStyle: 'italic', marginTop: 5, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  promiseFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 16 },
  promiseFooterText: { fontSize: 10, color: P.muted, flexShrink: 1 },
  promiseAction: { backgroundColor: P.gold, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 20 },
  promiseActionText: { color: P.bg, fontSize: 11, fontWeight: '800' },
  sectionTitle: { color: P.gold, fontSize: 21, lineHeight: 30, fontWeight: '700', marginBottom: 12, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  searchSection: { marginBottom: 12 },
  searchBar: { backgroundColor: P.cardHigh, paddingHorizontal: 12, minHeight: 51, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
  searchIcon: { fontSize: 27, color: P.gold },
  searchPlaceholder: { color: P.muted, fontSize: 12, flex: 1 },
  mic: { backgroundColor: P.cardHighest, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  micIcon: { color: P.gold, fontSize: 22 },
  searchHelp: { color: P.muted, fontSize: 10, marginTop: 9, marginLeft: 3 },
  chips: { alignItems: 'center', gap: 8, paddingBottom: 22 },
  chip: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 18, backgroundColor: P.card },
  chipActive: { backgroundColor: P.gold },
  chipText: { color: P.muted, fontWeight: '600', fontSize: 12 },
  chipActiveText: { color: P.bg, fontWeight: '800', fontSize: 12 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  quickCard: { width: '48%', flexGrow: 1, backgroundColor: P.card, minHeight: 103, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#54434366' },
  quickSymbol: { fontSize: 24, color: P.gold, marginBottom: 7 },
  quickTitle: { color: P.white, fontSize: 13, fontWeight: '700', paddingRight: 15 },
  quickArrow: { position: 'absolute', right: 13, bottom: 10, color: P.gold, fontSize: 22 },
  instrumentBanner: { minHeight: 190, borderRadius: 18, overflow: 'hidden', marginBottom: 17, backgroundColor: P.cardHigh },
  instrumentImage: { borderRadius: 18 },
  instrumentShade: { padding: 17, backgroundColor: '#362530', alignItems: 'flex-start' },
  instrumentKicker: { color: P.goldPale, backgroundColor: '#4A0E17DD', overflow: 'hidden', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  instrumentTitle: { color: '#FFFFFF', fontSize: 22, lineHeight: 29, marginTop: 10, fontWeight: '700' },
  instrumentDescription: { color: '#F7DBEA', fontSize: 11, lineHeight: 17, marginTop: 5 },
  instrumentButton: { marginTop: 12, alignSelf: 'flex-start', backgroundColor: P.gold, borderRadius: 18, paddingHorizontal: 15, paddingVertical: 9 },
  instrumentButtonText: { color: P.bg, fontWeight: '800', fontSize: 11 },
  homeSongsSection: { marginTop: 7, marginBottom: 18 },
  homeSongsHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 },
  homeSongsHeadingText: { flex: 1 },
  homeSongsKicker: { color: P.goldPale, fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  homeSongsTitle: { color: P.white, fontSize: 20, lineHeight: 27, fontWeight: '700', marginTop: 3, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  homeSongsViewAll: { color: P.gold, fontSize: 11, fontWeight: '800' },
  homeSongCard: { backgroundColor: P.card, borderRadius: 15, padding: 11, marginBottom: 9, borderWidth: 1, borderColor: '#54434377' },
  homeSongMain: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  homeSongArtwork: { width: 43, height: 43, borderRadius: 9, backgroundColor: P.cardHigh },
  homeSongCopy: { flex: 1, minWidth: 0 },
  homeSongTitle: { color: P.white, fontSize: 13, lineHeight: 19, fontWeight: '700' },
  homeSongArtist: { color: P.muted, fontSize: 10, marginTop: 3 },
  homeSongChevron: { color: P.gold, fontSize: 22, paddingHorizontal: 3 },
  homeSongActions: { borderTopWidth: 1, borderTopColor: '#54434377', marginTop: 10, paddingTop: 8, flexDirection: 'row', alignItems: 'center', gap: 14 },
  homeSongLanguage: { color: P.goldPale, fontSize: 9, fontWeight: '800', flex: 1 },
  homeSongActionText: { color: P.gold, fontSize: 10, fontWeight: '800' },
  homeSongsStatus: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  homeSongsStatusText: { color: P.muted, fontSize: 11 },
  homeSongsEmpty: { color: P.muted, backgroundColor: P.card, borderRadius: 12, padding: 15, fontSize: 12 },
  footer: { color: P.muted, textAlign: 'center', fontSize: 10, marginBottom: 8 },
  bottomNav: { backgroundColor: P.bg, borderTopWidth: 1, borderTopColor: '#F0BF5C44', paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 24 : 11, flexDirection: 'row' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navIcon: { fontSize: 22, color: P.muted },
  navIconSelected: { fontSize: 22, color: P.gold },
  navText: { color: P.muted, fontSize: 9, marginTop: 3, fontWeight: '600' },
  navTextSelected: { color: P.gold, fontSize: 9, marginTop: 3, fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: '#000000BB', justifyContent: 'center', padding: 22 },
  modalCard: { backgroundColor: P.card, borderColor: '#F0BF5C50', borderWidth: 1, padding: 20, borderRadius: 20 },
  modalTitle: { color: P.gold, fontSize: 22, fontWeight: '800', marginBottom: 8 },
  modalSubtitle: { color: P.muted, fontSize: 13, lineHeight: 20, marginBottom: 13 },
  modalOption: { borderBottomWidth: 1, borderBottomColor: '#54434388', paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between' },
  modalOptionText: { color: P.white, fontSize: 14, fontWeight: '600' },
  modalArrow: { color: P.gold, fontSize: 16 },
  modalPrimary: { backgroundColor: P.gold, alignItems: 'center', borderRadius: 12, padding: 14, marginTop: 16 },
  modalPrimaryText: { color: P.bg, fontSize: 14, fontWeight: '800' },
});
