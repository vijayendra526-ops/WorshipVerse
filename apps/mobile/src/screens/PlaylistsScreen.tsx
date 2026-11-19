import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { supabase } from '../lib/supabase';

type Playlist = { id: string; name: string; created_at: string };
type Song = { id: string; title: string; artist: string | null; language: string };
type PlaylistSongRow = { song_id: string; songs: Song | Song[] | null };
type Props = { onBack: () => void };
type Language = 'all' | 'te' | 'en';

const C = { purple: '#32165C', deep: '#24103F', gold: '#D8B66C', cream: '#FAF8F4', muted: '#77717F', white: '#FFFFFF', border: '#E9E1D7' };

// Lightweight Telugu phonetic matching for titles entered in Roman letters.
// Search is approximate: spelling variations cannot always be identified.
const vowelMap: Record<string, string> = { 'అ': 'a', 'ఆ': 'aa', 'ఇ': 'i', 'ఈ': 'ee', 'ఉ': 'u', 'ఊ': 'oo', 'ఋ': 'ru', 'ఎ': 'e', 'ఏ': 'e', 'ఐ': 'ai', 'ఒ': 'o', 'ఓ': 'o', 'ఔ': 'au' };
const consonantMap: Record<string, string> = { 'క': 'k', 'ఖ': 'kh', 'గ': 'g', 'ఘ': 'gh', 'ఙ': 'ng', 'చ': 'ch', 'ఛ': 'chh', 'జ': 'j', 'ఝ': 'jh', 'ఞ': 'ny', 'ట': 't', 'ఠ': 'th', 'డ': 'd', 'ఢ': 'dh', 'ణ': 'n', 'త': 't', 'థ': 'th', 'ద': 'd', 'ధ': 'dh', 'న': 'n', 'ప': 'p', 'ఫ': 'ph', 'బ': 'b', 'భ': 'bh', 'మ': 'm', 'య': 'y', 'ర': 'r', 'ల': 'l', 'వ': 'v', 'శ': 'sh', 'ష': 'sh', 'స': 's', 'హ': 'h', 'ళ': 'l', 'ఱ': 'r' };
const signMap: Record<string, string> = { 'ా': 'aa', 'ి': 'i', 'ీ': 'ee', 'ు': 'u', 'ూ': 'oo', 'ృ': 'ru', 'ె': 'e', 'ే': 'e', 'ై': 'ai', 'ొ': 'o', 'ో': 'o', 'ౌ': 'au' };
function romanizeTelugu(value: string) {
  const letters = Array.from(value.normalize('NFC'));
  let result = '';
  for (let i = 0; i < letters.length; i++) {
    const char = letters[i];
    if (consonantMap[char]) {
      const following = letters[i + 1];
      if (following === '్') { result += consonantMap[char]; i++; }
      else if (following && signMap[following]) { result += consonantMap[char] + signMap[following]; i++; }
      else { result += consonantMap[char] + 'a'; }
    } else if (vowelMap[char]) result += vowelMap[char];
    else if (char === 'ం') result += 'm';
    else if (char === 'ః') result += 'h';
    else if (char === 'ఁ') result += 'n';
    else result += char;
  }
  return result;
}
function normalized(value: string) {
  return value.normalize('NFC').toLocaleLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\u0c00-\u0c7f]/g, '');
}
function phonetic(value: string) {
  return normalized(value).replace(/aa/g, 'a').replace(/ee/g, 'i').replace(/oo/g, 'u').replace(/th/g, 't').replace(/dh/g, 'd').replace(/sh/g, 's').replace(/ch/g, 'c').replace(/ph/g, 'f').replace(/bh/g, 'b').replace(/kh/g, 'k').replace(/gh/g, 'g');
}
function matchesSong(song: Song, query: string) {
  const q = normalized(query);
  if (!q) return true;
  const haystack = `${song.title} ${song.artist ?? ''}`;
  if (normalized(haystack).includes(q)) return true;
  return phonetic(romanizeTelugu(haystack)).includes(phonetic(query));
}

