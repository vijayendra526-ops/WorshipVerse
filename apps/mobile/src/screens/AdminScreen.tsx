import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, ImageBackground, Modal, Platform,
  ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import ManageSongsScreen from './ManageSongsScreen';

type Language = 'te' | 'en';
type RecentSong = { id: string; title: string; language: string; created_at: string };

const C = {
  bg: '#1E0E19', lowest: '#180913', card: '#2B1A25', low: '#271721',
  high: '#362530', higher: '#422F3B', wine: '#4A0E17', gold: '#F0BF5C',
  pale: '#FFDEA4', text: '#F7DBEA', muted: '#D9C1C1', line: '#544343',
  red: '#FFB3B6',
};
const WORDS = {
  te: {
    dashboard: 'చర్చి అడ్మిన్ డ్యాష్‌బోర్డ్', subtitle: 'Sharon A.G. Church · Worship Ministry Administration',
    access: 'అడ్మిన్ పోర్టల్', library: 'గీతాల లైబ్రరీ', all: 'మొత్తం పాటలు',
    telugu: 'తెలుగు పాటలు', english: 'ఇంగ్లీష్ పాటలు', recentCount: 'ఇటీవలి పాటలు',
    quick: 'త్వరిత చర్యలు', add: 'కొత్త పాటను జోడించండి', manage: 'పాటలను నిర్వహించండి',
    latest: 'ఇటీవల జోడించిన గీతాలు', empty: 'ఇంకా పాటలు జోడించబడలేదు.',
    refresh: 'రిఫ్రెష్', published: 'ప్రచురించిన పాటలు',
    addTitle: 'కొత్త పాటను జోడించండి', title: 'పాట పేరు', lang: 'పాట భాష',
    lyrics: 'పాట సాహిత్యం', roman: 'తెలుగు సాహిత్యం ఆంగ్ల అక్షరాలలో',
    romanHelp: 'తెలుగు పదాలనే ఆంగ్ల అక్షరాలలో రాయండి; అర్థాన్ని అనువదించవద్దు.',
    youtube: 'YouTube లింక్ (ఐచ్ఛికం)', publish: 'పాటను ప్రచురించండి', cancel: 'రద్దు',
    signOut: 'లాగౌట్', footer: 'ప్రతి పాట ఒక ప్రార్థన · ప్రతి వాక్యం ఒక స్తుతి',
    sync: 'లైబ్రరీ గణాంకాలు', required: 'పాట పేరు మరియు సాహిత్యం తప్పనిసరి.',
    romanRequired: 'తెలుగు పాటకు ఆంగ్ల లిప్యంతరీకరణ తప్పనిసరి.',
    success: 'పాట విజయవంతంగా ప్రచురించబడింది!',
  },
  en: {
    dashboard: 'Church Admin Dashboard', subtitle: 'Sharon A.G. Church · Worship Ministry Administration',
    access: 'ADMIN PORTAL', library: 'Song Library', all: 'Total Songs',
    telugu: 'Telugu Songs', english: 'English Songs', recentCount: 'Recent Songs',
    quick: 'Quick Actions', add: 'Add New Song', manage: 'Manage Songs',
    latest: 'Recently Published', empty: 'No songs published yet.',
    refresh: 'Refresh', published: 'Published songs',
    addTitle: 'Add New Song', title: 'Song title', lang: 'Song language',
    lyrics: 'Song lyrics', roman: 'English transliteration',
    romanHelp: 'Write the Telugu words using English letters. Do not translate them.',
    youtube: 'YouTube link (optional)', publish: 'Publish Song', cancel: 'Cancel',
    signOut: 'Sign Out', footer: 'Every Song, A Prayer. Every Verse, A Praise.',
    sync: 'Library statistics', required: 'Please enter a song title and lyrics.',
    romanRequired: 'Please enter English transliteration for Telugu lyrics.',
    success: 'Your song has been published successfully!',
  },
};

