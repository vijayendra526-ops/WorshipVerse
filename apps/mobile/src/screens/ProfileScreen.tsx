import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { getOfflineSongs } from '../lib/offlineSongs';

type ProfileScreenProps = {
  onBack: () => void;
};

type InterfaceLanguage = 'te' | 'en';

const COLORS = {
  deep: '#24103F',
  purple: '#32165C',
  gold: '#D8B66C',
  cream: '#FAF8F4',
  white: '#FFFFFF',
  muted: '#77717F',
  border: '#EBE4ED',
  red: '#AD3344',
};

const content = {
  te: {
    back: '← వెనక్కి',
    eyebrow: 'మీ WORSHIPVERSE ఖాతా',
    title: 'నా ప్రొఫైల్',
    subtitle: 'మీ ఖాతా వివరాలను సులభంగా నిర్వహించండి',
    account: 'ఖాతా వివరాలు',
    name: 'మీ పేరు',
    namePlaceholder: 'మీ పేరును నమోదు చేయండి',
    email: 'ఈమెయిల్ చిరునామా',
    emailHelp: 'మీ ఖాతాతో అనుసంధానమైన ఈమెయిల్. ఇక్కడ మార్చలేరు.',
    save: 'మార్పులను సేవ్ చేయండి',
    saving: 'సేవ్ అవుతోంది...',
    signOut: 'సైన్ అవుట్',
    signingOut: 'సైన్ అవుట్ అవుతోంది...',
    logoutTitle: 'సైన్ అవుట్ చేయాలా?',
    logoutBody: 'మీ WorshipVerse ఖాతా నుంచి బయటకు వెళ్లాలనుకుంటున్నారా?',
    cancel: 'రద్దు చేయి',
    logoutConfirm: 'సైన్ అవుట్',
    loading: 'ప్రొఫైల్ లోడ్ అవుతోంది...',
    loginRequired: 'మీ ప్రొఫైల్ చూడడానికి సైన్ ఇన్ చేయండి.',
    retry: 'మళ్లీ ప్రయత్నించండి',
    saved: 'ప్రొఫైల్ విజయవంతంగా నవీకరించబడింది!',
    errorTitle: 'లోపం',
    emptyName: 'దయచేసి మీ పేరును నమోదు చేయండి.',
    unchanged: 'మార్పులు ఏవీ లేవు.',
    security: 'మీ ఖాతా భద్రత',
    securityText: 'మీ వ్యక్తిగత సమాచారం మీ ఖాతాతో అనుసంధానించబడి ఉంటుంది.',
  },
  en: {
    back: '← Back',
    eyebrow: 'YOUR WORSHIPVERSE ACCOUNT',
    title: 'My Profile',
    subtitle: 'Manage your WorshipVerse account details',
    account: 'Account details',
    name: 'Display name',
    namePlaceholder: 'Enter your name',
    email: 'Email address',
    emailHelp: 'Your registered email address cannot be changed here.',
    save: 'Save Changes',
    saving: 'Saving...',
    signOut: 'Sign Out',
    signingOut: 'Signing out...',
    logoutTitle: 'Sign out?',
    logoutBody: 'Are you sure you want to sign out of WorshipVerse?',
    cancel: 'Cancel',
    logoutConfirm: 'Sign Out',
    loading: 'Loading profile...',
    loginRequired: 'Please sign in to view your profile.',
    retry: 'Try again',
    saved: 'Profile updated successfully!',
    errorTitle: 'Error',
    emptyName: 'Please enter your display name.',
    unchanged: 'No changes to save.',
    security: 'Your account is secure',
    securityText: 'Your personal information is linked to your account.',
  },
};