export default function PlaylistsScreen({ onBack }: Props) {
  const [userId, setUserId] = useState('');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [playlistSongs, setPlaylistSongs] = useState<Song[]>([]);
  const [playlistName, setPlaylistName] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [renameVisible, setRenameVisible] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renamingPlaylist, setRenamingPlaylist] = useState<Playlist | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Playlist | null>(null);
  const [playlistQuery, setPlaylistQuery] = useState('');
  const [songQuery, setSongQuery] = useState('');
  const [language, setLanguage] = useState<Language>('all');
  const [isListening, setIsListening] = useState(false);
  const [uiLanguage, setUiLanguage] = useState<'te' | 'en'>('te');

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results?.[0]?.transcript;
    if (transcript) setSongQuery(transcript);
  });
  useSpeechRecognitionEvent('end', () => setIsListening(false));
  useSpeechRecognitionEvent('error', () => setIsListening(false));

  const t = (telugu: string, english: string) => uiLanguage === 'te' ? telugu : english;
  const filteredPlaylists = useMemo(() => playlists.filter(p => normalized(p.name).includes(normalized(playlistQuery))), [playlists, playlistQuery]);
  const filteredSongs = useMemo(() => songs.filter(song => (language === 'all' || song.language === language) && matchesSong(song, songQuery)), [songs, songQuery, language]);
  const addedIds = useMemo(() => new Set(playlistSongs.map(song => song.id)), [playlistSongs]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { setMessage(authError?.message || 'Please sign in.'); onBack(); return; }
      setUserId(user.id);
      const [playlistResult, songResult] = await Promise.all([
        supabase.from('playlists').select('id, name, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('songs').select('id, title, artist, language').order('title'),
      ]);
      if (playlistResult.error || songResult.error) throw playlistResult.error || songResult.error;
      setPlaylists((playlistResult.data ?? []) as Playlist[]);
      setSongs((songResult.data ?? []) as Song[]);
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Unable to load playlists.'); }
    finally { setLoading(false); }
  }, [onBack]);

  useEffect(() => { void loadData(); }, [loadData]);

  async function createPlaylist() {
    const name = playlistName.trim();
    if (!name || !userId || saving) return;
    setSaving(true); setMessage('');
    try {
      const { data, error } = await supabase.from('playlists').insert({ name, user_id: userId }).select('id, name, created_at').single();
      if (error) throw error;
      const newPlaylist = data as Playlist;
      setPlaylists(current => [newPlaylist, ...current]);
      setPlaylistName('');
      await openPlaylist(newPlaylist);
      setMessage(t('ప్లేలిస్ట్ సృష్టించబడింది', 'Playlist created successfully!'));
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Unable to create playlist.'); }
    finally { setSaving(false); }
  }

  async function openPlaylist(playlist: Playlist) {
    setSelectedPlaylist(playlist); setMessage(''); setLoadingSongs(true); setPlaylistSongs([]);
    try {
      const { data, error } = await supabase.from('playlist_songs')
        .select('song_id, songs (id, title, artist, language)')
        .eq('playlist_id', playlist.id).order('added_at', { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as unknown as PlaylistSongRow[];
      setPlaylistSongs(rows.flatMap(row => !row.songs ? [] : Array.isArray(row.songs) ? row.songs : [row.songs]));
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Unable to load playlist songs.'); }
    finally { setLoadingSongs(false); }
  }

  async function addSong(songId: string) {
    if (!selectedPlaylist || saving || addedIds.has(songId)) return;
    setSaving(true); setMessage('');
    try {
      const { error } = await supabase.from('playlist_songs').insert({ playlist_id: selectedPlaylist.id, song_id: songId });
      if (error) throw error;
      await openPlaylist(selectedPlaylist);
      setMessage(t('పాట జోడించబడింది', 'Song added to playlist!'));
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Unable to add song.'); }
    finally { setSaving(false); }
  }

  async function removeSong(songId: string) {
    if (!selectedPlaylist || saving) return;
    setSaving(true); setMessage('');
    try {
      const { error } = await supabase.from('playlist_songs').delete().eq('playlist_id', selectedPlaylist.id).eq('song_id', songId);
      if (error) throw error;
      setPlaylistSongs(current => current.filter(song => song.id !== songId));
      setMessage(t('పాట తొలగించబడింది', 'Song removed from playlist.'));
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Unable to remove song.'); }
    finally { setSaving(false); }
  }

  function startRename(playlist: Playlist) { setRenamingPlaylist(playlist); setRenameValue(playlist.name); setRenameVisible(true); }
  async function renamePlaylist() {
    if (!renamingPlaylist || saving) return;
    const name = renameValue.trim();
    if (!name || name === renamingPlaylist.name) { setRenameVisible(false); return; }
    setSaving(true); setMessage('');
    try {
      const { error } = await supabase.from('playlists').update({ name, updated_at: new Date().toISOString() }).eq('id', renamingPlaylist.id).eq('user_id', userId);
      if (error) throw error;
      setPlaylists(current => current.map(item => item.id === renamingPlaylist.id ? { ...item, name } : item));
      setSelectedPlaylist(current => current?.id === renamingPlaylist.id ? { ...current, name } : current);
      setRenameVisible(false); setMessage(t('పేరు మార్చబడింది', 'Playlist renamed.'));
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Unable to rename playlist.'); }
    finally { setSaving(false); }
  }

  async function deletePlaylist(playlist: Playlist) {
    if (saving) return;
    setSaving(true); setMessage('');
    try {
      const { error } = await supabase.from('playlists').delete().eq('id', playlist.id).eq('user_id', userId);
      if (error) throw error;
      setPlaylists(current => current.filter(item => item.id !== playlist.id));
      if (selectedPlaylist?.id === playlist.id) { setSelectedPlaylist(null); setPlaylistSongs([]); }
      setDeleteTarget(null); setMessage(t('ప్లేలిస్ట్ తొలగించబడింది', 'Playlist deleted.'));
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Unable to delete playlist.'); }
    finally { setSaving(false); }
  }

  async function toggleVoice() {
    if (isListening) { try { await ExpoSpeechRecognitionModule.stop(); } catch {} setIsListening(false); return; }
    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) { Alert.alert('Microphone access', 'Allow speech recognition to search by voice.'); return; }
      await ExpoSpeechRecognitionModule.start({ lang: language === 'en' ? 'en-IN' : 'te-IN', interimResults: false, continuous: false });
      setIsListening(true);
    } catch { setIsListening(false); Alert.alert('Voice search unavailable', 'Use your keyboard or an Expo development build with speech recognition enabled.'); }
  }

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color={C.purple} /><Text style={styles.muted}>Loading playlists...</Text></View>;
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} accessibilityRole="button"><Text style={styles.headerBack}>‹ {t('వెనక్కి', 'Back')}</Text></TouchableOpacity>
        <Text style={styles.headerBrand}>WorshipVerse</Text>
        <TouchableOpacity style={styles.langSwitch} onPress={() => setUiLanguage(v => v === 'te' ? 'en' : 'te')} accessibilityRole="button">
          <Text style={styles.langSwitchText}>{uiLanguage === 'te' ? 'EN' : 'తె'}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>YOUR WORSHIP COLLECTION</Text>
          <Text style={styles.heroTitle}>♫ {t('నా ప్లేలిస్ట్‌లు', 'My Playlists')}</Text>
          <Text style={styles.heroSubtitle}>{t('మీకు ఇష్టమైన ఆరాధన పాటలను ఒకచోట చేర్చుకోండి.', 'Organize your favourite worship songs in one place.')}</Text>
        </View>
        <View style={styles.createCard}>
          <Text style={styles.sectionTitle}>{t('కొత్త ప్లేలిస్ట్', 'Create a playlist')}</Text>
          <TextInput style={styles.input} value={playlistName} onChangeText={setPlaylistName} maxLength={60} placeholder={t('ప్లేలిస్ట్ పేరు', 'Enter playlist name')} placeholderTextColor="#918C99" />
          <TouchableOpacity style={[styles.primaryButton, (saving || !playlistName.trim()) && styles.disabled]} disabled={saving || !playlistName.trim()} onPress={() => void createPlaylist()}>
            <Text style={styles.primaryText}>{saving ? t('దయచేసి వేచి ఉండండి...', 'Please wait...') : t('+ ప్లేలిస్ట్ సృష్టించు', '+ Create Playlist')}</Text>
          </TouchableOpacity>
        </View>
        {!!message && <View style={styles.message}><Text style={styles.messageText}>{message}</Text></View>}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('మీ ప్లేలిస్ట్‌లు', 'Your Playlists')} ({playlists.length})</Text>
          <View style={styles.searchWrap}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput style={styles.searchInput} value={playlistQuery} onChangeText={setPlaylistQuery} placeholder={t('ప్లేలిస్ట్‌లను వెతకండి', 'Search playlists')} placeholderTextColor="#918C99" />
            {!!playlistQuery && <TouchableOpacity onPress={() => setPlaylistQuery('')}><Text style={styles.clear}>×</Text></TouchableOpacity>}
          </View>
          {!filteredPlaylists.length ? <View style={styles.empty}><Text style={styles.emptyText}>{playlists.length ? t('సరిపోయే ప్లేలిస్ట్‌లు లేవు.', 'No matching playlists.') : t('ఇంకా ప్లేలిస్ట్‌లు లేవు.', 'No playlists yet. Create your first!')}</Text></View> :
            filteredPlaylists.map(playlist => (
              <View key={playlist.id} style={[styles.playlistCard, selectedPlaylist?.id === playlist.id && styles.selected]}>
                <TouchableOpacity style={styles.playlistMain} onPress={() => void openPlaylist(playlist)}>
                  <Text style={styles.playlistName}>♫  {playlist.name}</Text>
                  <Text style={styles.meta}>{t('సృష్టించిన తేదీ', 'Created')} {new Date(playlist.created_at).toLocaleDateString()}</Text>
                  <Text style={styles.openLabel}>{t('పాటలను చూడండి', 'View songs')} ›</Text>
                </TouchableOpacity>
                <View style={styles.actionRow}>
                  <TouchableOpacity onPress={() => startRename(playlist)} disabled={saving}><Text style={styles.editText}>{t('పేరు మార్చు', 'Rename')}</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => setDeleteTarget(playlist)} disabled={saving}><Text style={styles.removeText}>{t('తొలగించు', 'Delete')}</Text></TouchableOpacity>
                </View>
              </View>
            ))}
        </View>
        <View style={styles.details}>
          {selectedPlaylist ? <>
            <Text style={styles.sectionTitle}>{selectedPlaylist.name}</Text>
            <Text style={styles.muted}>{playlistSongs.length} {t('పాటలు', 'songs in this playlist')}</Text>
            {loadingSongs ? <ActivityIndicator color={C.purple} style={{ margin: 20 }} /> : playlistSongs.length ? playlistSongs.map(song => (
              <View style={styles.songRow} key={song.id}>
                <View style={styles.songInfo}><Text style={styles.songTitle}>{song.title}</Text><Text style={styles.meta}>{song.artist || 'WorshipVerse'} · {song.language === 'te' ? 'Telugu' : 'English'}</Text></View>
                <TouchableOpacity onPress={() => void removeSong(song.id)} disabled={saving}><Text style={styles.removeText}>{t('తీసివేయి', 'Remove')}</Text></TouchableOpacity>
              </View>
            )) : <Text style={styles.muted}>{t('ఈ ప్లేలిస్ట్‌లో పాటలు లేవు. కింద పాటలను జోడించండి.', 'This playlist is empty. Add songs below.')}</Text>}
            <View style={styles.addSection}>
              <Text style={styles.sectionTitle}>{t('పాటలను జోడించు', 'Add Songs')}</Text>
              <View style={styles.searchWrap}>
                <Text style={styles.searchIcon}>⌕</Text>
                <TextInput style={styles.searchInput} value={songQuery} onChangeText={setSongQuery} placeholder={t('పాట పేరు, గాయకుడి పేరు...', 'Search songs or artists...')} placeholderTextColor="#918C99" />
                {!!songQuery && <TouchableOpacity onPress={() => setSongQuery('')}><Text style={styles.clear}>×</Text></TouchableOpacity>}
                <TouchableOpacity style={[styles.mic, isListening && styles.micActive]} onPress={() => void toggleVoice()} accessibilityLabel="Voice search"><Text style={styles.micText}>{isListening ? '■' : '🎙'}</Text></TouchableOpacity>
              </View>
              <View style={styles.filters}>
                {(['all', 'te', 'en'] as const).map(option => <TouchableOpacity key={option} style={[styles.filter, language === option && styles.filterActive]} onPress={() => setLanguage(option)}><Text style={[styles.filterText, language === option && styles.filterTextActive]}>{option === 'all' ? t('అన్నీ', 'All') : option === 'te' ? 'తెలుగు' : 'English'}</Text></TouchableOpacity>)}
              </View>
              <Text style={styles.resultCount}>{filteredSongs.length} {t('పాటలు కనుగొనబడ్డాయి', 'songs found')}</Text>
              {filteredSongs.length ? filteredSongs.map(song => <View key={song.id} style={styles.songRow}>
                <View style={styles.songInfo}><Text style={styles.songTitle}>{song.title}</Text><Text style={styles.meta}>{song.artist || (song.language === 'te' ? 'Telugu' : 'English')}</Text></View>
                <TouchableOpacity style={[styles.addButton, addedIds.has(song.id) && styles.addedButton]} onPress={() => void addSong(song.id)} disabled={saving || addedIds.has(song.id) || loadingSongs}><Text style={styles.addText}>{addedIds.has(song.id) ? t('జోడించబడింది', 'Added') : t('+ జోడించు', '+ Add')}</Text></TouchableOpacity>
              </View>) : <Text style={styles.muted}>{t('సరిపోయే పాటలు లేవు.', 'No matching songs.')}</Text>}
            </View>
          </> : <View style={styles.selectPrompt}><Text style={styles.selectIcon}>♫</Text><Text style={styles.sectionTitle}>{t('ప్లేలిస్ట్ ఎంచుకోండి', 'Select a Playlist')}</Text><Text style={styles.muted}>{t('పాటలను జోడించడానికి పై ప్లేలిస్ట్‌ను ఎంచుకోండి.', 'Choose or create a playlist to add songs.')}</Text></View>}
        </View>
        <Text style={styles.footer}>WorshipVerse · SHARON A.G. CHURCH</Text>
      </ScrollView>
      <Modal visible={renameVisible} transparent animationType="fade" onRequestClose={() => { if (!saving) setRenameVisible(false); }}>
        <View style={styles.overlay}><View style={styles.modalCard}>
          <Text style={styles.sectionTitle}>{t('పేరు మార్చు', 'Rename Playlist')}</Text>
          <TextInput style={styles.input} value={renameValue} onChangeText={setRenameValue} maxLength={60} placeholder="Playlist name" autoFocus />
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setRenameVisible(false)} disabled={saving}><Text style={styles.editText}>{t('రద్దు', 'Cancel')}</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.primaryButton, (saving || !renameValue.trim()) && styles.disabled]} onPress={() => void renamePlaylist()} disabled={saving || !renameValue.trim()}><Text style={styles.primaryText}>{t('సేవ్', 'Save')}</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>
      <Modal visible={!!deleteTarget} transparent animationType="fade" onRequestClose={() => { if (!saving) setDeleteTarget(null); }}>
        <View style={styles.overlay}><View style={styles.modalCard}>
          <Text style={styles.sectionTitle}>{t('ప్లేలిస్ట్ తొలగించాలా?', 'Delete playlist?')}</Text>
          <Text style={styles.muted}>{deleteTarget?.name}</Text>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setDeleteTarget(null)} disabled={saving}><Text style={styles.editText}>{t('రద్దు', 'Cancel')}</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.dangerButton, saving && styles.disabled]} disabled={saving} onPress={() => { if (deleteTarget) void deletePlaylist(deleteTarget); }}><Text style={styles.primaryText}>{t('తొలగించు', 'Delete')}</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.cream }, loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.cream, gap: 12 },
  header: { backgroundColor: C.deep, minHeight: 64, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, headerBack: { color: C.gold, fontWeight: '700', fontSize: 13 }, headerBrand: { color: C.white, fontSize: 18, fontWeight: '800' }, langSwitch: { borderColor: C.gold, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 15 }, langSwitchText: { color: C.gold, fontWeight: '700', fontSize: 11 },
  content: { paddingBottom: 30 }, hero: { backgroundColor: C.purple, padding: 25, paddingTop: 34, paddingBottom: 36 }, eyebrow: { color: C.gold, fontWeight: '800', fontSize: 10, letterSpacing: 1.6 }, heroTitle: { color: C.white, fontSize: 28, fontWeight: '800', marginTop: 12 }, heroSubtitle: { color: '#E4D9EE', marginTop: 9, fontSize: 13, lineHeight: 21 },
  createCard: { marginHorizontal: 16, marginTop: -15, backgroundColor: C.white, borderRadius: 16, padding: 17, borderColor: C.border, borderWidth: 1, elevation: 2 }, section: { marginHorizontal: 16, marginTop: 25 }, sectionTitle: { color: C.purple, fontSize: 18, fontWeight: '800', marginBottom: 12 }, input: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 12, color: C.deep, fontSize: 14, marginBottom: 12 }, primaryButton: { backgroundColor: C.purple, paddingHorizontal: 18, paddingVertical: 13, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, primaryText: { color: C.white, fontSize: 13, fontWeight: '800' }, disabled: { opacity: 0.5 },
  message: { marginHorizontal: 16, marginTop: 14, padding: 13, backgroundColor: '#F0EAF7', borderRadius: 10 }, messageText: { color: C.purple, fontSize: 12 }, searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderColor: '#DED5E7', borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, marginBottom: 12, minHeight: 50 }, searchIcon: { color: C.purple, fontSize: 25, marginRight: 8 }, searchInput: { flex: 1, color: C.deep, fontSize: 13, paddingVertical: 10, minWidth: 0 }, clear: { color: C.muted, fontSize: 24, paddingHorizontal: 7 }, mic: { backgroundColor: '#F1E9F7', borderRadius: 9, minWidth: 36, minHeight: 36, justifyContent: 'center', alignItems: 'center', marginLeft: 5 }, micActive: { backgroundColor: C.gold }, micText: { fontSize: 17, color: C.purple },
  empty: { backgroundColor: C.white, padding: 25, borderColor: C.gold, borderWidth: 1, borderStyle: 'dashed', borderRadius: 15 }, emptyText: { color: C.muted, textAlign: 'center', lineHeight: 21 }, playlistCard: { backgroundColor: C.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 11 }, selected: { borderColor: C.gold, borderWidth: 2 }, playlistMain: { paddingBottom: 13 }, playlistName: { color: C.purple, fontWeight: '800', fontSize: 16 }, meta: { color: C.muted, fontSize: 11, marginTop: 5 }, openLabel: { color: '#89672D', fontSize: 12, fontWeight: '700', marginTop: 9 }, actionRow: { flexDirection: 'row', gap: 22, paddingTop: 11, borderTopWidth: 1, borderTopColor: C.border }, editText: { color: C.purple, fontSize: 13, fontWeight: '700' }, removeText: { color: '#B42318', fontWeight: '700', fontSize: 12 },
  details: { backgroundColor: C.white, borderRadius: 17, marginHorizontal: 16, marginTop: 24, padding: 17, borderWidth: 1, borderColor: C.border }, muted: { color: C.muted, lineHeight: 20, fontSize: 13 }, songRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.cream, borderRadius: 11, padding: 12, marginTop: 9, gap: 12 }, songInfo: { flex: 1 }, songTitle: { color: C.purple, fontSize: 14, fontWeight: '700' }, addSection: { marginTop: 25, paddingTop: 20, borderTopWidth: 1, borderTopColor: C.border }, filters: { flexDirection: 'row', gap: 8, marginBottom: 12 }, filter: { paddingHorizontal: 17, paddingVertical: 10, backgroundColor: '#F2EDF6', borderRadius: 20 }, filterActive: { backgroundColor: C.purple }, filterText: { color: C.purple, fontSize: 12, fontWeight: '700' }, filterTextActive: { color: C.white }, resultCount: { color: C.muted, fontSize: 11, marginBottom: 4 }, addButton: { backgroundColor: C.purple, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 10 }, addedButton: { backgroundColor: '#A3A0A7' }, addText: { color: C.white, fontSize: 11, fontWeight: '800' }, selectPrompt: { alignItems: 'center', paddingVertical: 32 }, selectIcon: { color: C.gold, fontSize: 40, marginBottom: 13 },
  footer: { color: '#917645', textAlign: 'center', marginTop: 28, fontSize: 10, fontWeight: '700' }, overlay: { flex: 1, backgroundColor: 'rgba(19,8,35,.6)', justifyContent: 'center', padding: 20 }, modalCard: { backgroundColor: C.cream, padding: 20, borderRadius: 17 }, modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, alignItems: 'center', marginTop: 10 }, secondaryButton: { padding: 12 }, dangerButton: { backgroundColor: '#B42318', paddingHorizontal: 18, paddingVertical: 13, borderRadius: 11 },
});
