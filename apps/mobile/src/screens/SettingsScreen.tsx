import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Linking, Modal, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { supabase } from '../lib/supabase';

type Props = { onBack: () => void };
type Language = 'te' | 'en';
const C = {
  bg: '#1E0E19', deep: '#180913', card: '#2B1A25', low: '#271721',
  high: '#362530', raised: '#422F3B', wine: '#4A0E17', gold: '#F0BF5C',
  cream: '#F7DBEA', muted: '#D9C1C1', rose: '#FFB3B6', line: '#544343',
};
const LATEST_URL = 'https://worshipverse-silk.vercel.app/latest-version.json';
const DOWNLOAD_URL = 'https://worshipverse-silk.vercel.app/download';
const INSTALLED_VERSION: string = (require('../../app.json') as {expo:{version:string}}).expo.version;
const tr = {
  te: {
    back:'వెనుకకు', title:'సెట్టింగ్స్', subtitle:'మీ ఖాతా, భద్రత మరియు యాప్ ప్రాధాన్యతలను నిర్వహించండి.',
    account:'ఖాతా వివరాలు', profile:'ఖాతా సమాచారం', email:'ప్రస్తుత ఇమెయిల్', active:'సైన్ ఇన్ అయ్యారు',
    changeEmail:'ఇమెయిల్ మార్చండి', emailHint:'నిర్ధారణ లింక్ అవసరం కావచ్చు. మీ ఇన్‌బాక్స్‌ను తనిఖీ చేయండి.',
    newEmail:'కొత్త ఇమెయిల్ చిరునామా', saveEmail:'ఇమెయిల్ అప్‌డేట్ చేయండి',
    changePassword:'పాస్‌వర్డ్ మార్చండి', newPassword:'కొత్త పాస్‌వర్డ్ (కనీసం 8 అక్షరాలు)',
    confirmPassword:'పాస్‌వర్డ్ నిర్ధారించండి', savePassword:'పాస్‌వర్డ్ అప్‌డేట్ చేయండి',
    preferences:'యాప్ ప్రాధాన్యతలు', interface:'ఇంటర్‌ఫేస్ భాష', defaultScript:'పాటల భాష ప్రివ్యూ',
    translit:'లిప్యంతరీకరణ ప్రివ్యూ', font:'సాహిత్య అక్షర పరిమాణం', preview:'లైవ్ ప్రివ్యూ',
    previewNote:'ఈ ప్రాధాన్యతలు ప్రస్తుతం ఈ స్క్రీన్ ప్రివ్యూకే వర్తిస్తాయి.',
    updates:'యాప్ అప్‌డేట్‌లు', installed:'ప్రస్తుత వెర్షన్', check:'అప్‌డేట్ కోసం తనిఖీ చేయండి', download:'అప్‌డేట్ డౌన్‌లోడ్',
    security:'ఖాతా భద్రత', secureHint:'ఖాతా మార్పులకు Supabase ధృవీకరణ వర్తిస్తుంది.',
    signOut:'లాగౌట్ చేయండి', confirmOut:'మీ ఖాతా నుండి లాగౌట్ అవ్వాలనుకుంటున్నారా?', cancel:'రద్దు', confirm:'లాగౌట్',
    emailInvalid:'సరైన కొత్త ఇమెయిల్ చిరునామా ఇవ్వండి.', emailSame:'కొత్త ఇమెయిల్ ఇప్పటి ఇమెయిల్‌తో సమానంగా ఉంది.',
    emailSent:'ఇమెయిల్ మార్పు అభ్యర్థన పంపబడింది. నిర్ధారణ కోసం ఇన్‌బాక్స్ చూడండి.',
    passwordShort:'పాస్‌వర్డ్ కనీసం 8 అక్షరాలు ఉండాలి.', passwordMismatch:'రెండు పాస్‌వర్డ్‌లు ఒకేలా ఉండాలి.',
    passwordSaved:'పాస్‌వర్డ్ మార్చబడింది.', noSession:'దయచేసి మళ్లీ సైన్ ఇన్ చేయండి.',
    updateFail:'అప్‌డేట్ తనిఖీ చేయలేకపోయాము.', upToDate:'మీ యాప్ తాజా వెర్షన్‌లో ఉంది.',
    newer:'కొత్త వెర్షన్ అందుబాటులో ఉంది: ', failed:'ఏదో సమస్య వచ్చింది. మళ్లీ ప్రయత్నించండి.',
  },
  en: {
    back:'Back', title:'Settings', subtitle:'Manage your account, security and app preferences.',
    account:'Account information', profile:'Account details', email:'Current email', active:'Signed in',
    changeEmail:'Change email', emailHint:'Confirmation may be required. Check your inbox.',
    newEmail:'New email address', saveEmail:'Update email',
    changePassword:'Change password', newPassword:'New password (8 characters minimum)',
    confirmPassword:'Confirm password', savePassword:'Update password',
    preferences:'App preferences', interface:'Interface language', defaultScript:'Song language preview',
    translit:'Transliteration preview', font:'Lyrics font size', preview:'Live preview',
    previewNote:'These preferences currently affect this screen preview only.',
    updates:'App updates', installed:'Installed version', check:'Check for updates', download:'Download update',
    security:'Account security', secureHint:'Supabase verification applies to account changes.',
    signOut:'Sign out', confirmOut:'Are you sure you want to sign out?', cancel:'Cancel', confirm:'Sign out',
    emailInvalid:'Enter a valid new email address.', emailSame:'New email matches your current email.',
    emailSent:'Email change requested. Check your inbox to confirm.',
    passwordShort:'Password must be at least 8 characters.', passwordMismatch:'Passwords do not match.',
    passwordSaved:'Password updated.', noSession:'Please sign in again.',
    updateFail:'Could not check for updates.', upToDate:'Your app is up to date.',
    newer:'New version available: ', failed:'Something went wrong. Please try again.',
  },
};
const validVersion = /^\d+\.\d+\.\d+$/;
function newerThan(remote:string, local:string):boolean {
  if (!validVersion.test(remote) || !validVersion.test(local)) return false;
  const a = remote.split('.').map(Number), b = local.split('.').map(Number);
  for (let i=0;i<3;i++) if (a[i] !== b[i]) return a[i] > b[i];
  return false;
}

