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
  Linking,
} from 'react-native';
import { supabase } from '../lib/supabase';
import SongsScreen from './SongsScreen';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

type Language = 'en' | 'te';
type Tab = 'Home' | 'Explore' | 'Favourites' | 'Profile';

export default function HomeScreen() {
  const [language, setLanguage] = useState<Language>('en');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('Home');
  const [loading, setLoading] = useState(false);
  const [selectedSongLanguage, setSelectedSongLanguage] =
    useState<'te' | 'en' | null>(null);

  const isTe = language === 'te';
  const [isListening, setIsListening] = useState(false);

  if (selectedSongLanguage) {
    return (
      <SongsScreen
        language={selectedSongLanguage}
        onBack={() => setSelectedSongLanguage(null)}
      />
    );
  }

  const handleSignOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);

    if (error) {
      Alert.alert('Sign Out Failed', error.message);
    }
  };

  const handleSearch = () => {
    if (!search.trim()) {
      Alert.alert(
        isTe ? 'శోధన' : 'Search',
        isTe ? 'పాట పేరు నమోదు చేయండి.' : 'Please enter a song name.'
      );
      return;
    }

    Alert.alert(
      isTe ? 'త్వరలో వస్తుంది' : 'Coming Soon',
      isTe
        ? 'పాటల శోధన త్వరలో అందుబాటులో ఉంటుంది.'
        : 'Song search will be connected to the library soon.'
    );
  };

  const handleTab = (tab: Tab) => {
    setActiveTab(tab);

    if (tab !== 'Home') {
      Alert.alert(
        tab,
        `${tab} screen will be implemented next.`
      );
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.brand}>
              <Image
                source={require('../../assets/worshipverse-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <View>
                <Text style={styles.brandName}>WorshipVerse</Text>
                <Text style={styles.brandSubtitle}>
                  SHARON A.G. CHURCH
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.languageButton}
              onPress={() =>
                setLanguage(isTe ? 'en' : 'te')
              }
            >
              <Text style={styles.languageButtonText}>
                {isTe ? 'English' : 'తెలుగు'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* HERO */}
        <View style={styles.hero}>
          <View style={styles.heroGlow} />

          <View style={styles.eyebrowContainer}>
            <Text style={styles.eyebrow}>
              {isTe
                ? 'ఆరాధన • స్తుతి • గీతాలు'
                : 'WORSHIP • PRAISE • SONGS'}
            </Text>
          </View>

          <Text style={styles.heroTitle}>
            {isTe
              ? 'మీ హృదయం ఆరాధనతో నిండాలి.'
              : 'Let your heart sing.'}
          </Text>

          <Text style={styles.heroHighlight}>
            {isTe
              ? 'కలిసి ఆరాధిద్దాం.'
              : 'Worship together.'}
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
              style={styles.searchButton}
              onPress={handleSearch}
            >
              <Text style={styles.searchButtonText}>
                {isTe ? 'వెతుకు' : 'Search'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.heroTags}>
            ♫ Telugu Worship  •  ♫ English Worship
          </Text>
        </View>

        {/* FEATURED SONGS */}
        <View style={styles.section}>
          <Text style={styles.eyebrowDark}>
            HANDPICKED FOR WORSHIP
          </Text>

          <View style={styles.featuredHeading}>
            <Text style={styles.sectionTitle}>
              {isTe ? 'ప్రత్యేక గీతాలు' : 'Featured Songs'}
            </Text>

            <TouchableOpacity onPress={() => handleTab('Explore')}>
              <Text style={styles.viewAll}>
                {isTe ? 'అన్నీ చూడండి →' : 'View all →'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.featuredCard}>
            <View style={styles.songArtwork}>
              <Text style={styles.songArtworkIcon}>♫</Text>
              <Text style={styles.songArtworkLabel}>
                WORSHIPVERSE
              </Text>
            </View>

            <View style={styles.songInfo}>
              <Text style={styles.songTitle}>
                {isTe ? 'మీ ఆరాధన గీతాలు' : 'Your Worship Collection'}
              </Text>

              <Text style={styles.songLanguage}>
                TELUGU & ENGLISH
              </Text>

              <Text style={styles.songDescription}>
                {isTe
                  ? 'మీ ఆరాధన గీతాల సేకరణ.'
                  : 'Your featured worship songs will appear here.'}
              </Text>
            </View>
          </View>

          <View style={styles.featuredCard}>
            <View style={[styles.songArtwork, styles.englishArtwork]}>
              <Text style={styles.songArtworkIcon}>✦</Text>
              <Text style={styles.songArtworkLabel}>
                PRAISE & WORSHIP
              </Text>
            </View>

            <View style={styles.songInfo}>
              <Text style={styles.songTitle}>
                {isTe ? 'కొత్త ఆరాధన గీతాలు' : 'Discover New Worship'}
              </Text>

              <Text style={styles.songLanguage}>
                EXPLORE SONGS
              </Text>

              <Text style={styles.songDescription}>
                {isTe
                  ? 'కొత్త ఆరాధన గీతాలను కనుగొనండి.'
                  : 'Find songs for personal and church worship.'}
              </Text>
            </View>
          </View>
        </View>

        {/* LANGUAGE SECTION */}
        <View style={styles.section}>
          <Text style={styles.eyebrowDark}>
            {isTe ? 'మీ ఆరాధనను కనుగొనండి' : 'FIND YOUR WORSHIP'}
          </Text>

          <Text style={styles.sectionTitle}>
            {isTe
              ? 'మీ భాషలో ఆరాధించండి'
              : 'Worship in Your Language'}
          </Text>

          <Text style={styles.sectionSubtitle}>
            {isTe
              ? 'మీకు ఇష్టమైన భాషలో ఆరాధన గీతాలను కనుగొనండి.'
              : 'Explore Christian worship songs and lyrics in Telugu and English.'}
          </Text>

          {/* TELUGU */}
          <TouchableOpacity
            style={styles.languageCard}
            onPress={() => setSelectedSongLanguage('te')}
          >
            <View style={styles.cardTop}>
              <Text style={styles.teluguText}>తెలుగు</Text>
              <Text style={styles.cardArrow}>↗</Text>
            </View>

            <Text style={styles.cardTitle}>
              Telugu Worship Songs
            </Text>

            <Text style={styles.cardSubtitle}>
              Find Telugu Christian worship, praise songs and lyrics.
            </Text>
          </TouchableOpacity>

          {/* ENGLISH */}
          <TouchableOpacity
            style={styles.languageCard}
            onPress={() => setSelectedSongLanguage('en')}
          >
            <View style={styles.cardTop}>
              <Text style={styles.englishSymbol}>Aa</Text>
              <Text style={styles.cardArrow}>↗</Text>
            </View>

            <Text style={styles.cardTitle}>
              English Worship Songs
            </Text>

            <Text style={styles.cardSubtitle}>
              Discover English Christian worship, praise songs and lyrics.
            </Text>
          </TouchableOpacity>
        </View>

        {/* EXPLORE */}
        <View style={styles.exploreSection}>
          <Text style={styles.eyebrowDark}>
            EXPLORE WORSHIPVERSE
          </Text>

          <Text style={styles.sectionTitle}>
            {isTe ? 'ఆరాధన అనుభవం' : 'Everything for Worship'}
          </Text>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>♫</Text>
            <Text style={styles.featureTitle}>Song Lyrics</Text>
            <Text style={styles.featureDescription}>
              Read and follow worship lyrics.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>♡</Text>
            <Text style={styles.featureTitle}>My Favourites</Text>
            <Text style={styles.featureDescription}>
              Keep your favourite songs together.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>▤</Text>
            <Text style={styles.featureTitle}>Playlists</Text>
            <Text style={styles.featureDescription}>
              Create your own worship collections.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>▣</Text>
            <Text style={styles.featureTitle}>Projector Mode</Text>
            <Text style={styles.featureDescription}>
              Present lyrics during church worship.
            </Text>
          </View>
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

          <TouchableOpacity
            style={styles.logout}
            onPress={handleSignOut}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#D8B66C" />
            ) : (
              <Text style={styles.logoutText}>Sign Out</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* FIXED BOTTOM NAVIGATION */}
      <View style={styles.bottomNav}>
        {[
          { name: 'Home' as Tab, icon: '⌂', label: isTe ? 'హోమ్' : 'Home' },
          { name: 'Explore' as Tab, icon: '⌕', label: isTe ? 'వెతుకు' : 'Explore' },
          { name: 'Favourites' as Tab, icon: '♡', label: isTe ? 'ఇష్టమైనవి' : 'Favourites' },
          { name: 'Profile' as Tab, icon: '◉', label: isTe ? 'ప్రొఫైల్' : 'Profile' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.name}
            style={styles.navItem}
            onPress={() => handleTab(tab.name)}
          >
            <Text
              style={[
                styles.navIcon,
                activeTab === tab.name && styles.activeNavIcon,
              ]}
            >
              {tab.icon}
            </Text>

            <Text
              style={[
                styles.navLabel,
                activeTab === tab.name && styles.activeNavLabel,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF8F4',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 12,
  },
  // HEADER
  header: {
    backgroundColor: '#24103F',
    paddingHorizontal: 18,
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
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 10,
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 10,
  },
  brandSubtitle: {
    color: '#D8B66C',
    fontSize: 8,
    letterSpacing: 1.5,
    marginLeft: 10,
    marginTop: 3,
  },
  languageButton: {
    borderWidth: 1,
    borderColor: '#D8B66C',
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  languageButtonText: {
    color: '#D8B66C',
    fontWeight: '700',
    fontSize: 12,
  },
  // HERO
  hero: {
    backgroundColor: '#24103F',
    marginHorizontal: 14,
    marginTop: 16,
    padding: 22,
    borderRadius: 23,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 100,
    backgroundColor: '#65409A',
    opacity: 0.25,
    right: -65,
    top: -65,
  },
  eyebrowContainer: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#D8B66C66',
    backgroundColor: '#FFFFFF10',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 20,
  },
  eyebrow: {
    color: '#D8B66C',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 43,
    fontWeight: '800',
    marginTop: 23,
  },
  heroHighlight: {
    color: '#D8B66C',
    fontSize: 25,
    fontWeight: '700',
    marginTop: 5,
  },
  heroSubtitle: {
    color: '#E8DFF2',
    fontSize: 14,
    lineHeight: 23,
    marginTop: 15,
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    padding: 5,
    marginTop: 23,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    color: '#24103F',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 11,
  },
  searchButton: {
    backgroundColor: '#D8B66C',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  searchButtonText: {
    color: '#24103F',
    fontWeight: '800',
    fontSize: 11,
  },
  heroTags: {
    color: '#E8DFF2',
    fontSize: 10,
    marginTop: 17,
  },
  // SECTION
  section: {
    paddingHorizontal: 18,
    paddingTop: 35,
    paddingBottom: 15,
  },
  eyebrowDark: {
    color: '#A17B38',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  sectionTitle: {
    color: '#32165C',
    fontSize: 25,
    fontWeight: '800',
    marginTop: 10,
  },
  sectionSubtitle: {
    color: '#77717F',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 9,
    marginBottom: 20,
  },
  // FEATURED SONGS
  featuredHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAll: {
    color: '#98712F',
    fontSize: 12,
    fontWeight: '700',
  },
  featuredCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E9E1D3',
    padding: 12,
    marginTop: 14,
    alignItems: 'center',
  },
  songArtwork: {
    width: 95,
    height: 100,
    borderRadius: 13,
    backgroundColor: '#32165C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  englishArtwork: {
    backgroundColor: '#65409A',
  },
  songArtworkIcon: {
    color: '#D8B66C',
    fontSize: 38,
  },
  songArtworkLabel: {
    color: '#FFFFFF',
    fontSize: 7,
    letterSpacing: 1,
    marginTop: 6,
  },
  songInfo: {
    flex: 1,
    paddingLeft: 13,
  },
  songTitle: {
    color: '#32165C',
    fontWeight: '800',
    fontSize: 14,
  },
  songLanguage: {
    color: '#A17B38',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 7,
    letterSpacing: 1,
  },
  songDescription: {
    color: '#77717F',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
  },
  // LANGUAGE CARDS
  languageCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9E1D3',
    borderRadius: 19,
    padding: 20,
    marginBottom: 14,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teluguText: {
    color: '#32165C',
    fontSize: 34,
    fontWeight: '800',
  },
  englishSymbol: {
    color: '#32165C',
    fontSize: 38,
    fontWeight: '800',
  },
  cardArrow: {
    color: '#98712F',
    fontSize: 23,
  },
  cardTitle: {
    color: '#32165C',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 16,
  },
  cardSubtitle: {
    color: '#77717F',
    fontSize: 12,
    lineHeight: 20,
    marginTop: 7,
  },
  // EXPLORE FEATURES
  exploreSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 35,
  },
  featureCard: {
    backgroundColor: '#FAF8F4',
    borderWidth: 1,
    borderColor: '#EEE8DF',
    borderRadius: 17,
    padding: 19,
    marginTop: 14,
  },
  featureIcon: {
    color: '#A17B38',
    fontSize: 30,
  },
  featureTitle: {
    color: '#32165C',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 10,
  },
  featureDescription: {
    color: '#77717F',
    fontSize: 12,
    marginTop: 6,
  },
  // CALL TO ACTION
  cta: {
    backgroundColor: '#32165C',
    paddingHorizontal: 22,
    paddingVertical: 38,
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
    fontSize: 25,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 15,
  },
  ctaDescription: {
    color: '#E8DFF2',
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 12,
  },
  // FOOTER
  footer: {
    backgroundColor: '#1B0D2D',
    padding: 25,
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
    marginTop: 8,
    textAlign: 'center',
  },
  footerCopyright: {
    color: '#A69BAF',
    fontSize: 9,
    marginTop: 17,
    textAlign: 'center',
  },
  logout: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    marginTop: 12,
  },
  logoutText: {
    color: '#D8B66C',
    fontWeight: '700',
  },
  // BOTTOM NAVIGATION
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9E1D3',
    paddingTop: 10,
    paddingBottom: 12,
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navIcon: {
    fontSize: 24,
    color: '#93899D',
  },
  activeNavIcon: {
    color: '#65409A',
  },
  navLabel: {
    fontSize: 10,
    color: '#93899D',
    marginTop: 4,
  },
  activeNavLabel: {
    color: '#32165C',
    fontWeight: '800',
  },
});