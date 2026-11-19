import React, { useState } from 'react';
import {
  ActivityIndicator, Image, ImageBackground, KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { supabase } from '../lib/supabase';

type Lang = 'te' | 'en';
type AuthScreenProps = { onBrowse?: () => void };
type Mode = 'login' | 'register' | 'forgot' | 'sent';
const RESET_URL = 'https://worshipverse-silk.vercel.app/reset-password';
const C = {
  bg: '#1E0E19', deep: '#180913', card: '#271721', surface: '#2B1A25',
  high: '#362530', wine: '#4A0E17', gold: '#F0BF5C', pale: '#FFDEA4',
  text: '#F7DBEA', muted: '#D9C1C1', error: '#FFB4AB',
};
const WORDS = {
  te: {
    login: 'తిరిగి స్వాగతం', register: 'కొత్త ఖాతాను సృష్టించండి',
    forgot: 'పాస్‌వర్డ్ రికవరీ', sent: 'ఇమెయిల్ తనిఖీ చేయండి',
    introLogin: 'మీకు ఇష్టమైన పాటలు, సెట్‌లిస్ట్‌లు మరియు సేవ్ చేసిన గీతాలను పొందండి.',
    introRegister: 'ఆరాధన పాటలు మరియు సెట్‌లిస్ట్‌లను సేవ్ చేయడానికి ఖాతా సృష్టించండి.',
    introForgot: 'మీ నమోదిత ఇమెయిల్‌కు పాస్‌వర్డ్ రీసెట్ లింక్ పంపుతాము.',
    introSent: 'రీసెట్ లింక్ కోసం మీ ఇమెయిల్ తనిఖీ చేయండి. స్పామ్ ఫోల్డర్‌ను కూడా చూడండి.',
    name: 'పూర్తి పేరు', email: 'ఇమెయిల్ చిరునామా', password: 'పాస్‌వర్డ్',
    confirm: 'పాస్‌వర్డ్ నిర్ధారించండి',
    submitLogin: 'సైన్ ఇన్', submitRegister: 'ఖాతా సృష్టించండి',
    submitForgot: 'రీసెట్ లింక్ పంపండి',
    forgotLink: 'పాస్‌వర్డ్ మర్చిపోయారా?', registerLink: 'ఖాతా లేదా? రిజిస్టర్ అవ్వండి',
    loginLink: 'ఇప్పటికే ఖాతా ఉందా? సైన్ ఇన్', backLogin: 'సైన్ ఇన్‌కి తిరిగి',
    show: 'చూపు', hide: 'దాచు', browse: 'లాగిన్ లేకుండా పాటలు చూడండి',
    required: 'అవసరమైన వివరాలను నమోదు చేయండి.', emailInvalid: 'సరైన ఇమెయిల్ చిరునామా ఇవ్వండి.',
    short: 'పాస్‌వర్డ్ కనీసం 8 అక్షరాలు ఉండాలి.', mismatch: 'రెండు పాస్‌వర్డ్‌లు ఒకేలా ఉండాలి.',
    verify: 'ఖాతాను ధృవీకరించడానికి మీ ఇమెయిల్‌లోని లింక్‌ను తెరవండి.',
    busy: 'దయచేసి వేచి ఉండండి...',
  },
  en: {
    login: 'Welcome Back', register: 'Create Your Account', forgot: 'Password Recovery', sent: 'Check Your Email',
    introLogin: 'Access your favourite worship songs, setlists and saved lyrics.',
    introRegister: 'Create an account to save worship songs and setlists.',
    introForgot: 'We will email you a secure password-reset link.',
    introSent: 'Check your inbox for the reset link. Also check your spam folder.',
    name: 'Full name', email: 'Email address', password: 'Password', confirm: 'Confirm password',
    submitLogin: 'Sign In', submitRegister: 'Create Account', submitForgot: 'Send Reset Link',
    forgotLink: 'Forgot password?', registerLink: "Don't have an account? Sign up",
    loginLink: 'Already have an account? Sign in', backLogin: 'Back to Sign In',
    show: 'Show', hide: 'Hide', browse: 'Continue browsing without signing in',
    required: 'Please complete the required fields.', emailInvalid: 'Enter a valid email address.',
    short: 'Password must be at least 8 characters.', mismatch: 'Passwords do not match.',
    verify: 'Please open the confirmation link in your email to activate your account.',
    busy: 'Please wait...',
  },
};

export default function AuthScreen({ onBrowse }: AuthScreenProps) {
  const [language, setLanguage] = useState<Lang>('te');
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const t = WORDS[language];

  function changeMode(next: Mode) {
    if (busy) return;
    setMode(next);
    setPassword('');
    setConfirmPassword('');
    setError('');
    setNotice('');
    setShowPassword(false);
    setShowConfirm(false);
  }

  async function submit() {
    if (busy) return;
    setError('');
    setNotice('');
    const cleanEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) { setError(t.emailInvalid); return; }
    if (mode !== 'forgot') {
      if (!password || (mode === 'register' && !name.trim())) { setError(t.required); return; }
      if (mode === 'register') {
        if (password.length < 8) { setError(t.short); return; }
        if (password !== confirmPassword) { setError(t.mismatch); return; }
      }
    }
    setBusy(true);
    try {
      if (mode === 'forgot') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: RESET_URL,
        });
        if (resetError) throw resetError;
        setMode('sent');
      } else if (mode === 'register') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { data: { full_name: name.trim() } },
        });
        if (signUpError) throw signUpError;
        setPassword(''); setConfirmPassword('');
        if (!data.session) { setNotice(t.verify); setMode('login'); }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (signInError) throw signInError;
        setPassword('');
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Please try again.');
    } finally { setBusy(false); }
  }

  const title = mode === 'register' ? t.register : mode === 'forgot' ? t.forgot : mode === 'sent' ? t.sent : t.login;
  const intro = mode === 'register' ? t.introRegister : mode === 'forgot' ? t.introForgot : mode === 'sent' ? t.introSent : t.introLogin;
  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <TouchableOpacity style={s.browseControl} onPress={onBrowse} disabled={!onBrowse} accessibilityRole="button" accessibilityLabel="Continue browsing songs">
            <Text style={s.browseChevron}>‹</Text>
            <View><Text style={s.browsePrimary}>{language === 'te' ? 'పాటలను చూడండి' : 'Browse songs'}</Text><Text style={s.browseSecondary}>{language === 'te' ? 'Browse Songs' : 'Continue as guest'}</Text></View>
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <View style={s.brandLine}>
              <Image source={require('../../assets/website/worshipverse-logo.png')} style={s.logo} resizeMode="contain" />
              <Text style={s.brand}>WorshipVerse</Text>
            </View>
            <Text style={s.church}>SHARON A.G. CHURCH</Text>
          </View>
          <View style={s.headerRight}>
            <View style={s.languages}>
              {(['te','en'] as const).map((lang) => (
                <TouchableOpacity key={lang} onPress={() => setLanguage(lang)} style={[s.langButton, language === lang && s.langActive]} accessibilityRole="button" accessibilityLabel={lang === 'te' ? 'Telugu' : 'English'}>
                  <Text style={[s.langText, language === lang && s.langTextActive]}>{lang === 'te' ? 'తె' : 'EN'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        <View style={s.body}>
          <Text style={s.pageHeading}>{mode === 'login' ? 'Sign In  ·  సైన్ ఇన్' : mode === 'register' ? 'Create Account  ·  ఖాతాను సృష్టించండి' : mode === 'forgot' ? 'Forgot Password  ·  పాస్‌వర్డ్ రికవరీ' : 'Recovery  ·  రికవరీ'}</Text>
          <ImageBackground source={require('../../assets/website/worshipverse-hero-artwork.png')}
            style={s.hero} imageStyle={s.heroImage} resizeMode="cover">
            <View style={s.heroShade}>
              <Text style={s.heroBadge}>SHARON A.G. CHURCH</Text>
              <Text style={s.heroTitle}>ప్రతి పాట ఒక ప్రార్థన.</Text>
              <Text style={s.heroSecond}>ప్రతి వాక్యం ఒక స్తుతి.</Text>
              <Text style={s.heroEnglish}>Every Song, A Prayer. Every Verse, A Praise.</Text>
            </View>
          </ImageBackground>
          <View style={s.formCard}>
            <View style={s.formTitleLine}><Text style={s.formTitle}>{title}</Text><Text style={s.hubPill}>{mode === 'login' ? 'WORSHIP HUB' : mode === 'register' ? 'JOIN WORSHIPVERSE' : 'ACCOUNT HELP'}</Text></View>
            <Text style={s.intro}>{intro}</Text>
            <Text style={s.englishHint}>{mode === 'login' ? 'Access your favorite songs, setlists and saved hymns.' : mode === 'register' ? 'Create an account to save worship songs and praise setlists.' : mode === 'forgot' ? 'Enter your registered email to receive a secure reset link.' : 'Your reset request has been submitted.'}</Text>
            {mode === 'login' && <View style={s.guidance}><Text style={s.guidanceIcon}>ⓘ</Text><Text style={s.guidanceText}>{language === 'te' ? 'నమోదు చేసుకున్న ఇమెయిల్ మరియు పాస్‌వర్డ్ నమోదు చేయండి.' : 'Enter your registered email and password.'}</Text></View>}
            {mode === 'forgot' && <View style={s.recoveryIcon}><Text style={s.recoveryIconText}>↻</Text></View>}
            {mode === 'sent' && <View style={s.sentCard}><Text style={s.sentCheck}>✓</Text><Text style={s.sentTitle}>{language === 'te' ? 'రీసెట్ లింక్ అభ్యర్థన పంపబడింది' : 'Reset link requested'}</Text><Text style={s.sentDescription}>{t.introSent}</Text></View>}
            {mode === 'register' && (
              <View style={s.field}><View style={s.fieldHeading}><Text style={s.label}>{t.name}</Text><Text style={s.fieldEnglish}>Full Name</Text></View><TextInput style={s.input} value={name} onChangeText={setName} maxLength={80} editable={!busy} autoComplete="name" placeholder={t.name} placeholderTextColor="#A18C8C" /></View>
            )}
            {mode !== 'sent' && (
              <View style={s.field}><View style={s.fieldHeading}><Text style={s.label}>{t.email}</Text><Text style={s.fieldEnglish}>Email Address</Text></View><TextInput style={s.input} value={email} onChangeText={setEmail} editable={!busy} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" placeholder="name@domain.com" placeholderTextColor="#A18C8C" /></View>
            )}
            {(mode === 'login' || mode === 'register') && (
              <View style={s.field}>
                <View style={s.labelLine}><View style={s.fieldHeading}><Text style={s.label}>{t.password}</Text><Text style={s.fieldEnglish}>Password</Text></View>{mode === 'login' && <TouchableOpacity onPress={() => changeMode('forgot')} accessibilityRole="button"><Text style={s.textLink}>{t.forgotLink}</Text></TouchableOpacity>}</View>
                <View style={s.passwordRow}><TextInput style={s.passwordInput} value={password} onChangeText={setPassword} editable={!busy} secureTextEntry={!showPassword} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} autoCapitalize="none" placeholder="••••••••" placeholderTextColor="#A18C8C" />
                  <TouchableOpacity style={s.showControl} onPress={() => setShowPassword(!showPassword)} accessibilityRole="button"><Text style={s.textLink}>{showPassword ? t.hide : t.show}</Text></TouchableOpacity>
                </View>
                {mode === 'register' && <View style={s.strengthWrap}>
                  <View style={s.strengthTrack}><View style={[s.strengthFill,{width: password.length < 8 ? '22%' : /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password) ? '100%' : '62%'}]} /></View>
                  <Text style={s.strengthCaption}>{password.length < 8 ? (language === 'te' ? 'కనీసం 8 అక్షరాలు అవసరం' : 'Use at least 8 characters') : (language === 'te' ? 'పాస్‌వర్డ్ పొడవు సరిపోతుంది' : 'Password length is sufficient')}</Text>
                </View>}
              </View>
            )}
            {mode === 'register' && <View style={s.field}><View style={s.fieldHeading}><Text style={s.label}>{t.confirm}</Text><Text style={s.fieldEnglish}>Confirm Password</Text></View><View style={s.passwordRow}><TextInput style={s.passwordInput} value={confirmPassword} onChangeText={setConfirmPassword} editable={!busy} secureTextEntry={!showConfirm} autoComplete="new-password" autoCapitalize="none" placeholder="••••••••" placeholderTextColor="#A18C8C" /><TouchableOpacity style={s.showControl} onPress={() => setShowConfirm(!showConfirm)}><Text style={s.textLink}>{showConfirm ? t.hide : t.show}</Text></TouchableOpacity></View></View>}
            {!!error && <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View>}
            {!!notice && <View style={s.noticeBox}><Text style={s.noticeText}>{notice}</Text></View>}
            {mode !== 'sent' && <TouchableOpacity style={[s.mainButton, busy && s.disabled]} disabled={busy} onPress={() => void submit()} accessibilityRole="button">
              {busy ? <ActivityIndicator color={C.bg} /> : <Text style={s.mainButtonText}>{mode === 'forgot' ? t.submitForgot : mode === 'register' ? t.submitRegister : t.submitLogin}  →</Text>}
            </TouchableOpacity>}
            <TouchableOpacity style={s.switchLink} onPress={() => changeMode(mode === 'register' ? 'login' : mode === 'login' ? 'register' : 'login')} accessibilityRole="button">
              <Text style={s.switchText}>{mode === 'register' ? t.loginLink : mode === 'login' ? t.registerLink : t.backLogin}</Text>
            </TouchableOpacity>
            {onBrowse && <TouchableOpacity style={s.guestAction} onPress={onBrowse} accessibilityRole="button"><Text style={s.guestText}>{language === 'te' ? 'అతిథిగా పాటలను చూడండి' : 'Continue Browsing as Guest'}  ›</Text></TouchableOpacity>}
            <View style={s.securityRow}><Text style={s.securityText}>♙  Secure access powered by Supabase Auth</Text></View>
          </View>
          <Text style={s.footer}>WorshipVerse · SHARON A.G. CHURCH</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const s = StyleSheet.create({
  root: { flex:1, backgroundColor:C.bg }, scroll: { flexGrow:1 },
  header: { backgroundColor:C.bg, minHeight:75, flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:10, paddingTop:Platform.OS === 'ios' ? 45 : 10, paddingBottom:9, borderBottomColor:'#54434355', borderBottomWidth:1 },
  browseControl: { width:100, minHeight:44, flexDirection:'row', alignItems:'center', gap:3, backgroundColor:C.card, borderRadius:21, paddingHorizontal:6 },
  browseChevron: {color:C.gold,fontSize:24}, browsePrimary:{color:C.gold,fontSize:9,fontWeight:'800'},browseSecondary:{color:C.muted,fontSize:8},
  headerCenter: { flex:1, alignItems:'center', minWidth:0 },brandLine:{flexDirection:'row',alignItems:'center',gap:3},logo:{width:22,height:22},brand:{fontSize:14,fontWeight:'700',color:C.gold},church:{color:C.muted,fontSize:7,letterSpacing:.8},
  headerRight:{width:77,alignItems:'flex-end'}, languages:{backgroundColor:C.deep,flexDirection:'row',borderRadius:20,padding:3},langButton:{paddingHorizontal:8,paddingVertical:6,borderRadius:17},langActive:{backgroundColor:C.wine},langText:{color:C.muted,fontSize:10,fontWeight:'700'},langTextActive:{color:C.gold},
  body:{width:'100%',maxWidth:480,alignSelf:'center',paddingHorizontal:15,paddingTop:11,paddingBottom:22},
  pageHeading:{color:C.text,fontSize:18,fontWeight:'600',textAlign:'center',marginBottom:11},
  hero:{height:174,overflow:'hidden',borderRadius:16,backgroundColor:C.card},heroImage:{borderRadius:16},
  heroShade:{flex:1,justifyContent:'flex-end',padding:15,backgroundColor:'rgba(24,9,19,0.38)'},
  heroBadge:{color:C.gold,fontWeight:'800',letterSpacing:1,fontSize:9,marginBottom:6},
  heroTitle:{color:C.gold,fontSize:25,lineHeight:33,fontWeight:'700'},heroSecond:{color:C.text,fontSize:18,fontWeight:'600',lineHeight:26},heroEnglish:{color:C.pale,fontSize:10,marginTop:4},
  formCard:{backgroundColor:C.card,borderRadius:16,marginTop:15,padding:16,borderWidth:1,borderColor:'#54434366'},
  formTitleLine:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:8},formTitle:{fontSize:23,lineHeight:32,color:C.gold,fontWeight:'700',flexShrink:1},hubPill:{fontSize:8,color:C.gold,fontWeight:'800',backgroundColor:'#322200',borderRadius:10,paddingHorizontal:7,paddingVertical:5},
  intro:{fontSize:12,lineHeight:19,color:C.muted,marginTop:4},englishHint:{fontSize:10,lineHeight:16,color:'#B9A4AA',marginBottom:13,marginTop:3},
  guidance:{flexDirection:'row',alignItems:'center',gap:8,backgroundColor:C.surface,padding:10,borderRadius:9,marginBottom:15},guidanceIcon:{fontSize:17,color:C.gold},guidanceText:{color:C.muted,fontSize:10,lineHeight:15,flex:1},
  field:{marginBottom:14},fieldHeading:{flexDirection:'row',alignItems:'center',gap:5,flexShrink:1},label:{color:C.text,fontWeight:'700',fontSize:12,marginBottom:7},fieldEnglish:{color:C.muted,fontSize:10,marginBottom:7},labelLine:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:8},
  input:{backgroundColor:C.surface,borderRadius:9,color:C.text,paddingHorizontal:13,paddingVertical:12,fontSize:14,minHeight:48},
  passwordRow:{flexDirection:'row',backgroundColor:C.surface,borderRadius:9,alignItems:'center'},passwordInput:{flex:1,minHeight:48,paddingHorizontal:13,paddingVertical:12,color:C.text,fontSize:14},showControl:{paddingHorizontal:12,paddingVertical:11},textLink:{color:C.gold,fontSize:10,fontWeight:'700'},
  strengthWrap:{marginTop:9},strengthTrack:{height:4,borderRadius:4,backgroundColor:C.high,overflow:'hidden'},strengthFill:{backgroundColor:C.gold,height:4,borderRadius:4},strengthCaption:{color:C.muted,fontSize:10,marginTop:6},
  mainButton:{backgroundColor:C.gold,marginTop:6,minHeight:49,borderRadius:9,justifyContent:'center',alignItems:'center'},mainButtonText:{color:C.bg,fontWeight:'800',fontSize:13},disabled:{opacity:0.55},
  switchLink:{marginTop:12,paddingVertical:8,alignItems:'center'},switchText:{color:C.gold,fontWeight:'700',fontSize:12,textAlign:'center'},guestAction:{alignItems:'center',marginTop:2,padding:8},guestText:{color:C.pale,fontSize:11,fontWeight:'600'},
  securityRow:{borderTopColor:'#54434355',borderTopWidth:1,paddingTop:12,marginTop:7,alignItems:'center'},securityText:{color:C.muted,fontSize:9},
  recoveryIcon:{width:42,height:42,borderRadius:21,backgroundColor:C.wine,justifyContent:'center',alignItems:'center',alignSelf:'center',marginBottom:12},recoveryIconText:{color:C.gold,fontSize:23},
  sentCard:{backgroundColor:C.surface,padding:15,borderRadius:12,alignItems:'center',gap:8},sentCheck:{fontSize:26,color:C.gold},sentTitle:{color:C.text,fontSize:15,fontWeight:'700'},sentDescription:{color:C.muted,fontSize:12,textAlign:'center',lineHeight:19},
  errorBox:{backgroundColor:'#4A0E17',padding:12,borderRadius:10,marginBottom:10},errorText:{color:C.error,fontSize:12,lineHeight:19},noticeBox:{backgroundColor:C.high,padding:12,borderRadius:10,marginBottom:10},noticeText:{color:C.gold,fontSize:12,lineHeight:19},footer:{textAlign:'center',color:C.muted,fontSize:10,marginTop:17},
});