export default function AdminScreen() {
  const [interfaceLanguage, setInterfaceLanguage] = useState<Language>('te');
  const t = WORDS[interfaceLanguage];
  const [email, setEmail] = useState('');
  const [songCount, setSongCount] = useState<number | null>(null);
  const [teluguCount, setTeluguCount] = useState<number | null>(null);
  const [englishCount, setEnglishCount] = useState<number | null>(null);
  const [recentSongs, setRecentSongs] = useState<RecentSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showManageSongs, setShowManageSongs] = useState(false);
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState<Language>('te');
  const [lyrics, setLyrics] = useState('');
  const [lyricsTransliteration, setLyricsTransliteration] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { void loadDashboard(); }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Please sign in again.');
      if (!['admin', 'super_admin'].includes(String(user.app_metadata?.role))) {
        throw new Error('Administrator access is required.');
      }
      setEmail(user.email ?? '');
      const [total, te, en, recent] = await Promise.all([
        supabase.from('songs').select('*', { count: 'exact', head: true }),
        supabase.from('songs').select('*', { count: 'exact', head: true }).eq('language', 'te'),
        supabase.from('songs').select('*', { count: 'exact', head: true }).eq('language', 'en'),
        supabase.from('songs').select('id, title, language, created_at')
          .order('created_at', { ascending: false }).limit(5),
      ]);
      if (total.error || te.error || en.error || recent.error) {
        throw new Error(total.error?.message || te.error?.message || en.error?.message || recent.error?.message || 'Dashboard unavailable.');
      }
      setSongCount(total.count ?? 0);
      setTeluguCount(te.count ?? 0);
      setEnglishCount(en.count ?? 0);
      setRecentSongs((recent.data ?? []) as RecentSong[]);
    } catch (error) {
      Alert.alert('Dashboard', error instanceof Error ? error.message : 'Unable to load dashboard.');
    } finally { setLoading(false); }
  }

  async function handleAddSong() {
    if (saving) return;
    if (!title.trim() || !lyrics.trim()) { Alert.alert('Missing Details', t.required); return; }
    if (language === 'te' && !lyricsTransliteration.trim()) {
      Alert.alert('Missing Details', t.romanRequired); return;
    }
    if (youtubeUrl.trim()) {
      try {
        const url = new URL(youtubeUrl.trim());
        if (!['https:', 'http:'].includes(url.protocol) ||
            !['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(url.hostname)) {
          throw new Error('Invalid YouTube URL');
        }
      } catch { Alert.alert('Invalid Link', 'Please enter a valid YouTube URL.'); return; }
    }
    setSaving(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user || !['admin', 'super_admin'].includes(String(user.app_metadata?.role))) {
        throw new Error('Administrator access is required.');
      }
      const { error } = await supabase.from('songs').insert({
        title: title.trim(), language, lyrics: lyrics.trim(),
        lyrics_transliteration: language === 'te' ? lyricsTransliteration.trim() : null,
        youtube_url: youtubeUrl.trim() || null, created_by: user.id,
      });
      if (error) throw error;
      setTitle(''); setLanguage('te'); setLyrics('');
      setLyricsTransliteration(''); setYoutubeUrl(''); setShowAddForm(false);
      await loadDashboard();
      Alert.alert('WorshipVerse', t.success);
    } catch (error) {
      Alert.alert('Could Not Publish', error instanceof Error ? error.message : 'Unable to publish song.');
    } finally { setSaving(false); }
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Sign Out Failed', error.message);
  }

  if (showManageSongs) {
    return <ManageSongsScreen interfaceLanguage={interfaceLanguage} onBack={() => { setShowManageSongs(false); void loadDashboard(); }} />;
  }
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
      <View style={s.topbar}>
        <View style={s.brandRow}>
          <Image source={require('../../assets/website/worshipverse-logo.png')} style={s.logo} />
          <View style={{ flexShrink: 1 }}>
            <Text style={s.brand}>WorshipVerse</Text>
            <Text style={s.church}>SHARON A.G. CHURCH</Text>
          </View>
        </View>
        <View style={s.headerRight}>
          <View style={s.langPill}>
            {(['te', 'en'] as const).map((option) => (
              <TouchableOpacity key={option} style={[s.langChoice, interfaceLanguage === option && s.langSelected]} onPress={() => setInterfaceLanguage(option)}>
                <Text style={[s.langText, interfaceLanguage === option && s.langTextSelected]}>{option === 'te' ? 'తెలుగు' : 'ENG'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.badge}><Text style={s.badgeText}>ADMIN</Text></View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.heroCard}>
          <View style={s.heroTop}>
            <Text style={s.kicker}>✦ {t.access}</Text>
            <Text style={s.status}>{loading ? '…' : '●'} {t.sync}</Text>
          </View>
          <Text style={s.heroTitle}>{t.dashboard}</Text>
          <Text style={s.description}>{t.subtitle}</Text>
          <ImageBackground source={require('../../assets/website/worship-background.jpg')} resizeMode="cover" style={s.banner} imageStyle={s.bannerImage}>
            <View style={s.bannerOverlay}>
              <Text style={s.bannerKicker}>SHARON A.G. CHURCH</Text>
              <Text style={s.bannerTitle}>{interfaceLanguage === 'te' ? 'ఆరాధన గీతాల నిర్వహణ' : 'Worship Library Management'}</Text>
            </View>
          </ImageBackground>
          <Text style={s.email} numberOfLines={1}>{email}</Text>
        </View>

        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>{t.library}</Text>
          <TouchableOpacity onPress={() => { void loadDashboard(); }} disabled={loading} accessibilityRole="button">
            <Text style={s.link}>{loading ? '…' : '↻'} {t.refresh}</Text>
          </TouchableOpacity>
        </View>
        <View style={s.metrics}>
          <Metric icon="♫" label={t.all} value={songCount} detail={t.published} />
          <Metric icon="తె" label={t.telugu} value={teluguCount} detail="Telugu" />
          <Metric icon="EN" label={t.english} value={englishCount} detail="English" />
          <Metric icon="◷" label={t.recentCount} value={loading ? null : recentSongs.length} detail={interfaceLanguage === 'te' ? 'చివరి 5 పాటలు' : 'Last 5 songs'} />
        </View>

        <Text style={s.sectionTitle}>{t.quick}</Text>
        <View style={s.actions}>
          <TouchableOpacity style={s.goldButton} onPress={() => setShowAddForm(true)} accessibilityRole="button">
            <Text style={s.goldButtonText}>＋ {t.add}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionButton} onPress={() => setShowManageSongs(true)} accessibilityRole="button">
            <Text style={s.actionButtonText}>♫ {t.manage}  ›</Text>
          </TouchableOpacity>
        </View>

        <View style={s.recentCard}>
          <View style={s.sectionRowInner}>
            <Text style={s.sectionTitle}>{t.latest}</Text>
            <Text style={s.smallGold}>{recentSongs.length}</Text>
          </View>
          {loading ? <ActivityIndicator color={C.gold} /> : recentSongs.length === 0 ? (
            <Text style={s.muted}>{t.empty}</Text>
          ) : recentSongs.map((song, index) => (
            <View key={song.id} style={s.recentRow}>
              <View style={s.songNumber}><Text style={s.songNumberText}>{index + 1}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.songName} numberOfLines={2}>{song.title}</Text>
                <Text style={s.songInfo}>{song.language === 'te' ? 'తెలుగు' : 'English'}</Text>
              </View>
              <Text style={s.date}>{song.created_at ? new Date(song.created_at).toLocaleDateString() : ''}</Text>
            </View>
          ))}
          <TouchableOpacity style={s.manageLink} onPress={() => setShowManageSongs(true)}>
            <Text style={s.link}>{t.manage}  ›</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={s.logout} onPress={() => { void handleSignOut(); }}>
          <Text style={s.logoutText}>{t.signOut}</Text>
        </TouchableOpacity>
        <Text style={s.footer}>WorshipVerse · SHARON A.G. CHURCH</Text>
        <Text style={s.footerSub}>{t.footer}</Text>
      </ScrollView>

      <Modal visible={showAddForm} transparent animationType="slide" onRequestClose={() => { if (!saving) setShowAddForm(false); }}>
        <View style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <View style={s.modalHead}>
              <Text style={s.modalTitle}>{t.addTitle}</Text>
              <TouchableOpacity onPress={() => setShowAddForm(false)} disabled={saving} accessibilityLabel="Close add song form">
                <Text style={s.close}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
              <Text style={s.label}>{t.title} *</Text>
              <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder={t.title} placeholderTextColor="#9D858E" />
              <Text style={s.label}>{t.lang} *</Text>
              <View style={s.languageRow}>
                {(['te', 'en'] as const).map(option => (
                  <TouchableOpacity key={option} onPress={() => setLanguage(option)} style={[s.languageOption, language === option && s.languageActive]}>
                    <Text style={[s.languageOptionText, language === option && s.languageActiveText]}>{option === 'te' ? 'తెలుగు' : 'English'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={s.label}>{t.lyrics} *</Text>
              <TextInput style={[s.input, s.multiline]} multiline textAlignVertical="top" value={lyrics} onChangeText={setLyrics} placeholder={t.lyrics} placeholderTextColor="#9D858E" />
              {language === 'te' && <>
                <Text style={s.label}>{t.roman} *</Text>
                <Text style={s.helper}>{t.romanHelp}</Text>
                <TextInput style={[s.input, s.multiline]} multiline textAlignVertical="top" value={lyricsTransliteration} onChangeText={setLyricsTransliteration} placeholder="Nee prema chaalunu..." placeholderTextColor="#9D858E" />
              </>}
              <Text style={s.label}>{t.youtube}</Text>
              <TextInput style={s.input} value={youtubeUrl} onChangeText={setYoutubeUrl} placeholder="https://youtube.com/..." placeholderTextColor="#9D858E" autoCapitalize="none" keyboardType="url" />
              <TouchableOpacity style={[s.goldButton, { marginTop: 20 }, saving && { opacity: .5 }]} onPress={() => { void handleAddSong(); }} disabled={saving}>
                {saving ? <ActivityIndicator color={C.bg} /> : <Text style={s.goldButtonText}>{t.publish}</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={s.cancel} onPress={() => setShowAddForm(false)} disabled={saving}>
                <Text style={s.muted}>{t.cancel}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Metric({ icon, label, value, detail }: { icon: string; label: string; value: number | null; detail: string }) {
  return <View style={s.metric}>
    <View style={s.metricTop}><Text style={s.metricLabel}>{label}</Text><Text style={s.metricIcon}>{icon}</Text></View>
    <Text style={s.metricCount}>{value === null ? '—' : value}</Text>
    <Text style={s.metricDetail}>{detail}</Text>
  </View>;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: Platform.OS === 'ios' ? 48 : 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#54434366', gap: 6 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 1 },
  logo: { width: 33, height: 33, borderRadius: 8 },
  brand: { color: C.gold, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 17, fontWeight: '700' },
  church: { fontSize: 8, color: C.pale, letterSpacing: 0.3 },
  headerRight: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  langPill: { flexDirection: 'row', backgroundColor: C.high, borderRadius: 16, padding: 2 },
  langChoice: { paddingHorizontal: 7, paddingVertical: 5, borderRadius: 13 },
  langSelected: { backgroundColor: C.wine },
  langText: { color: C.muted, fontWeight: '700', fontSize: 9 },
  langTextSelected: { color: C.gold },
  badge: { paddingHorizontal: 7, paddingVertical: 6, borderRadius: 13, borderWidth: 1, borderColor: '#F0BF5C55' },
  badgeText: { color: C.gold, fontSize: 9, fontWeight: '700' },
  scroll: { paddingHorizontal: 15, paddingTop: 14, paddingBottom: 36, gap: 15 },
  heroCard: { backgroundColor: C.low, borderRadius: 17, padding: 14, borderWidth: 1, borderColor: '#54434388', gap: 7 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5 },
  kicker: { color: C.gold, fontSize: 10, fontWeight: '800', flexShrink: 1 },
  status: { color: C.muted, fontSize: 9 },
  heroTitle: { fontSize: 27, lineHeight: 35, color: C.text, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontWeight: '700' },
  description: { color: C.muted, fontSize: 11, lineHeight: 17 },
  banner: { height: 144, borderRadius: 12, overflow: 'hidden', marginTop: 5, justifyContent: 'flex-end' },
  bannerImage: { borderRadius: 12 },
  bannerOverlay: { backgroundColor: '#180913BB', padding: 12 },
  bannerKicker: { color: C.pale, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  bannerTitle: { color: C.text, fontSize: 15, fontWeight: '700', marginTop: 5 },
  email: { color: C.muted, fontSize: 10, marginTop: 2 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionRowInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: C.text, fontSize: 19, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontWeight: '700' },
  link: { color: C.gold, fontSize: 11, fontWeight: '700' },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  metric: { width: '48%', flexGrow: 1, backgroundColor: C.card, borderRadius: 13, borderColor: '#54434366', borderWidth: 1, minHeight: 112, padding: 13 },
  metricTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 },
  metricLabel: { fontSize: 11, color: C.muted, fontWeight: '600', flex: 1 },
  metricIcon: { color: C.gold, fontSize: 18, fontWeight: '700' },
  metricCount: { color: C.gold, fontSize: 27, fontWeight: '700', marginTop: 12, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  metricDetail: { color: C.muted, fontSize: 10, marginTop: 3 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  goldButton: { paddingHorizontal: 15, paddingVertical: 13, backgroundColor: C.gold, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: 47 },
  goldButtonText: { color: C.bg, fontSize: 12, fontWeight: '800' },
  actionButton: { backgroundColor: C.high, paddingHorizontal: 14, paddingVertical: 13, borderRadius: 12, minHeight: 47, justifyContent: 'center' },
  actionButtonText: { color: C.text, fontSize: 12, fontWeight: '700' },
  recentCard: { backgroundColor: C.low, borderRadius: 17, padding: 14, gap: 11, borderColor: '#54434366', borderWidth: 1 },
  smallGold: { color: C.gold, fontSize: 12 },
  muted: { color: C.muted, fontSize: 12 },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: C.card, padding: 10, borderRadius: 10 },
  songNumber: { backgroundColor: C.high, width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  songNumberText: { color: C.gold, fontSize: 14, fontWeight: '700' },
  songName: { color: C.text, fontSize: 12, fontWeight: '700' },
  songInfo: { color: C.muted, fontSize: 10, marginTop: 3 },
  date: { color: C.muted, fontSize: 9 },
  manageLink: { alignItems: 'flex-end', paddingTop: 4 },
  logout: { backgroundColor: C.high, borderRadius: 11, alignItems: 'center', padding: 14 },
  logoutText: { color: C.red, fontSize: 12, fontWeight: '700' },
  footer: { color: C.gold, textAlign: 'center', fontSize: 11 },
  footerSub: { color: C.muted, textAlign: 'center', fontSize: 9 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#000000BB' },
  modalCard: { backgroundColor: C.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '91%', paddingHorizontal: 18, paddingTop: 17, borderTopWidth: 1, borderColor: '#F0BF5C66' },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { color: C.gold, fontSize: 21, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  close: { color: C.text, fontSize: 29, paddingHorizontal: 8 },
  label: { color: C.text, fontSize: 12, fontWeight: '700', marginTop: 14, marginBottom: 7 },
  input: { backgroundColor: C.high, color: C.text, borderRadius: 10, padding: 12, fontSize: 13, borderWidth: 1, borderColor: '#54434388' },
  multiline: { minHeight: 140 },
  languageRow: { flexDirection: 'row', gap: 8 },
  languageOption: { flex: 1, backgroundColor: C.high, padding: 12, borderRadius: 9, alignItems: 'center' },
  languageActive: { backgroundColor: C.wine, borderWidth: 1, borderColor: C.gold },
  languageOptionText: { color: C.muted, fontWeight: '700' },
  languageActiveText: { color: C.gold },
  helper: { color: C.muted, fontSize: 11, lineHeight: 16, marginBottom: 8 },
  cancel: { alignItems: 'center', padding: 14 },
});