export default function SettingsScreen({ onBack }:Props) {
  const [language,setLanguage] = useState<Language>('te');
  const t = tr[language];
  const [email,setEmail] = useState('');
  const [newEmail,setNewEmail] = useState('');
  const [password,setPassword] = useState('');
  const [confirmPassword,setConfirmPassword] = useState('');
  const [showPassword,setShowPassword] = useState(false);
  const [loading,setLoading] = useState(true);
  const [savingEmail,setSavingEmail] = useState(false);
  const [savingPassword,setSavingPassword] = useState(false);
  const [message,setMessage] = useState('');
  const [error,setError] = useState('');
  const [checkingUpdate,setCheckingUpdate] = useState(false);
  const [updateMessage,setUpdateMessage] = useState('');
  const [updateAvailable,setUpdateAvailable] = useState(false);
  const [confirmLogout,setConfirmLogout] = useState(false);
  const [signingOut,setSigningOut] = useState(false);
  const [songLanguage,setSongLanguage] = useState<Language>('te');
  const [transliteration,setTransliteration] = useState(true);
  const [fontSize,setFontSize] = useState(20);
  const busy = savingEmail || savingPassword || signingOut;

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({data,error:authError}) => {
      if (!mounted) return;
      if (authError || !data.user) setError(tr.te.noSession);
      else setEmail(data.user.email ?? '');
    }).catch(e => { if (mounted) setError(e instanceof Error ? e.message : tr.en.failed); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => {mounted = false;};
  }, []);

  async function updateEmail() {
    if (busy) return;
    setMessage(''); setError('');
    const next = newEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next)) {setError(t.emailInvalid);return;}
    if (next.toLowerCase() === email.toLowerCase()) {setError(t.emailSame);return;}
    setSavingEmail(true);
    try {
      const {error:changeError} = await supabase.auth.updateUser({email:next});
      if (changeError) throw changeError;
      setNewEmail(''); setMessage(t.emailSent);
    } catch (e) {setError(e instanceof Error ? e.message : t.failed);}
    finally {setSavingEmail(false);}
  }
  async function updatePassword() {
    if (busy) return;
    setMessage('');setError('');
    if (password.length < 8) {setError(t.passwordShort);return;}
    if (password !== confirmPassword) {setError(t.passwordMismatch);return;}
    setSavingPassword(true);
    try {
      const {error:changeError} = await supabase.auth.updateUser({password});
      if (changeError) throw changeError;
      setPassword('');setConfirmPassword('');setMessage(t.passwordSaved);
    } catch(e) {setError(e instanceof Error ? e.message : t.failed);}
    finally {setSavingPassword(false);}
  }
  async function checkUpdates() {
    if (checkingUpdate) return;
    setCheckingUpdate(true);setUpdateAvailable(false);setUpdateMessage('');
    try {
      const response = await fetch(LATEST_URL);
      if (!response.ok) throw new Error('Version endpoint unavailable');
      const versionData:{version?:unknown} = await response.json();
      if (typeof versionData.version !== 'string' || !validVersion.test(versionData.version)) throw new Error('Invalid manifest');
      const available = newerThan(versionData.version,INSTALLED_VERSION);
      setUpdateAvailable(available);
      setUpdateMessage(available ? t.newer+versionData.version : t.upToDate);
    } catch {setUpdateMessage(t.updateFail);}
    finally {setCheckingUpdate(false);}
  }
  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);setError('');
    try {
      const {error:signOutError} = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      setConfirmLogout(false);onBack();
    } catch(e) {setError(e instanceof Error?e.message:t.failed);setConfirmLogout(false);}
    finally {setSigningOut(false);}
  }
  const header = (title:string, symbol:string, subtitle?:string) => (
    <View style={s.cardHeading}>
      <View style={s.symbolBox}><Text style={s.symbol}>{symbol}</Text></View>
      <View style={{flex:1}}><Text style={s.cardTitle}>{title}</Text>{subtitle?<Text style={s.cardSubtitle}>{subtitle}</Text>:null}</View>
    </View>
  );
  const action = (title:string,onPress:()=>void,disabled=false,alt=false) => (
    <TouchableOpacity accessibilityRole="button" onPress={onPress} disabled={disabled}
      style={[s.action,alt && s.actionAlt,disabled && {opacity:0.55}]}>
      {disabled?<ActivityIndicator color={C.gold}/>:<Text style={s.actionText}>{title}</Text>}
    </TouchableOpacity>
  );
  const choice = (title:string,selected:boolean,onPress:()=>void) => (
    <TouchableOpacity accessibilityRole="button" accessibilityState={{selected}} onPress={onPress}
      style={[s.choice, selected && s.choiceSelected]}><Text style={[s.choiceText,selected && s.choiceTextSelected]}>{title}</Text></TouchableOpacity>
  );
  if (loading) return <View style={s.loading}><ActivityIndicator color={C.gold} size="large"/><Text style={s.muted}>{language==='te'?'లోడ్ అవుతోంది...':'Loading...'}</Text></View>;

  return (
    <View style={s.root}>
      <View style={s.topBar}>
        <TouchableOpacity accessibilityRole="button" onPress={onBack} style={{padding:4}}><Text style={s.back}>‹ {t.back}</Text></TouchableOpacity>
        <View style={s.brandRow}><Image source={require('../../assets/worshipverse-logo.png')} style={s.logo}/>
          <View><Text style={s.brand}>WorshipVerse</Text><Text style={s.church}>SHARON A.G. CHURCH</Text></View></View>
        <View style={s.switch}>{choice('తెలుగు',language==='te',()=>setLanguage('te'))}{choice('ENG',language==='en',()=>setLanguage('en'))}</View>
      </View>
      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
          <View style={s.intro}><Text style={s.headline}>{t.title}</Text><Text style={s.body}>{t.subtitle}</Text>
            <Text style={s.introTag}>✦ SHARON A.G. CHURCH</Text></View>
          {error?<View style={s.error}><Text style={s.errorText}>{error}</Text></View>:null}
          {message?<View style={s.notice}><Text style={s.noticeText}>{message}</Text></View>:null}

          <View style={s.card}>{header(t.account,'♙',t.profile)}
            <View style={s.valueRow}><Text style={s.caption}>{t.email}</Text><Text selectable style={s.value}>{email || '—'}</Text></View>
            <View style={s.valueRow}><Text style={s.caption}>{language==='te'?'సెషన్ స్థితి':'Session status'}</Text><Text style={s.gold}>{email?t.active:t.noSession}</Text></View>
          </View>

          <View style={s.card}>{header(t.changeEmail,'@','Supabase Auth')}
            <Text style={s.label}>{t.newEmail}</Text>
            <TextInput style={s.input} value={newEmail} onChangeText={setNewEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
              placeholder="name@example.com" placeholderTextColor="#A18C8C" accessibilityLabel={t.newEmail}/>
            <Text style={s.help}>{t.emailHint}</Text>
            {action(t.saveEmail,()=>{void updateEmail();},busy||!email)}
          </View>

          <View style={s.card}>{header(t.changePassword,'♢','Account security')}
            <Text style={s.label}>{t.newPassword}</Text>
            <View style={s.passwordRow}><TextInput style={[s.input,{flex:1,marginBottom:0}]} value={password} onChangeText={setPassword}
              secureTextEntry={!showPassword} autoCapitalize="none" autoComplete="new-password" placeholder={t.newPassword} placeholderTextColor="#A18C8C"/>
              <TouchableOpacity onPress={()=>setShowPassword(!showPassword)} accessibilityRole="button" accessibilityLabel={showPassword?'Hide password':'Show password'} style={s.eye}><Text style={s.gold}>{showPassword?'Hide':'Show'}</Text></TouchableOpacity></View>
            <Text style={s.label}>{t.confirmPassword}</Text>
            <TextInput style={s.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword}
              autoCapitalize="none" placeholder={t.confirmPassword} placeholderTextColor="#A18C8C"/>
            <Text style={s.help}>{password.length} / 8+ {language==='te'?'అక్షరాలు':'characters minimum'}</Text>
            {action(t.savePassword,()=>{void updatePassword();},busy||!email,true)}
          </View>

          <View style={s.card}>{header(t.preferences,'⚙','Reading & display')}
            <Text style={s.label}>{t.interface}</Text>
            <View style={s.options}>{choice('తెలుగు',language==='te',()=>setLanguage('te'))}{choice('English',language==='en',()=>setLanguage('en'))}</View>
            <Text style={s.label}>{t.defaultScript}</Text>
            <View style={s.options}>{choice('తెలుగు',songLanguage==='te',()=>setSongLanguage('te'))}{choice('English',songLanguage==='en',()=>setSongLanguage('en'))}</View>
            <Text style={s.label}>{t.translit}</Text>
            <View style={s.options}>{choice('ON',transliteration,()=>setTransliteration(true))}{choice('OFF',!transliteration,()=>setTransliteration(false))}</View>
            <Text style={s.label}>{t.font}</Text>
            <View style={s.options}>{choice('A−',fontSize===16,()=>setFontSize(16))}{choice('A',fontSize===20,()=>setFontSize(20))}{choice('A+',fontSize===24,()=>setFontSize(24))}</View>
            <View style={s.preview}><Text style={s.caption}>{t.preview}</Text>
              <Text style={[s.previewLyrics,{fontSize,lineHeight:fontSize*1.6}]}>{songLanguage==='te'?'ప్రభువును స్తుతించుడి':'Praise the Lord'}</Text>
              {transliteration&&songLanguage==='te'?<Text style={s.translit}>Prabhuvunu Sthuthinchudi</Text>:null}</View>
            <Text style={s.help}>{t.previewNote}</Text>
          </View>

          <View style={s.card}>{header(t.updates,'↻','WorshipVerse')}
            <View style={s.valueRow}><Text style={s.caption}>{t.installed}</Text><Text style={s.gold}>{INSTALLED_VERSION}</Text></View>
            {action(t.check,()=>{void checkUpdates();},checkingUpdate,true)}
            {updateMessage?<Text style={s.help}>{updateMessage}</Text>:null}
            {updateAvailable?action(t.download,()=>{void Linking.openURL(DOWNLOAD_URL).catch(()=>setError(t.updateFail));}):null}
          </View>

          <View style={s.card}>{header(t.security,'♧','Supabase')}
            <Text style={s.body}>{t.secureHint}</Text>
            {action(t.signOut,()=>setConfirmLogout(true),busy,true)}
          </View>
          <View style={s.footer}><Text style={s.brand}>WorshipVerse</Text><Text style={s.help}>Every Song, A Prayer. Every Verse, A Praise.</Text><Text style={s.church}>SHARON A.G. CHURCH</Text></View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal transparent animationType="fade" visible={confirmLogout} onRequestClose={()=>setConfirmLogout(false)}>
        <View style={s.modalScrim}><View style={s.modalCard}>{header(t.signOut,'!')}
          <Text style={s.body}>{t.confirmOut}</Text>
          <View style={s.modalActions}><TouchableOpacity disabled={signingOut} onPress={()=>setConfirmLogout(false)} style={s.modalCancel}><Text style={s.cream}>{t.cancel}</Text></TouchableOpacity>
            <TouchableOpacity disabled={signingOut} onPress={()=>{void signOut();}} style={s.modalConfirm}>
              {signingOut?<ActivityIndicator color={C.gold}/>:<Text style={s.gold}>{t.confirm}</Text>}
            </TouchableOpacity></View>
        </View></View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
 root:{flex:1,backgroundColor:C.bg}, loading:{flex:1,backgroundColor:C.bg,alignItems:'center',justifyContent:'center',gap:12},
 topBar:{backgroundColor:C.deep,minHeight:68,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:9,paddingVertical:9,gap:7},
 back:{color:C.gold,fontSize:11,fontWeight:'700'},brandRow:{flexDirection:'row',alignItems:'center',gap:5,flexShrink:1},logo:{width:26,height:26,borderRadius:7},
 brand:{color:C.gold,fontSize:15,fontWeight:'700',fontFamily:Platform.OS==='ios'?'Georgia':'serif'},church:{color:C.gold,fontSize:8,letterSpacing:0.5,marginTop:2},
 switch:{backgroundColor:C.high,borderRadius:22,flexDirection:'row',padding:2},
 choice:{paddingVertical:7,paddingHorizontal:9,borderRadius:15,alignItems:'center',justifyContent:'center',minWidth:47},choiceSelected:{backgroundColor:C.wine},
 choiceText:{color:C.muted,fontSize:11,fontWeight:'600'},choiceTextSelected:{color:C.gold,fontWeight:'800'},
 content:{paddingHorizontal:15,paddingTop:12,paddingBottom:35,gap:13},
 intro:{backgroundColor:C.high,borderRadius:16,padding:19,borderWidth:1,borderColor:'#F0BF5C20'},
 headline:{color:C.cream,fontSize:31,fontWeight:'700',fontFamily:Platform.OS==='ios'?'Georgia':'serif'},
 body:{color:C.muted,fontSize:12,lineHeight:20},introTag:{color:C.gold,fontWeight:'700',fontSize:9,letterSpacing:1.2,marginTop:12},
 card:{backgroundColor:C.card,borderRadius:15,padding:15,gap:10,borderWidth:1,borderColor:'#54434355'},
 cardHeading:{flexDirection:'row',alignItems:'center',gap:10,marginBottom:3},symbolBox:{height:36,width:36,borderRadius:11,backgroundColor:C.wine,justifyContent:'center',alignItems:'center'},
 symbol:{fontSize:20,color:C.gold,fontWeight:'700'},cardTitle:{fontFamily:Platform.OS==='ios'?'Georgia':'serif',color:C.cream,fontSize:19,fontWeight:'700'},cardSubtitle:{fontSize:10,color:C.muted,marginTop:3},
 valueRow:{backgroundColor:C.low,padding:11,borderRadius:9,gap:5},caption:{fontSize:10,color:C.muted},value:{color:C.cream,fontSize:12},gold:{color:C.gold,fontSize:12,fontWeight:'700'},
 cream:{color:C.cream,fontSize:12,fontWeight:'700'},label:{color:C.cream,fontSize:12,fontWeight:'600',marginTop:7},
 input:{backgroundColor:C.raised,borderRadius:9,minHeight:44,paddingVertical:10,paddingHorizontal:12,color:C.cream,fontSize:13,marginBottom:2},
 help:{fontSize:11,color:C.muted,lineHeight:18},action:{backgroundColor:C.wine,borderRadius:9,paddingVertical:13,paddingHorizontal:12,alignItems:'center',justifyContent:'center',marginTop:6,minHeight:45},actionAlt:{backgroundColor:C.high},
 actionText:{fontSize:12,color:C.gold,fontWeight:'800',textAlign:'center'},
 options:{flexDirection:'row',backgroundColor:C.high,borderRadius:13,alignSelf:'flex-start',padding:3,marginTop:2},
 passwordRow:{flexDirection:'row',backgroundColor:C.raised,borderRadius:9,alignItems:'center'},eye:{paddingHorizontal:12},
 preview:{backgroundColor:C.deep,borderRadius:10,padding:13,marginTop:8,gap:5},previewLyrics:{color:C.gold,fontWeight:'600'},translit:{fontSize:13,color:C.muted,fontStyle:'italic'},
 error:{backgroundColor:'#4A0E17',borderRadius:10,padding:13},errorText:{color:C.rose,fontSize:12},
 notice:{backgroundColor:C.high,borderRadius:10,padding:13},noticeText:{color:C.gold,fontSize:12},
 muted:{color:C.muted},footer:{alignItems:'center',gap:5,marginTop:10},
 modalScrim:{flex:1,backgroundColor:'#000000B8',padding:24,justifyContent:'center'},modalCard:{backgroundColor:C.card,borderRadius:16,padding:19,gap:15,borderColor:'#F0BF5C33',borderWidth:1},
 modalActions:{flexDirection:'row',gap:10},modalCancel:{flex:1,alignItems:'center',backgroundColor:C.high,padding:12,borderRadius:9},
 modalConfirm:{flex:1,alignItems:'center',backgroundColor:C.wine,padding:12,borderRadius:9},
});
