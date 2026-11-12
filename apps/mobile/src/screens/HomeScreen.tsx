
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Keyboard,
} from 'react-native';

import { supabase } from '../lib/supabase';
import SongsScreen from './SongsScreen';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import ProfileScreen from './ProfileScreen';
import FavouritesScreen from './FavouritesScreen';
import PlaylistsScreen from './PlaylistsScreen';
import SettingsScreen from './SettingsScreen';

type Language = 'en' | 'te';

export default function HomeScreen() {
  const [language, setLanguage] = useState<Language>('en');
  const [search, setSearch] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedSongLanguage, setSelectedSongLanguage] =
    useState<Language | null>(null);
  const [initialSearch, setInitialSearch] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showFavourites, setShowFavourites] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const isTe = language === 'te';

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? '');
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserEmail(session?.user?.email ?? '');
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
    setVoiceMessage(isTe ? 'వింటున్నాను...' : 'Listening...');
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript?.trim() ?? '';

    if (transcript) {
      setSearch(transcript);
      setVoiceMessage(
        isTe ? 'గుర్తించబడింది!' : 'Voice recognized!'
      );
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    setIsListening(false);
    setVoiceMessage(
      event.message || event.error || 'Voice search failed.'
    );
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
  });

  if (selectedSongLanguage) {
    return (
      <SongsScreen
        language={selectedSongLanguage}
        initialSearch={initialSearch}
        onBack={() => {
          setSelectedSongLanguage(null);
          setInitialSearch('');
        }}
      />
    );
  }

  if (showProfile) {
    return (
      <ProfileScreen onBack={() => setShowProfile(false)} />
    );
  }

  if (showFavourites) {
    return (
      <FavouritesScreen
        onBack={() => setShowFavourites(false)}
        onBrowseSongs={() => {
          setShowFavourites(false);
          setInitialSearch('');
          setSelectedSongLanguage('en');
        }}
      />
    );
  }

  if (showPlaylists) {
    return (
      <PlaylistsScreen
        onBack={() => setShowPlaylists(false)}
      />
    );
  }

  if (showSettings) {
    return (
      <SettingsScreen
        onBack={() => setShowSettings(false)}
      />
    );
  }

  async function handleSignOut() {
    setLoading(true);

    const { error } = await supabase.auth.signOut();

    setLoading(false);

    if (error) {
      Alert.alert('Sign Out Failed', error.message);
      return;
    }

    setProfileOpen(false);
  }

  function handleSearch() {
    if (!search.trim()) {
      Alert.alert(
        isTe ? 'శోధన' : 'Search',
        isTe ? 'పాట పేరు నమోదు చేయండి.' : 'Please enter a song name.'
      );
      return;
    }

    Keyboard.dismiss();
    setInitialSearch(search.trim());
    setSelectedSongLanguage(language);
  }

  async function startVoiceSearch() {
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
        lang: isTe ? 'te-IN' : 'en-IN',
        interimResults: true,
        continuous: false,
      });
    } catch (error) {
      console.error('Voice search error:', error);
      setIsListening(false);
      setVoiceMessage(
        isTe
          ? 'వాయిస్ శోధన ప్రారంభించలేకపోయాము.'
          : 'Unable to start voice search.'
      );
    }
  }

  function openLanguage(selectedLanguage: Language) {
    setInitialSearch('');
    setSearch('');
    setSelectedSongLanguage(selectedLanguage);
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* WEBSITE HEADER */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.brand}>
              <Image
                source={require('../../assets/worshipverse-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />

              <View style={styles.brandText}>
                <Text style={styles.brandName}>WorshipVerse</Text>
                <Text style={styles.brandSubtitle}>
                  SHARON A.G. CHURCH
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.accountButton}
                onPress={() => setProfileOpen(true)}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {userEmail ? userEmail[0].toUpperCase() : 'U'}
                  </Text>
                </View>
                <Text style={styles.accountArrow}>⌄</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.languageButton}
                onPress={() => setLanguage(isTe ? 'en' : 'te')}
              >
                <Text style={styles.languageButtonText}>
                  {isTe ? 'English' : 'తెలుగు'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* HERO */}
        <View style={styles.hero}>
          <View style={styles.heroGlowTop} />
          <View style={styles.heroGlowBottom} />

          <View style={styles.eyebrowContainer}>
            <View style={styles.goldDot} />
            <Text style={styles.eyebrow}>
              {isTe
                ? 'ఆరాధన • స్తుతి • గీతాలు'
                : 'WORSHIP • PRAISE • SONGS'}
            </Text>
          </View>

          <Text style={styles.heroTitle}>
            {isTe
              ? 'ప్రతి పాట ఒక ప్రార్థన.'
              : 'Let your heart'}
          </Text>

          <Text style={styles.heroHighlight}>
            {isTe ? 'ప్రతి వాక్యం ఒక స్తుతి.' : 'sing in worship.'}
          </Text>

          <Text style={styles.heroSubtitle}>
            {isTe
              ? 'తెలుగు మరియు ఆంగ్ల క్రైస్తవ ఆరాధన గీతాలను ఒకే చోట కనుగొనండి.'
              : 'Discover Telugu and English Christian worship songs, lyrics and praise in one place.'}
          </Text>

          {/* SEARCH */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder={
                isTe
                  ? 'పాట పేరు లేదా పదాలు వెతకండి...'
                  : 'Search songs, lyrics or artists...'
              }
              placeholderTextColor="#93899D"
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />

            <TouchableOpacity
              style={[
                styles.voiceButton,
                isListening && styles.voiceButtonActive,
              ]}
              onPress={() => {
                if (isListening) {
                  ExpoSpeechRecognitionModule.stop();
                } else {
                  startVoiceSearch();
                }
              }}
            >
              <Text style={styles.voiceButtonText}>
                {isListening ? '■' : '🎙'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}
            >
              <Text style={styles.searchButtonText}>
                {isTe ? 'వెతకండి' : 'Search'}
              </Text>
            </TouchableOpacity>
          </View>

          {!!voiceMessage && (
            <Text style={styles.voiceMessage}>{voiceMessage}</Text>
          )}

          <View style={styles.heroTags}>
            <Text style={styles.heroTag}>♫ Telugu Worship</Text>
            <Text style={styles.tagDot}>•</Text>
            <Text style={styles.heroTag}>♫ English Worship</Text>
            <Text style={styles.tagDot}>•</Text>
            <Text style={styles.heroTag}>✦ Praise Together</Text>
          </View>

          {/* WEBSITE HERO VISUAL PANEL */}
          <View style={styles.visualOuter}>
            <View style={styles.visualPanel}>
              <View style={styles.visualCircle}>
                <Text style={styles.visualMusic}>♫</Text>
              </View>

              <Text style={styles.visualBrand}>WORSHIPVERSE</Text>

              <Text style={styles.visualTitle}>
                {isTe ? 'స్తుతి గీతాలు' : 'Songs of Praise'}
              </Text>

              <Text style={styles.visualSubtitle}>
                {isTe
                  ? 'కలిసి పాడుదాం. కలిసి ఆరాధిద్దాం.'
                  : 'Sing together. Worship together. Grow together.'}
              </Text>

              <View style={styles.visualDivider} />

              <Text style={styles.visualFooter}>
                EVERY SONG, A PRAYER
              </Text>
            </View>

            <View style={styles.visualBottom}>
              <Text style={styles.visualChurch}>SHARON A.G. CHURCH</Text>
              <Text style={styles.visualGold}>WORSHIPVERSE</Text>
            </View>
          </View>
        </View>

        {/* LANGUAGE SELECTION */}
        <View style={styles.languageSection}>
          <Text style={styles.sectionEyebrow}>
            {isTe ? 'భాషను ఎంచుకోండి' : 'EXPLORE BY LANGUAGE'}
          </Text>

          <Text style={styles.sectionTitle}>
            {isTe
              ? 'మీ భాషలో ఆరాధించండి'
              : 'Worship in your language.'}
          </Text>

          <Text style={styles.sectionSubtitle}>
            {isTe
              ? 'మీకు ఇష్టమైన భాషలో ఆరాధన గీతాలను కనుగొనండి.'
              : 'Discover songs of praise and worship in the language closest to your heart.'}
          </Text>

          {/* TELUGU CARD */}
          <TouchableOpacity
            style={styles.languageCard}
            activeOpacity={0.85}
            onPress={() => openLanguage('te')}
          >
            <View style={styles.cardDecoration} />

            <Text style={styles.cardEyebrow}>
              01 · TELUGU COLLECTION
            </Text>

            <Text style={styles.teluguCardTitle}>తెలుగు</Text>

            <Text style={styles.cardDescription}>
              Telugu Christian worship and praise songs
            </Text>

            <View style={styles.cardBottom}>
              <Text style={styles.cardExplore}>EXPLORE SONGS</Text>
              <Text style={styles.cardArrow}>↗</Text>
            </View>
          </TouchableOpacity>

          {/* ENGLISH CARD */}
          <TouchableOpacity
            style={[styles.languageCard, styles.englishCard]}
            activeOpacity={0.85}
            onPress={() => openLanguage('en')}
          >
            <View style={styles.cardDecoration} />

            <Text style={styles.cardEyebrow}>
              02 · ENGLISH COLLECTION
            </Text>

            <Text style={styles.englishCardTitle}>English</Text>

            <Text style={styles.cardDescription}>
              English Christian worship and praise songs
            </Text>

            <View style={styles.cardBottom}>
              <Text style={styles.cardExplore}>EXPLORE SONGS</Text>
              <Text style={styles.cardArrow}>↗</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* CALL TO ACTION */}
        <View style={styles.cta}>
          <Text style={styles.ctaEyebrow}>
            SHARON A.G. CHURCH
          </Text>

          <Text style={styles.ctaTitle}>
            {isTe
              ? 'ఆరాధనలో మాతో చేరండి'
              : 'Be Part of the Worship'}
          </Text>

          <Text style={styles.ctaDescription}>
            {isTe
              ? 'మీ ఆరాధన ప్రయాణాన్ని WorshipVerse తో ప్రారంభించండి.'
              : 'Start your worship journey with WorshipVerse.'}
          </Text>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>WorshipVerse</Text>

          <Text style={styles.footerTagline}>
            Every Song, A Prayer. Every Verse, A Praise.
          </Text>

          <Text style={styles.footerCopyright}>
            © 2026 WorshipVerse · SHARON A.G. CHURCH
          </Text>
        </View>
      </ScrollView>

      {/* ACCOUNT MENU */}
      <Modal
        visible={profileOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setProfileOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.accountMenu}
            onPress={() => {}}
          >
            <Text style={styles.accountMenuTitle}>My Account</Text>

            <Text style={styles.accountMenuLabel}>Signed in as</Text>
            <Text style={styles.accountEmail}>
              {userEmail || 'WorshipVerse Member'}
            </Text>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => {
                setProfileOpen(false);
                setShowProfile(true);
              }}
            >
              <Text style={styles.menuButtonText}>My Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => {
                setProfileOpen(false);
                setShowFavourites(true);
              }}
            >
              <Text style={styles.menuButtonText}>My Favourites</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => {
                setProfileOpen(false);
                setShowPlaylists(true);
              }}
            >
              <Text style={styles.menuButtonText}>My Playlists</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => {
                setProfileOpen(false);
                setShowSettings(true);
              }}
            >
              <Text style={styles.menuButtonText}>Account Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setProfileOpen(false)}
            >
              <Text style={styles.menuButtonText}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#B42318" />
              ) : (
                <Text style={styles.signOutText}>Sign Out</Text>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF8F4',
  },
  scrollContent: {
    paddingBottom: 0,
  },
  header: {
    backgroundColor: '#24103F',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 45,
    height: 45,
    borderRadius: 10,
  },
  brandText: {
    marginLeft: 9,
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  brandSubtitle: {
    color: '#D8B66C',
    fontSize: 8,
    letterSpacing: 1.4,
    marginTop: 3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D8B66C80',
    borderRadius: 25,
    padding: 4,
    gap: 5,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#D8B66C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#24103F',
    fontWeight: '800',
  },
  accountArrow: {
    color: '#FFFFFF',
    paddingHorizontal: 5,
  },
  languageButton: {
    borderWidth: 1,
    borderColor: '#D8B66C',
    borderRadius: 22,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  languageButtonText: {
    color: '#D8B66C',
    fontSize: 11,
    fontWeight: '700',
  },
  hero: {
    backgroundColor: '#24103F',
    marginHorizontal: 12,
    marginTop: 14,
    padding: 19,
    borderRadius: 24,
    overflow: 'hidden',
  },
  heroGlowTop: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 100,
    backgroundColor: '#65409A',
    opacity: 0.25,
    right: -75,
    top: -75,
  },
  heroGlowBottom: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 100,
    backgroundColor: '#D8B66C',
    opacity: 0.08,
    left: -90,
    bottom: -90,
  },
  eyebrowContainer: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#D8B66C66',
    backgroundColor: '#FFFFFF10',
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 20,
  },
  goldDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D8B66C',
  },
  eyebrow: {
    color: '#D8B66C',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 43,
    fontWeight: '700',
    marginTop: 26,
  },
  heroHighlight: {
    color: '#D8B66C',
    fontSize: 27,
    lineHeight: 36,
    fontWeight: '700',
    marginTop: 4,
  },
  heroSubtitle: {
    color: '#E8DFF2',
    fontSize: 13,
    lineHeight: 22,
    marginTop: 16,
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 5,
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: '#24103F',
    fontSize: 12,
    paddingHorizontal: 9,
    paddingVertical: 12,
  },
  searchButton: {
    backgroundColor: '#D8B66C',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 13,
  },
  searchButtonText: {
    color: '#24103F',
    fontWeight: '800',
    fontSize: 11,
  },
  voiceButton: {
    width: 38,
    height: 40,
    backgroundColor: '#32165C',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  voiceButtonActive: {
    backgroundColor: '#B42318',
  },
  voiceButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
  },
  voiceMessage: {
    color: '#D8B66C',
    fontSize: 11,
    marginTop: 9,
  },
  heroTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 17,
    gap: 6,
  },
  heroTag: {
    color: '#E8DFF2',
    fontSize: 9,
  },
  tagDot: {
    color: '#D8B66C',
    fontSize: 10,
  },
  visualOuter: {
    marginTop: 28,
    borderWidth: 1,
    borderColor: '#FFFFFF26',
    borderRadius: 24,
    padding: 9,
    backgroundColor: '#FFFFFF10',
  },
  visualPanel: {
    minHeight: 300,
    borderRadius: 19,
    backgroundColor: '#43236F',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  visualCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: '#D8B66C',
    backgroundColor: '#FFFFFF12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  visualMusic: {
    color: '#D8B66C',
    fontSize: 43,
  },
  visualBrand: {
    color: '#D8B66C',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    marginTop: 27,
  },
  visualTitle: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: '700',
    marginTop: 12,
  },
  visualSubtitle: {
    color: '#FFFFFFAA',
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 20,
    marginTop: 12,
  },
  visualDivider: {
    width: 55,
    height: 1,
    backgroundColor: '#D8B66C',
    marginTop: 22,
  },
  visualFooter: {
    color: '#FFFFFF88',
    fontSize: 9,
    letterSpacing: 2,
    marginTop: 17,
  },
  visualBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 15,
  },
  visualChurch: {
    color: '#FFFFFF99',
    fontSize: 9,
  },
  visualGold: {
    color: '#D8B66C',
    fontSize: 9,
    fontWeight: '700',
  },
  languageSection: {
    paddingHorizontal: 18,
    paddingTop: 34,
    paddingBottom: 30,
  },
  sectionEyebrow: {
    color: '#A17B38',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  sectionTitle: {
    color: '#32165C',
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    marginTop: 12,
  },
  sectionSubtitle: {
    color: '#77717F',
    fontSize: 13,
    lineHeight: 22,
    marginTop: 12,
    marginBottom: 22,
  },
  languageCard: {
    backgroundColor: '#24103F',
    borderRadius: 24,
    padding: 22,
    minHeight: 245,
    justifyContent: 'space-between',
    marginBottom: 15,
    overflow: 'hidden',
  },
  englishCard: {
    backgroundColor: '#43236F',
  },
  cardDecoration: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#FFFFFF20',
    right: -45,
    top: -55,
  },
  cardEyebrow: {
    color: '#D8B66C',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
  },
  teluguCardTitle: {
    color: '#FFFFFF',
    fontSize: 43,
    fontWeight: '700',
    marginTop: 30,
  },
  englishCardTitle: {
    color: '#FFFFFF',
    fontSize: 43,
    fontWeight: '700',
    marginTop: 30,
  },
  cardDescription: {
    color: '#FFFFFFAA',
    fontSize: 12,
    marginTop: 8,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF25',
    paddingTop: 17,
    marginTop: 24,
  },
  cardExplore: {
    color: '#D8B66C',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  cardArrow: {
    color: '#D8B66C',
    fontSize: 25,
  },
  cta: {
    backgroundColor: '#32165C',
    paddingHorizontal: 24,
    paddingVertical: 43,
    alignItems: 'center',
  },
  ctaEyebrow: {
    color: '#D8B66C',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
  },
  ctaTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 17,
  },
  ctaDescription: {
    color: '#E8DFF2',
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 12,
  },
  footer: {
    backgroundColor: '#1B0D2D',
    padding: 28,
    alignItems: 'center',
  },
  footerBrand: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  footerTagline: {
    color: '#D8B66C',
    fontSize: 10,
    marginTop: 9,
    textAlign: 'center',
  },
  footerCopyright: {
    color: '#A69BAF',
    fontSize: 9,
    marginTop: 19,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  accountMenu: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
  },
  accountMenuTitle: {
    color: '#32165C',
    fontSize: 21,
    fontWeight: '800',
  },
  accountMenuLabel: {
    color: '#77717F',
    fontSize: 12,
    marginTop: 20,
  },
  accountEmail: {
    color: '#32165C',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 5,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E9E1D3',
    marginTop: 20,
  },
  menuButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  menuButtonText: {
    color: '#32165C',
    fontWeight: '700',
  },
  signOutButton: {
    borderTopWidth: 1,
    borderTopColor: '#E9E1D3',
    paddingTop: 15,
    alignItems: 'center',
  },
  signOutText: {
    color: '#B42318',
    fontWeight: '700',
  },
});