export default function ProfileScreen({ onBack }: ProfileScreenProps) {
  const [language, setLanguage] = useState<InterfaceLanguage>('te');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [message, setMessage] = useState('');
  const [messageIsError, setMessageIsError] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [playlistCount, setPlaylistCount] = useState<number | null>(null);
  const [cachedCount, setCachedCount] = useState<number | null>(null);
  const t = content[language];

  async function loadProfile(isMounted?: () => boolean) {
    setLoading(true);
    setLoadFailed(false);
    try {
      const { data, error } = await supabase.auth.getUser();
      if (isMounted && !isMounted()) return;
      if (error || !data.user) {
        setLoadFailed(true);
        setMessage(error?.message || content[language].loginRequired);
        setMessageIsError(true);
        return;
      }
      const userName = String(data.user.user_metadata?.full_name || data.user.user_metadata?.name || '');
      setEmail(data.user.email ?? '');
      setName(userName);
      setOriginalName(userName.trim());
      setMessage('');
      setMessageIsError(false);
    } catch (error) {
      if (isMounted && !isMounted()) return;
      setLoadFailed(true);
      setMessage(error instanceof Error ? error.message : 'Unable to load profile.');
      setMessageIsError(true);
    } finally {
      if (!isMounted || isMounted()) setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    void loadProfile(() => mounted);
    return () => { mounted = false; };
    // Load the authenticated account once when this screen mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveProfile() {
    if (saving || loadFailed) return;
    const newName = name.trim();
    if (!newName) {
      setMessage(t.emptyName);
      setMessageIsError(true);
      return;
    }
    if (newName === originalName) {
      setMessage(t.unchanged);
      setMessageIsError(false);
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: newName } });
      if (error) throw error;
      setName(newName);
      setOriginalName(newName);
      setMessage(t.saved);
      setMessageIsError(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save profile.');
      setMessageIsError(true);
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    if (saving) return;
    setSaving(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      onBack();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to sign out.');
      setMessageIsError(true);
    } finally {
      setSaving(false);
    }
  }

  function confirmSignOut() {
    setConfirmOpen(true);
  }


  // Load counts from real account and locally cached lyrics. Missing data stays unspecified.
  useEffect(() => {
    let active = true;
    async function loadCounts() {
      try {
        const { data } = await supabase.auth.getUser();
        if (!data.user) return;
        const [favourites, playlists] = await Promise.all([
          supabase.from('favourites').select('song_id', { count: 'exact', head: true }).eq('user_id', data.user.id),
          supabase.from('playlists').select('id', { count: 'exact', head: true }).eq('user_id', data.user.id),
        ]);
        if (active && !favourites.error) setSavedCount(favourites.count ?? 0);
        if (active && !playlists.error) setPlaylistCount(playlists.count ?? 0);
      } catch (error) {
        console.warn('Profile counts unavailable:', error);
      }
      try {
        const [te, en] = await Promise.all([getOfflineSongs('te'), getOfflineSongs('en')]);
        if (active) setCachedCount(te.length + en.length);
      } catch (error) {
        console.warn('Offline count unavailable:', error);
      }
    }
    void loadCounts();
    return () => { active = false; };
  }, []);

  const initials = Array.from(name.trim())[0]?.toLocaleUpperCase() || '♫';
  const isTe = language === 'te';
  const displayName = name.trim() || (isTe ? 'ఆరాధన సభ్యుడు' : 'Worship member');

  return (
    <View style={s.screen}>
      <View style={s.navbar}>
        <TouchableOpacity accessibilityRole="button" onPress={onBack} style={s.brandArea}>
          <Image source={require('../../assets/worshipverse-logo.png')} style={s.logo} resizeMode="contain" />
          <View style={{ flexShrink: 1 }}>
            <Text style={s.brand}>WorshipVerse</Text>
            <Text style={s.brandBadge}>SHARON A.G. CHURCH</Text>
          </View>
        </TouchableOpacity>
        <View style={s.languagePill}>
          {(['te', 'en'] as const).map((option) => (
            <TouchableOpacity key={option} accessibilityRole="button" accessibilityState={{ selected: language === option }}
              onPress={() => { setLanguage(option); setMessage(''); }}
              style={[s.languageButton, language === option && s.languageActive]}>
              <Text style={[s.languageText, language === option && s.languageTextActive]}>{option === 'te' ? 'తెలుగు' : 'ENG'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={s.loading}><ActivityIndicator size="large" color={P.gold} /><Text style={s.muted}>{t.loading}</Text></View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
            <ImageBackground source={require('../../assets/worship-instruments.png')} style={s.banner} resizeMode="cover">
              <View style={s.bannerShade}>
                <Text style={s.churchTag}>✦  SHARON A.G. CHURCH</Text>
              </View>
            </ImageBackground>

            <View style={s.identityCard}>
              <View style={s.identityRow}>
                <View style={s.avatarRing}><View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View></View>
                <View style={s.identityDetails}>
                  <Text style={s.name} numberOfLines={2}>{displayName}</Text>
                  <Text style={s.role}>{isTe ? 'WorshipVerse సభ్యుడు' : 'WorshipVerse Member'}</Text>
                  <Text style={s.email} numberOfLines={2}>{email}</Text>
                </View>
              </View>
              <View style={s.quoteBox}><Text style={s.quoteText}>“{isTe ? 'ఆత్మతోను సత్యముతోను దేవుని ఆరాధించండి.' : 'Worship in spirit and in truth.'}”  ·  {isTe ? 'యోహాను 4:23' : 'John 4:23'}</Text></View>
            </View>

            <View style={s.statsRow}>
              {[{icon:'♥', value:savedCount, te:'ఇష్టమైనవి', en:'Saved'},
                {icon:'☷',value:playlistCount, te:'ప్లేలిస్ట్‌లు', en:'Setlists'},
                {icon:'↓',value:cachedCount, te:'ఆఫ్‌లైన్', en:'Cached'}].map((stat) => (
                <View key={stat.en} style={s.statCard}>
                  <Text style={s.statIcon}>{stat.icon}</Text>
                  <Text style={s.statValue}>{stat.value === null ? '—' : String(stat.value)}</Text>
                  <Text style={s.statLabel}>{isTe ? stat.te : stat.en}</Text>
                </View>
              ))}
            </View>

            <View style={s.sectionHeader}><View style={s.accent}/><Text style={s.sectionTitle}>{isTe ? 'ఖాతా వివరాలు' : 'Account Details'}</Text></View>
            {loadFailed ? (
              <View style={s.panel}>
                <Text style={s.errorText}>{message || t.loginRequired}</Text>
                <TouchableOpacity style={s.primaryButton} onPress={() => { void loadProfile(); }}><Text style={s.primaryText}>{t.retry}</Text></TouchableOpacity>
              </View>
            ) : (
              <View style={s.panel}>
                <Text style={s.fieldLabel}>{t.name}</Text>
                <TextInput value={name} onChangeText={(v) => { setName(v); setMessage(''); }} maxLength={80}
                  placeholder={t.namePlaceholder} placeholderTextColor="#A18C8C"
                  style={s.input} autoCapitalize="words" autoCorrect={false} accessibilityLabel={t.name}/>
                <Text style={s.fieldLabel}>{t.email}</Text>
                <TextInput value={email} editable={false} selectTextOnFocus={false} style={[s.input,s.readOnly]} accessibilityLabel={t.email}/>
                <Text style={s.helper}>{t.emailHelp}</Text>
                {!!message && <View style={[s.messageBox,messageIsError && s.messageError]}><Text style={messageIsError ? s.errorText : s.successText}>{message}</Text></View>}
                <TouchableOpacity style={[s.primaryButton,saving && {opacity:.6}]} disabled={saving} onPress={() => { void saveProfile(); }}>
                  {saving ? <ActivityIndicator color={P.deep} /> : <Text style={s.primaryText}>{t.save}</Text>}
                </TouchableOpacity>
              </View>
            )}

            <View style={s.sectionHeader}><View style={s.accent}/><Text style={s.sectionTitle}>{isTe ? 'ఆరాధన & సంగీతం' : 'Worship & Music'}</Text></View>
            <View style={s.panel}>
              <View style={s.infoRow}><Text style={s.infoIcon}>♫</Text><View style={{flex:1}}><Text style={s.infoTitle}>{isTe ? 'పాటల భాష' : 'Song languages'}</Text><Text style={s.infoDetail}>{isTe ? 'తెలుగు మరియు ఇంగ్లీష్' : 'Telugu and English'}</Text></View></View>
              <View style={s.line}/>
              <View style={s.infoRow}><Text style={s.infoIcon}>Aa</Text><View style={{flex:1}}><Text style={s.infoTitle}>{isTe ? 'లిరిక్స్ చదివే విధానం' : 'Lyrics reading'}</Text><Text style={s.infoDetail}>{isTe ? 'లిరిక్స్ పేజీలో లిపి, ఫాంట్ పరిమాణం మార్చవచ్చు' : 'Adjust script and font size in Song Details'}</Text></View></View>
            </View>

            <View style={s.sectionHeader}><View style={s.accent}/><Text style={s.sectionTitle}>{isTe ? 'చర్చి & సభ్యత్వం' : 'Church & Membership'}</Text></View>
            <View style={s.panel}>
              <View style={s.infoRow}><Text style={s.infoIcon}>✝</Text><View style={{flex:1}}><Text style={s.infoTitle}>SHARON A.G. CHURCH</Text><Text style={s.infoDetail}>{isTe ? 'WorshipVerse ఆరాధన గీతాల సంఘం' : 'WorshipVerse worship community'}</Text></View></View>
              <View style={s.infoNote}><Text style={s.muted}>{isTe ? 'అడ్మిన్ అనుమతులు మీ ఖాతా పాత్ర ఆధారంగా నిర్ణయించబడతాయి.' : 'Admin permissions depend on your authenticated account role.'}</Text></View>
            </View>

            <View style={s.sectionHeader}><View style={s.accent}/><Text style={s.sectionTitle}>{isTe ? 'సెట్టింగులు & భద్రత' : 'Settings & Security'}</Text></View>
            <View style={s.panel}>
              <View style={s.infoRow}><Text style={s.infoIcon}>♢</Text><View style={{flex:1}}><Text style={s.infoTitle}>{t.security}</Text><Text style={s.infoDetail}>{t.securityText}</Text></View></View>
              <View style={s.line}/>
              <TouchableOpacity accessibilityRole="button" style={s.infoRow} disabled={saving} onPress={confirmSignOut}>
                <Text style={[s.infoIcon,{color:P.error}]}>↪</Text><View style={{flex:1}}><Text style={[s.infoTitle,{color:P.error}]}>{t.signOut}</Text><Text style={s.infoDetail}>{isTe ? 'WorshipVerse ఖాతా నుంచి బయటకు వెళ్లండి' : 'Sign out of your WorshipVerse account'}</Text></View><Text style={s.chevron}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={s.footer}><Text style={s.footerBrand}>SHARON A.G. CHURCH</Text><Text style={s.footerText}>Every Song, A Prayer. Every Verse, A Praise.</Text></View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
      <Modal visible={confirmOpen} transparent animationType="fade" onRequestClose={() => setConfirmOpen(false)}>
        <View style={s.modalBackdrop}><View style={s.modalCard}>
          <Text style={s.modalTitle}>{t.logoutTitle}</Text><Text style={s.muted}>{t.logoutBody}</Text>
          <View style={s.modalActions}>
            <TouchableOpacity style={s.modalSecondary} onPress={() => setConfirmOpen(false)}><Text style={s.muted}>{t.cancel}</Text></TouchableOpacity>
            <TouchableOpacity style={s.modalDanger} onPress={() => { setConfirmOpen(false); void signOut(); }}><Text style={s.modalDangerText}>{t.logoutConfirm}</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>
    </View>
  );
}

const P = {deep:'#1E0E19',lowest:'#180913',card:'#2B1A25',low:'#271721',high:'#362530',raised:'#422F3B',wine:'#4A0E17',gold:'#F0BF5C',cream:'#F7DBEA',muted:'#D9C1C1',line:'#544343',error:'#FFB4AB'};
const s = StyleSheet.create({
  screen:{flex:1,backgroundColor:P.deep},
  navbar:{height:73,backgroundColor:P.deep,paddingHorizontal:15,paddingTop:6,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:'#54434366'},
  brandArea:{flexDirection:'row',alignItems:'center',gap:8,flexShrink:1},
  logo:{width:32,height:32,borderRadius:8},brand:{color:P.gold,fontSize:17,fontWeight:'800',fontFamily:Platform.OS==='ios'?'Georgia':'serif'},brandBadge:{fontSize:8,color:'#FFDEA4',fontWeight:'700',marginTop:2},
  languagePill:{flexDirection:'row',backgroundColor:P.high,borderRadius:18,padding:3},languageButton:{paddingHorizontal:9,paddingVertical:6,borderRadius:15},languageActive:{backgroundColor:P.wine},languageText:{fontSize:10,fontWeight:'700',color:P.muted},languageTextActive:{color:P.gold},
  content:{paddingBottom:35},banner:{height:175},bannerShade:{flex:1,backgroundColor:'#1E0E194E',padding:14,justifyContent:'flex-start'},churchTag:{color:P.gold,fontSize:10,fontWeight:'800',backgroundColor:'#180913DD',alignSelf:'flex-start',paddingVertical:6,paddingHorizontal:10,borderRadius:15},
  identityCard:{marginHorizontal:15,marginTop:-55,backgroundColor:P.low,borderRadius:16,padding:15,borderWidth:1,borderColor:'#54434399',elevation:4},identityRow:{flexDirection:'row',alignItems:'center',gap:13},avatarRing:{borderColor:P.gold,borderWidth:2,padding:3,borderRadius:50},avatar:{width:65,height:65,borderRadius:34,backgroundColor:P.raised,alignItems:'center',justifyContent:'center'},avatarText:{fontSize:29,fontWeight:'800',color:P.gold},identityDetails:{flex:1,minWidth:0},name:{color:P.cream,fontSize:21,lineHeight:26,fontWeight:'700',fontFamily:Platform.OS==='ios'?'Georgia':'serif'},role:{color:P.gold,fontSize:12,marginTop:4},email:{color:P.muted,fontSize:11,marginTop:4},quoteBox:{backgroundColor:P.card,padding:10,marginTop:12,borderRadius:10},quoteText:{color:P.muted,fontSize:11,lineHeight:18,fontStyle:'italic'},
  statsRow:{flexDirection:'row',gap:8,marginHorizontal:15,marginTop:15},statCard:{flex:1,alignItems:'center',backgroundColor:P.low,borderRadius:12,paddingVertical:12,paddingHorizontal:3},statIcon:{color:P.gold,fontSize:18},statValue:{color:P.cream,fontSize:20,fontWeight:'800',marginTop:2},statLabel:{color:P.muted,fontSize:10,marginTop:4,textAlign:'center'},
  sectionHeader:{flexDirection:'row',alignItems:'center',marginHorizontal:16,marginTop:23,marginBottom:10,gap:8},accent:{backgroundColor:P.gold,width:4,height:19,borderRadius:2},sectionTitle:{color:P.cream,fontSize:19,fontWeight:'700',fontFamily:Platform.OS==='ios'?'Georgia':'serif'},
  panel:{marginHorizontal:15,backgroundColor:P.low,borderRadius:15,padding:16,borderWidth:1,borderColor:'#54434366'},fieldLabel:{color:P.cream,fontWeight:'700',fontSize:12,marginTop:10,marginBottom:7},input:{backgroundColor:P.raised,borderRadius:10,borderWidth:1,borderColor:P.line,paddingHorizontal:12,paddingVertical:11,color:P.cream,fontSize:14},readOnly:{opacity:.7},helper:{color:P.muted,fontSize:11,lineHeight:17,marginTop:7},primaryButton:{backgroundColor:P.gold,alignItems:'center',justifyContent:'center',borderRadius:10,minHeight:45,marginTop:17,paddingHorizontal:12},primaryText:{color:'#261900',fontWeight:'800',fontSize:13},messageBox:{backgroundColor:P.high,padding:11,borderRadius:10,marginTop:13},messageError:{backgroundColor:P.wine},errorText:{color:P.error,fontSize:12,lineHeight:18},successText:{color:P.gold,fontSize:12,lineHeight:18},
  infoRow:{flexDirection:'row',alignItems:'center',gap:11,paddingVertical:10},infoIcon:{width:33,color:P.gold,fontSize:23,textAlign:'center'},infoTitle:{color:P.cream,fontSize:13,fontWeight:'700'},infoDetail:{color:P.muted,fontSize:11,lineHeight:17,marginTop:4},line:{height:1,backgroundColor:'#54434366',marginVertical:3},infoNote:{backgroundColor:P.card,padding:10,borderRadius:9,marginTop:9},muted:{color:P.muted,fontSize:12,lineHeight:19},chevron:{color:P.gold,fontSize:23},footer:{alignItems:'center',marginTop:30,paddingBottom:20},footerBrand:{color:P.gold,fontSize:11,fontWeight:'700',letterSpacing:1},footerText:{color:P.muted,fontSize:10,marginTop:6},loading:{flex:1,alignItems:'center',justifyContent:'center',gap:12},modalBackdrop:{flex:1,justifyContent:'center',backgroundColor:'#000000BB',padding:20},modalCard:{backgroundColor:P.card,borderRadius:16,padding:20,borderWidth:1,borderColor:P.line},modalTitle:{color:P.cream,fontSize:18,fontWeight:'800',marginBottom:10},modalActions:{flexDirection:'row',justifyContent:'flex-end',gap:10,marginTop:19},modalSecondary:{backgroundColor:P.high,padding:11,borderRadius:9},modalDanger:{backgroundColor:P.wine,padding:11,borderRadius:9},modalDangerText:{color:P.error,fontWeight:'800'}
});
