import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '../lib/supabase';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { getSearchCandidates, scoreSearchSong } from '../lib/songSearch';
import SongDetailsScreen from './SongDetailsScreen';
import PlaylistsScreen from './PlaylistsScreen';
import { ImageBackground } from 'react-native';

type Language = 'te' | 'en';
type SongFilter = 'all' | Language;

type Song = {
  id: string;
  title: string;
  artist: string | null;
  language: string;
  lyrics: string;
  lyrics_transliteration?: string | null;
  youtube_url: string | null;
};

type FavouriteRow = {
  song_id: string;
  songs: Song | Song[] | null;
};

type FavouritesScreenProps = {
  onBack: () => void;
  onBrowseSongs: () => void;
};

const COLORS = {
  deep: '#1E0E19', purple: '#4A0E17', gold: '#F0BF5C',
  cream: '#1E0E19', white: '#F7DBEA', ink: '#F7DBEA',
  muted: '#D9C1C1', border: '#544343', lilac: '#362530',
  card: '#2B1A25', high: '#422F3B', lowest: '#180913',
};

export default function FavouritesScreen({
  onBack,
  onBrowseSongs,
}: FavouritesScreenProps) {
  const [interfaceLanguage, setInterfaceLanguage] = useState<Language>('te');
  const [filter, setFilter] = useState<SongFilter>('all');
  const [search, setSearch] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [expandedSongId, setExpandedSongId] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<Song | null>(null);
  const [section, setSection] = useState<'favourites' | 'offline' | 'setlists'>('favourites');
  const [offlineSongs, setOfflineSongs] = useState<Song[]>([]);
  const [offlineLoading, setOfflineLoading] = useState(true);
  const [playlists, setPlaylists] = useState<{id: string; name: string}[]>([]);
  const [playlistsError, setPlaylistsError] = useState('');
  const [showPlaylistScreen, setShowPlaylistScreen] = useState(false);
  const [removingSongId, setRemovingSongId] = useState<string | null>(null);

  const isTe = interfaceLanguage === 'te';
  const [lastUpdated, setLastUpdated] = useState('');

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results?.[0]?.transcript;
    if (transcript) setSearch(transcript);
  });
  useSpeechRecognitionEvent('end', () => setIsListening(false));
  useSpeechRecognitionEvent('error', (event) => {
    console.warn('Favourites voice search:', event);
    setIsListening(false);
  });

  async function startVoiceSearch() {
    try {
      Keyboard.dismiss();
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        setError(isTe
          ? 'వాయిస్ సెర్చ్ కోసం మైక్రోఫోన్ అనుమతి ఇవ్వండి.'
          : 'Allow microphone access to search by voice.');
        return;
      }
      setError('');
      setIsListening(true);
      await ExpoSpeechRecognitionModule.start({
        lang: isTe ? 'te-IN' : 'en-IN',
        interimResults: false,
        continuous: false,
      });
    } catch (cause) {
      console.warn('Voice search unavailable:', cause);
      setIsListening(false);
      setError(isTe
        ? 'వాయిస్ సెర్చ్ అందుబాటులో లేదు. టైప్ చేసి వెతకండి.'
        : 'Voice search is unavailable here. Try typing instead.');
    }
  }

  async function stopVoiceSearch() {
    try {
      await ExpoSpeechRecognitionModule.stop();
    } catch (cause) {
      console.warn('Voice search stop failed:', cause);
    } finally {
      setIsListening(false);
    }
  }


  useEffect(() => {
    let active = true;

    async function loadFavourites() {
      setLoading(true);
      setError('');

      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError) throw authError;
        if (!authData.user) {
          throw new Error('Please sign in to view your favourites.');
        }

        const { data, error: queryError } = await supabase
          .from('favourites')
          .select(`
            song_id,
            songs (
              id,
              title,
              artist,
              language,
              lyrics,
              lyrics_transliteration,
              youtube_url
            )
          `)
          .eq('user_id', authData.user.id)
          .order('created_at', { ascending: false });

        if (queryError) throw queryError;
        if (!active) return;

        const rows = (data ?? []) as unknown as FavouriteRow[];
        const savedSongs = rows.flatMap((row) => {
          if (!row.songs) return [];
          return Array.isArray(row.songs) ? row.songs : [row.songs];
        });

        setSongs(savedSongs);
      } catch (cause) {
        if (!active) return;
        setError(
          cause instanceof Error
            ? cause.message
            : 'Could not load your saved songs.'
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadFavourites();
    return () => {
      active = false;
    };
  }, [reloadCount]);

  useEffect(() => {
    let active = true;
    async function loadAuxiliaryData() {
      setOfflineLoading(true);
      try {
        const [{ getOfflineSongs }, auth] = await Promise.all([
          import('../lib/offlineSongs'), supabase.auth.getUser(),
        ]);
        const [telugu, english] = await Promise.all([
          getOfflineSongs('te'), getOfflineSongs('en'),
        ]);
        if (!active) return;
        const unique = new Map<string, Song>();
        [...(telugu as Song[]), ...(english as Song[])].forEach(s => unique.set(s.id, s));
        setOfflineSongs(Array.from(unique.values()));
        setLastUpdated(new Date().toLocaleTimeString());
        if (auth.data.user) {
          const { data, error } = await supabase.from('playlists')
            .select('id,name').eq('user_id', auth.data.user.id)
            .order('created_at', { ascending: false });
          if (error) throw error;
          if (active) setPlaylists((data ?? []) as {id:string;name:string}[]);
        }
      } catch (e) {
        console.warn('Favourites auxiliary data unavailable:', e);
        if (active) setPlaylistsError(e instanceof Error ? e.message : 'Unable to load offline or playlist data.');
      } finally { if (active) setOfflineLoading(false); }
    }
    void loadAuxiliaryData();
    return () => { active = false; };
  }, [reloadCount]);

  const filteredSongs = useMemo(() => {
    const candidates = getSearchCandidates(search);
    const sourceSongs = section === 'offline' ? offlineSongs : songs;
    const eligible = sourceSongs.filter((song) => filter === 'all' || song.language === filter);
    if (!candidates.length) return eligible;
    return eligible
      .map((song) => ({song, score: scoreSearchSong(song, candidates)}))
      .filter(({score}) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({song}) => song);
  }, [filter, search, songs, offlineSongs, section]);

  async function confirmRemove() {
    if (!pendingRemove || removingSongId) return;
    const songId = pendingRemove.id;
    setRemovingSongId(songId);
    setError('');

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) throw new Error('Please sign in again.');

      const { error: removeError } = await supabase
        .from('favourites')
        .delete()
        .eq('user_id', authData.user.id)
        .eq('song_id', songId);

      if (removeError) throw removeError;
      setSongs((current) => current.filter((song) => song.id !== songId));
      if (expandedSongId === songId) setExpandedSongId(null);
      setPendingRemove(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not remove this favourite.'
      );
      setPendingRemove(null);
    } finally {
      setRemovingSongId(null);
    }
  }

  async function openYouTube(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      setError('Could not open the YouTube link.');
    }
  }

  if (showPlaylistScreen) return <PlaylistsScreen onBack={() => setShowPlaylistScreen(false)} />;

  if (selectedSong) return (
    <SongDetailsScreen song={selectedSong} onBack={() => setSelectedSong(null)}
      onFavouriteChange={isFavourite => {
        if (!isFavourite) setSongs(current => current.filter(item => item.id !== selectedSong.id));
      }} />
  );

  const showingOffline = section === 'offline';
  const currentTotal = showingOffline ? offlineSongs.length : songs.length;
  const label = (te: string, en: string) => isTe ? te : en;

  return (
    <View style={styles.screen}>
      <View style={styles.navbar}>
        <TouchableOpacity accessibilityRole="button" onPress={onBack} style={styles.brand}>
          <Image source={require('../../assets/worshipverse-logo.png')} style={styles.logo} resizeMode="contain" />
          <View style={styles.brandCopy}>
            <Text style={styles.brandName}>WorshipVerse</Text>
            <Text style={styles.brandChurch}>SHARON A.G. CHURCH</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.languageSwitch}>
          <TouchableOpacity onPress={() => setInterfaceLanguage('te')} style={[styles.langTab, isTe && styles.langActive]}>
            <Text style={[styles.langText, isTe && styles.langTextActive]}>తెలుగు</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setInterfaceLanguage('en')} style={[styles.langTab, !isTe && styles.langActive]}>
            <Text style={[styles.langText, !isTe && styles.langTextActive]}>ENG</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.segmented}>
          {([
            ['favourites', '♥', label('ఇష్టమైనవి','Favourites'), songs.length],
            ['offline', '↓', label('ఆఫ్‌లైన్','Offline'), offlineSongs.length],
            ['setlists', '♫', label('సెట్‌లిస్ట్‌లు','Setlists'), playlists.length],
          ] as const).map(([value, symbol, title, count]) => (
            <TouchableOpacity key={value} accessibilityRole="tab" accessibilityState={{selected: section === value}}
              onPress={() => {setSection(value);setSearch('');setFilter('all');}}
              style={[styles.segment, section === value && styles.segmentSelected]}>
              <Text style={[styles.segmentText, section === value && styles.segmentTextSelected]} numberOfLines={1}>{symbol} {title} ({count})</Text>
            </TouchableOpacity>
          ))}
        </View>

        {section !== 'setlists' ? <>
          <View style={styles.searchBar}>
            <Text style={styles.searchGlyph}>⌕</Text>
            <TextInput style={styles.searchInput} value={search} onChangeText={setSearch}
              placeholder={label('ఇష్టమైన పాటల్లో వెతకండి...', 'Search saved songs...')}
              placeholderTextColor="#A18C8C" accessibilityLabel="Search songs" autoCorrect={false} />
            {search.length > 0 ? <TouchableOpacity onPress={() => setSearch('')}><Text style={styles.clearText}>×</Text></TouchableOpacity> : null}
            <TouchableOpacity style={styles.micButton} accessibilityLabel={isListening ? 'Stop voice search' : 'Start voice search'}
              onPress={() => void (isListening ? stopVoiceSearch() : startVoiceSearch())}>
              <Text style={styles.micText}>{isListening ? '■' : '🎤'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.filters}>
            {(['all','te','en'] as const).map(value => <TouchableOpacity key={value} onPress={() => setFilter(value)} style={[styles.filterChip, filter===value && styles.filterSelected]}>
              <Text style={[styles.filterText, filter===value && styles.filterTextSelected]}>{value==='all'?label('అన్నీ','All'):value==='te'?'తెలుగు':'English'}</Text>
            </TouchableOpacity>)}
          </View>
        </> : null}

        <ImageBackground source={require('../../assets/worship-instruments.png')} style={styles.banner} imageStyle={styles.bannerImage} resizeMode="cover">
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerKicker}>SHARON A.G. CHURCH DIGITAL SANCTUARY</Text>
            <Text style={styles.bannerTitle}>Every Song, A Prayer</Text>
            <Text style={styles.bannerSubtitle}>ఆరాధనా గీతాల సంపుటి</Text>
          </View>
        </ImageBackground>

        {!!error && section==='favourites' ? <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setReloadCount(v => v+1)}><Text style={styles.goldText}>{label('మళ్లీ ప్రయత్నించండి','Try again')}</Text></TouchableOpacity>
        </View> : null}

        {section === 'setlists' ? <View style={styles.listArea}>
          <View style={styles.listHeader}><Text style={styles.heading}>{label('ఆరాధనా సెట్‌లిస్ట్‌లు', 'Worship Setlists')}</Text><Text style={styles.count}> {playlists.length} </Text></View>
          {playlistsError ? <Text style={styles.hint}>{playlistsError}</Text> : null}
          {playlists.length===0 ? <Text style={styles.hint}>{label('ప్లేలిస్ట్‌లు ఇంకా లేవు. కొత్త ప్లేలిస్ట్ సృష్టించండి.','No playlists yet. Create your first setlist.')}</Text> : null}
          {playlists.map(item => <TouchableOpacity key={item.id} onPress={() => setShowPlaylistScreen(true)} style={styles.setlistCard}>
            <Text style={styles.setlistIcon}>♫</Text><View style={{flex:1}}><Text style={styles.songTitle}>{item.name}</Text><Text style={styles.subtle}>{label('ప్లేలిస్ట్ తెరవండి','Open playlist')}</Text></View><Text style={styles.goldText}>›</Text>
          </TouchableOpacity>)}
          <TouchableOpacity onPress={() => setShowPlaylistScreen(true)} style={styles.setlistButton}>
            <Text style={styles.setlistButtonText}>＋ {label('ప్లేలిస్ట్‌ను సృష్టించండి లేదా నిర్వహించండి','Create / Manage Playlists')}</Text>
          </TouchableOpacity>
        </View> : <View style={styles.listArea}>
          <View style={styles.listHeader}>
            <Text style={styles.heading}>{showingOffline ? label('ఆఫ్‌లైన్ పాటలు','Offline Songs') : label('పాటల జాబితా', 'Saved Songs')}</Text>
            <Text style={styles.count}>{filteredSongs.length} {label('చూపబడుతున్నాయి','shown')}</Text>
          </View>
          {(loading && !showingOffline) || (offlineLoading && showingOffline) ? <ActivityIndicator color={COLORS.gold} size="large" style={{marginVertical:30}} /> : null}
          {!loading && !offlineLoading && filteredSongs.length===0 && !error ? <View style={styles.emptyCard}>
            <Text style={styles.emptyHeart}>♡</Text>
            <Text style={styles.heading}>{label('పాటలు కనబడలేదు', 'No songs found')}</Text>
            <Text style={styles.hint}>{showingOffline ? label('ఇంటర్నెట్ ఉన్నప్పుడు పాటల లైబ్రరీని తెరవండి.','Visit Song Library online to cache lyrics.') : label('పాటలను ఇష్టమైనవిగా సేవ్ చేయండి.','Save songs to see them here.')}</Text>
            <TouchableOpacity style={styles.setlistButton} onPress={onBrowseSongs}><Text style={styles.setlistButtonText}>{label('పాటలు చూడండి','Browse Songs')}</Text></TouchableOpacity>
          </View> : null}
          {filteredSongs.map(song => <View key={song.id} style={styles.songCard}>
            <TouchableOpacity style={styles.songRow} onPress={() => setSelectedSong(song)} accessibilityRole="button">
              <View style={styles.songIconBox}><Text style={styles.songIcon}>♫</Text></View>
              <View style={styles.songBody}>
                <Text style={styles.songTitle} numberOfLines={2}>{song.title}</Text>
                <Text style={styles.songMeta} numberOfLines={1}>{song.artist || 'WorshipVerse'} · {song.language === 'te' ? 'తెలుగు' : 'English'}</Text>
                <Text style={styles.songStatus}>{showingOffline ? label('✓ లిరిక్స్ ఆఫ్‌లైన్‌లో ఉన్నాయి','✓ Lyrics cached offline') : (song.youtube_url ? '▶ YouTube' : label('♥ ఇష్టమైన పాట','♥ Favourite'))}</Text>
              </View>
            </TouchableOpacity>
            {!showingOffline ? <TouchableOpacity onPress={() => setPendingRemove(song)} accessibilityLabel={'Remove '+song.title+' from favourites'} style={styles.heartButton}><Text style={styles.heartText}>♥</Text></TouchableOpacity> : null}
            <TouchableOpacity style={styles.playButton} accessibilityLabel="View lyrics" onPress={() => setSelectedSong(song)}><Text style={styles.playText}>›</Text></TouchableOpacity>
          </View>)}
        </View>}
        <Text style={styles.footer}>WorshipVerse · SHARON A.G. CHURCH</Text>
      </ScrollView>
      <Modal visible={pendingRemove !== null} transparent animationType="fade" onRequestClose={() => setPendingRemove(null)}>
        <View style={styles.modalScrim}><View style={styles.modalCard}>
          <Text style={styles.modalHeading}>{label('ఇష్టమైన పాటల నుంచి తొలగించాలా?', 'Remove from favourites?')}</Text>
          <Text style={styles.modalDescription}>{pendingRemove?.title}</Text>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancel} disabled={removingSongId!==null} onPress={() => setPendingRemove(null)}><Text style={styles.modalCancelText}>{label('రద్దు','Cancel')}</Text></TouchableOpacity>
            <TouchableOpacity style={styles.modalRemove} disabled={removingSongId!==null} onPress={() => void confirmRemove()}>
              {removingSongId ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.modalRemoveText}>{label('తొలగించు','Remove')}</Text>}
            </TouchableOpacity>
          </View>
        </View></View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:COLORS.deep},
  navbar:{height:74,backgroundColor:COLORS.deep,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:15,borderBottomWidth:1,borderBottomColor:'#54434344'},
  brand:{flexDirection:'row',alignItems:'center',flex:1,minWidth:0},logo:{width:31,height:31,borderRadius:7,marginRight:8},brandCopy:{flexShrink:1},
  brandName:{fontSize:18,color:COLORS.gold,fontWeight:'700',fontFamily:Platform.OS==='ios'?'Georgia':'serif'},
  brandChurch:{color:'#FFDEA4',fontSize:8,marginTop:3,letterSpacing:0.5,fontWeight:'700'},
  languageSwitch:{flexDirection:'row',borderRadius:20,padding:3,backgroundColor:COLORS.high},langTab:{paddingVertical:7,paddingHorizontal:9,borderRadius:16},langActive:{backgroundColor:COLORS.purple},langText:{fontSize:10,color:COLORS.muted,fontWeight:'700'},langTextActive:{color:COLORS.gold},
  scroll:{flex:1},content:{paddingHorizontal:15,paddingTop:13,paddingBottom:28},
  segmented:{backgroundColor:'#362530',flexDirection:'row',padding:4,borderRadius:25,gap:3,marginBottom:14},segment:{flex:1,alignItems:'center',justifyContent:'center',paddingHorizontal:3,paddingVertical:11,borderRadius:24},segmentSelected:{backgroundColor:COLORS.purple},segmentText:{color:COLORS.muted,fontSize:10,fontWeight:'700',textAlign:'center'},segmentTextSelected:{color:COLORS.gold},
  storageCard:{backgroundColor:COLORS.card,padding:15,borderRadius:15,marginBottom:14,borderWidth:1,borderColor:'#54434355'},
  storageTop:{flexDirection:'row',alignItems:'center',gap:10},storageIcon:{height:36,width:36,borderRadius:18,backgroundColor:'#322200',alignItems:'center',justifyContent:'center'},storageIconText:{color:COLORS.gold,fontSize:22},storageCopy:{flex:1},smallGold:{fontSize:9,letterSpacing:1,color:COLORS.gold,fontWeight:'800'},storageTitle:{fontSize:16,color:COLORS.white,fontWeight:'700',marginTop:4},storageTag:{fontSize:9,color:'#FFDEA4',backgroundColor:'#322200',padding:6,borderRadius:9,overflow:'hidden'},
  progressTrack:{height:5,backgroundColor:COLORS.high,borderRadius:4,marginTop:17,overflow:'hidden'},progressFill:{height:5,backgroundColor:COLORS.gold,borderRadius:4},storageDescription:{color:COLORS.muted,fontSize:11,lineHeight:18,marginTop:10},storageBottom:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:12,gap:6},timestamp:{color:COLORS.muted,fontSize:10,flexShrink:1},updateButton:{backgroundColor:COLORS.purple,paddingHorizontal:11,paddingVertical:8,borderRadius:15},updateText:{color:COLORS.gold,fontSize:10,fontWeight:'800'},
  searchBar:{backgroundColor:COLORS.high,flexDirection:'row',alignItems:'center',minHeight:49,borderRadius:12,paddingHorizontal:10,gap:8},searchGlyph:{fontSize:23,color:COLORS.gold},searchInput:{flex:1,minWidth:0,color:COLORS.white,fontSize:13},clearText:{color:COLORS.muted,fontSize:19},micButton:{height:32,width:32,justifyContent:'center',alignItems:'center'},micText:{fontSize:16,color:COLORS.gold},
  filters:{flexDirection:'row',gap:8,marginTop:9,marginBottom:13},filterChip:{paddingVertical:6,paddingHorizontal:15,borderRadius:16,backgroundColor:COLORS.card},filterSelected:{backgroundColor:COLORS.gold},filterText:{fontSize:11,color:COLORS.muted,fontWeight:'700'},filterTextSelected:{color:'#261900'},
  banner:{height:122,borderRadius:14,overflow:'hidden',marginTop:4,marginBottom:20,backgroundColor:COLORS.card},bannerImage:{borderRadius:14,opacity:0.75},bannerOverlay:{flex:1,justifyContent:'center',padding:16,backgroundColor:'#18091378'},bannerKicker:{fontSize:9,color:COLORS.gold,letterSpacing:0.8,fontWeight:'800'},bannerTitle:{fontSize:24,color:COLORS.white,marginTop:6,fontFamily:Platform.OS==='ios'?'Georgia':'serif'},bannerSubtitle:{fontSize:12,color:COLORS.muted,marginTop:3},
  listArea:{marginTop:0},listHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:9,marginBottom:12},heading:{fontSize:19,color:COLORS.white,fontFamily:Platform.OS==='ios'?'Georgia':'serif',fontWeight:'700'},count:{color:COLORS.gold,fontWeight:'700',fontSize:10,backgroundColor:'#322200',padding:6,borderRadius:10,overflow:'hidden'},
  songCard:{backgroundColor:COLORS.card,flexDirection:'row',alignItems:'center',padding:12,marginBottom:10,borderRadius:14,gap:7},songRow:{flex:1,flexDirection:'row',alignItems:'center',gap:10,minWidth:0},songIconBox:{backgroundColor:COLORS.purple,width:43,height:43,borderRadius:11,alignItems:'center',justifyContent:'center'},songIcon:{fontSize:23,color:COLORS.gold},songBody:{flex:1,minWidth:0},songTitle:{fontSize:15,lineHeight:21,color:COLORS.white,fontWeight:'700'},songMeta:{fontSize:11,color:COLORS.muted,marginTop:4},songStatus:{fontSize:10,color:COLORS.gold,marginTop:5},heartButton:{padding:7},heartText:{fontSize:21,color:COLORS.gold},playButton:{backgroundColor:COLORS.purple,height:31,width:31,borderRadius:16,alignItems:'center',justifyContent:'center'},playText:{color:COLORS.gold,fontSize:25,lineHeight:29},
  setlistCard:{flexDirection:'row',alignItems:'center',padding:16,backgroundColor:COLORS.card,borderRadius:13,gap:12,marginBottom:10},setlistIcon:{color:COLORS.gold,fontSize:24},subtle:{fontSize:11,color:COLORS.muted,marginTop:4},goldText:{color:COLORS.gold,fontSize:14},setlistButton:{alignItems:'center',backgroundColor:COLORS.purple,borderRadius:12,paddingVertical:14,marginTop:12},setlistButtonText:{color:COLORS.gold,fontWeight:'700',fontSize:12},
  errorCard:{padding:13,backgroundColor:COLORS.card,borderRadius:10,marginBottom:12},errorText:{color:'#FFB3B6',fontSize:12},emptyCard:{alignItems:'center',padding:24,backgroundColor:COLORS.card,borderRadius:14},emptyHeart:{fontSize:33,color:COLORS.gold,marginBottom:12},hint:{color:COLORS.muted,fontSize:12,lineHeight:21,marginTop:9,textAlign:'center'},footer:{color:COLORS.muted,textAlign:'center',fontSize:10,marginTop:23},
  modalScrim:{flex:1,backgroundColor:'#000000A9',padding:22,justifyContent:'center'},modalCard:{backgroundColor:COLORS.card,borderRadius:19,padding:20},modalHeading:{color:COLORS.white,fontSize:18,fontWeight:'800'},modalDescription:{fontSize:13,color:COLORS.muted,marginTop:10},modalActions:{flexDirection:'row',gap:10,marginTop:20},modalCancel:{flex:1,alignItems:'center',padding:12,borderRadius:10,backgroundColor:COLORS.high},modalCancelText:{color:COLORS.muted,fontWeight:'800'},modalRemove:{flex:1,alignItems:'center',padding:12,borderRadius:10,backgroundColor:COLORS.purple},modalRemoveText:{color:COLORS.gold,fontWeight:'800'},
});
