import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

type Song = {
  id: string;
  title: string;
  artist: string | null;
  language: string;
  lyrics: string;
  lyrics_transliteration?: string | null;
  youtube_url: string | null;
};
type Props = {
  song: Song;
  onBack: () => void;
  onFavouriteChange?: (isFavourite: boolean) => void;
};
type ScriptMode = 'original' | 'romanized' | 'dual';
type Playlist = { id: string; name: string };
const SUNDAY_NAME = 'Sunday Worship';

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}


const C = {
  bg: '#1E0E19', low: '#271721', card: '#2B1A25', high: '#362530',
  highest: '#422F3B', red: '#4A0E17', gold: '#F0BF5C',
  ink: '#F7DBEA', muted: '#D9C1C1', edge: '#544343',
};
const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });

function splitStanzas(value: string): string[] {
  return value.trim().split(/\n\s*\n/).map((v) => v.trim()).filter(Boolean);
}
function linesOf(value: string): string[] {
  return value.split(/\r?\n/).map((v) => v.trim()).filter(Boolean);
}

export default function SongDetailsScreen({ song, onBack, onFavouriteChange }: Props) {
  const isTe = song.language === 'te';
  const hasRomanized = isTe && Boolean(song.lyrics_transliteration?.trim());
  const [scriptMode, setScriptMode] = useState<ScriptMode>('original');
  const [fontSize, setFontSize] = useState(21);
  const [fullScreen, setFullScreen] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);
  const [checkingFavourite, setCheckingFavourite] = useState(true);
  const [updatingFavourite, setUpdatingFavourite] = useState(false);
  const [notice, setNotice] = useState('');
  const [videoExpanded, setVideoExpanded] = useState(false);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const scrollPosition = useRef(0);
  const scrollViewport = useRef(0);
  const scrollContentHeight = useRef(0);
  const [autoScrolling, setAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const [capo, setCapo] = useState(0);
  const lyricsStartY = useRef(0);
  const [playlistModal, setPlaylistModal] = useState(false);
  const [playlistList, setPlaylistList] = useState<Playlist[]>([]);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistBusy, setPlaylistBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  // Scroll the real lyrics page at a reading-friendly pace. Stop at the end.
  useEffect(() => {
    if (!autoScrolling || fullScreen) return;
    const interval = setInterval(() => {
      const maxOffset = Math.max(0, scrollContentHeight.current - scrollViewport.current);
      if (maxOffset <= 0 || scrollPosition.current >= maxOffset - 1) {
        setAutoScrolling(false);
        return;
      }
      const next = Math.min(maxOffset, scrollPosition.current + scrollSpeed * 1.6);
      scrollPosition.current = next;
      scrollRef.current?.scrollTo({ y: next, animated: false });
    }, 50);
    return () => clearInterval(interval);
  }, [autoScrolling, fullScreen, scrollSpeed]);


  function toggleAutoScroll() {
    if (autoScrolling) { setAutoScrolling(false); return; }
    setFullScreen(false);
    // The trigger lives BELOW the lyrics; begin reading at the first stanza.
    const start = Math.max(0, lyricsStartY.current - 10);
    scrollPosition.current = start;
    scrollRef.current?.scrollTo({ y: start, animated: false });
    setAutoScrolling(true);
  }

  async function requireUser(): Promise<string | null> {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!data.user) {
      setNotice(isTe ? 'ప్లేలిస్ట్‌లో పాటలను సేవ్ చేయడానికి లాగిన్ అవ్వండి.' : 'Sign in from Home to save songs to playlists.');
      return null;
    }
    return data.user.id;
  }

  async function fetchPlaylists(userId: string): Promise<Playlist[]> {
    const { data, error } = await supabase.from('playlists')
      .select('id, name').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Playlist[];
  }

  async function addToPlaylist(playlistId: string, playlistTitle: string) {
    const { data, error } = await supabase.from('playlist_songs')
      .select('song_id').eq('playlist_id', playlistId).eq('song_id', song.id).maybeSingle();
    if (error) throw error;
    if (data) {
      setNotice(isTe ? `ఈ పాట ఇప్పటికే ${playlistTitle} లో ఉంది.` : `Already saved in ${playlistTitle}.`);
      return;
    }
    const inserted = await supabase.from('playlist_songs')
      .insert({ playlist_id: playlistId, song_id: song.id });
    if (inserted.error) throw inserted.error;
    setNotice(isTe ? `${playlistTitle} ప్లేలిస్ట్‌కు జోడించబడింది.` : `Added to ${playlistTitle}.`);
  }

  async function addSundaySetlist() {
    if (playlistBusy) return;
    setPlaylistBusy(true);
    setNotice('');
    try {
      const uid = await requireUser();
      if (!uid) return;
      const existing = await fetchPlaylists(uid);
      let sunday = existing.find((item) => item.name.toLowerCase() === SUNDAY_NAME.toLowerCase());
      if (!sunday) {
        const created = await supabase.from('playlists')
          .insert({ user_id: uid, name: SUNDAY_NAME }).select('id, name').single();
        if (created.error) throw created.error;
        sunday = created.data as Playlist;
      }
      await addToPlaylist(sunday.id, sunday.name);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Unable to update Sunday setlist.');
    } finally { setPlaylistBusy(false); }
  }

  async function openPlaylistPicker() {
    if (playlistBusy) return;
    setPlaylistBusy(true);
    setNotice('');
    try {
      const uid = await requireUser();
      if (!uid) return;
      setPlaylistList(await fetchPlaylists(uid));
      setPlaylistModal(true);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Unable to load playlists.');
    } finally { setPlaylistBusy(false); }
  }

  async function addToSelectedPlaylist(playlist: Playlist) {
    if (playlistBusy) return;
    setPlaylistBusy(true);
    try {
      const uid = await requireUser();
      if (!uid) return;
      // Check ownership again through the authenticated user's playlist list.
      const mine = await fetchPlaylists(uid);
      if (!mine.some((p) => p.id === playlist.id)) throw new Error('Playlist not found.');
      await addToPlaylist(playlist.id, playlist.name);
      setPlaylistModal(false);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Unable to add song.');
      setPlaylistModal(false);
    } finally { setPlaylistBusy(false); }
  }

  async function createAndAddPlaylist() {
    const name = playlistName.trim();
    if (!name || playlistBusy) return;
    setPlaylistBusy(true);
    try {
      const uid = await requireUser();
      if (!uid) return;
      const existing = await fetchPlaylists(uid);
      let target = existing.find((item) => item.name.toLowerCase() === name.toLowerCase());
      if (!target) {
        const created = await supabase.from('playlists')
          .insert({ user_id: uid, name }).select('id, name').single();
        if (created.error) throw created.error;
        target = created.data as Playlist;
      }
      await addToPlaylist(target.id, target.name);
      setPlaylistName('');
      setPlaylistModal(false);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Unable to create playlist.');
      setPlaylistModal(false);
    } finally { setPlaylistBusy(false); }
  }

  async function exportLyricsPdf() {
    if (pdfBusy) return;
    setPdfBusy(true);
    setNotice('');
    try {
      const original = escapeHtml(song.lyrics || '').replace(/\r?\n/g, '<br/>');
      const roman = hasRomanized
        ? `<h2>English Script</h2><div class="lyrics">${escapeHtml(song.lyrics_transliteration || '').replace(/\r?\n/g, '<br/>')}</div>`
        : '';
      const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
        @page { margin: 18mm; } body { color:#241324; font-family: 'Noto Sans Telugu', 'Nirmala UI', sans-serif; line-height:1.9; }
        h1 { color:#4a0e17; font-size:24px; line-height:1.5; } h2 { color:#4a0e17; font-size:16px; margin-top:30px; }
        .by {color:#746474;font-size:12px;} .lyrics {font-size:16px;white-space:normal;line-height:2.0;overflow-wrap:break-word;}
        footer {margin-top:40px;border-top:1px solid #ddd;padding-top:10px;color:#777;font-size:10px;}
        </style></head><body><h1>${escapeHtml(song.title)}</h1><div class="by">${escapeHtml(song.artist || 'WorshipVerse')}</div>
        <h2>${isTe ? 'పాట సాహిత్యం' : 'Song Lyrics'}</h2><div class="lyrics">${original}</div>${roman}
        <footer>WorshipVerse · Sharon A.G. Church</footer></body></html>`;
      if (Platform.OS === 'web') {
        // Browser preview supports Save as PDF from the print dialog.
        const popup = window.open('', '_blank');
        if (!popup) throw new Error('Allow pop-ups for the Expo web preview to print lyrics.');
        popup.document.open();
        popup.document.write(html);
        popup.document.close();
        popup.focus();
        popup.print();
        setNotice('Choose Save as PDF in the browser print dialog.');
      } else {
        const file = await Print.printToFileAsync({ html });
        if (!await Sharing.isAvailableAsync()) throw new Error('File sharing is not available on this device.');
        await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: song.title + ' - WorshipVerse' });
        setNotice(isTe ? 'PDF షేర్ లేదా సేవ్ ఎంపికను ఎంచుకోండి.' : 'Choose where to save or share the PDF.');
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not export PDF.');
    } finally { setPdfBusy(false); }
  }

  const originalStanzas = useMemo(() => splitStanzas(song.lyrics || ''), [song.lyrics]);
  const romanStanzas = useMemo(() => splitStanzas(song.lyrics_transliteration || ''), [song.lyrics_transliteration]);
  const shownStanzas = scriptMode === 'romanized' && hasRomanized ? romanStanzas : originalStanzas;

  useEffect(() => {
    let mounted = true;
    setIsFavourite(false);
    setCheckingFavourite(true);
    async function check() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) return;
        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!auth.user) return;
        const { data, error } = await supabase.from('favourites')
          .select('song_id').eq('user_id', auth.user.id).eq('song_id', song.id).maybeSingle();
        if (error) throw error;
        if (mounted) setIsFavourite(Boolean(data));
      } catch (error) {
        console.warn('Unable to check favourite status:', error);
      } finally {
        if (mounted) setCheckingFavourite(false);
      }
    }
    void check();
    return () => { mounted = false; };
  }, [song.id]);

  async function toggleFavourite() {
    if (checkingFavourite || updatingFavourite) return;
    setNotice('');
    setUpdatingFavourite(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setNotice(isTe ? 'ఇష్టమైన పాటలకు జోడించడానికి లాగిన్ అవ్వండి.' : 'Sign in from Home to save favourites.');
        return;
      }
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!auth.user) {
        setNotice(isTe ? 'ముందుగా లాగిన్ అవ్వండి.' : 'Sign in from Home to save favourites.');
        return;
      }
      if (isFavourite) {
        const { error } = await supabase.from('favourites').delete()
          .eq('user_id', auth.user.id).eq('song_id', song.id);
        if (error) throw error;
        setIsFavourite(false);
        onFavouriteChange?.(false);
        setNotice(isTe ? 'ఇష్టమైన పాటల నుండి తీసివేయబడింది.' : 'Removed from favourites.');
      } else {
        const { error } = await supabase.from('favourites')
          .insert({ user_id: auth.user.id, song_id: song.id });
        if (error) throw error;
        setIsFavourite(true);
        onFavouriteChange?.(true);
        setNotice(isTe ? 'ఇష్టమైన పాటలకు జోడించబడింది.' : 'Added to favourites.');
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to update favourites.');
    } finally {
      setUpdatingFavourite(false);
    }
  }

  async function openYouTube() {
    if (!song.youtube_url) return;
    setNotice('');
    try {
      if (!/^https?:\/\//i.test(song.youtube_url)) throw new Error('Invalid video link');
      await Linking.openURL(song.youtube_url);
    } catch {
      setNotice(isTe ? 'వీడియో తెరవలేకపోయాము.' : 'Unable to open this video.');
    }
  }

  async function shareSong() {
    setNotice('');
    const lyrics = scriptMode === 'romanized' && hasRomanized
      ? song.lyrics_transliteration || '' : song.lyrics;
    const message = [song.title, song.artist ? `By ${song.artist}` : '',
      lyrics, song.youtube_url || '', 'Shared from WorshipVerse'].filter(Boolean).join('\n\n');
    try { await Share.share({ message }); }
    catch { setNotice(isTe ? 'పాటను షేర్ చేయలేకపోయాము.' : 'Unable to share this song.'); }
  }

  function adjustText(delta: number) {
    setFontSize((value) => Math.max(15, Math.min(31, value + delta)));
  }

  const scriptTabs = hasRomanized ? (
    <View style={styles.scriptTabs}>
      {([
        ['original', 'తెలుగు లిపి'],
        ['romanized', 'English Script'],
        ['dual', 'ద్విభాష (Dual)'],
      ] as const).map(([mode, text]) => (
        <TouchableOpacity key={mode} accessibilityRole="button"
          accessibilityState={{ selected: scriptMode === mode }}
          onPress={() => setScriptMode(mode)}
          style={[styles.scriptTab, scriptMode === mode && styles.scriptSelected]}>
          <Text numberOfLines={1} style={[styles.scriptLabel, scriptMode === mode && styles.scriptActiveLabel]}>{text}</Text>
        </TouchableOpacity>
      ))}
    </View>
  ) : null;

  const sizeControls = (
    <View style={styles.fontSizer}>
      <TouchableOpacity style={styles.fontPress} accessibilityRole="button"
        accessibilityLabel="Decrease lyrics text size" onPress={() => adjustText(-2)}>
        <Text style={styles.fontPressText}>A−</Text>
      </TouchableOpacity>
      <Text style={styles.sizeValue}>{fontSize}</Text>
      <TouchableOpacity style={styles.fontPress} accessibilityRole="button"
        accessibilityLabel="Increase lyrics text size" onPress={() => adjustText(2)}>
        <Text style={styles.fontPressText}>A+</Text>
      </TouchableOpacity>
    </View>
  );

  const lyricsContent = originalStanzas.length ? (
    <View style={styles.stanzaList}>
      {shownStanzas.map((stanza, index) => {
        const originalLines = linesOf(originalStanzas[index] || '');
        const romanLines = linesOf(romanStanzas[index] || '');
        const canPair = scriptMode === 'dual' && hasRomanized &&
          originalStanzas.length === romanStanzas.length && originalLines.length === romanLines.length;
        return (
          <View key={`${scriptMode}-${index}`} style={[styles.stanza, index === 0 && styles.firstStanza]}>
            <View style={styles.stanzaTop}>
              <Text style={styles.stanzaBadge}>{isTe ? `భాగం ${index + 1}` : `VERSE ${index + 1}`}</Text>
              <Text style={styles.stanzaMusic}>♫</Text>
            </View>
            {canPair ? originalLines.map((line, lineIndex) => (
              <View key={lineIndex} style={styles.pairedLine}>
                <Text selectable style={[styles.lyricLine, { fontSize, lineHeight: fontSize * 1.75 }]}>{line}</Text>
                <Text selectable style={[styles.romanLine, { fontSize: Math.max(14, fontSize - 4), lineHeight: (fontSize - 4) * 1.75 }]}>{romanLines[lineIndex]}</Text>
              </View>
            )) : (
              <>
                <Text selectable style={[styles.lyricLine, { fontSize, lineHeight: fontSize * 1.8 }]}>{stanza}</Text>
                {scriptMode === 'dual' && hasRomanized && romanStanzas[index] ? (
                  <Text selectable style={[styles.romanLine, styles.romanBlock, { fontSize: Math.max(14, fontSize - 4), lineHeight: (fontSize - 4) * 1.75 }]}>
                    {romanStanzas[index]}
                  </Text>
                ) : null}
              </>
            )}
          </View>
        );
      })}
    </View>
  ) : (
    <View style={styles.stanza}>
      <Text style={styles.emptyLyrics}>{isTe ? 'ఈ పాటకు సాహిత్యం అందుబాటులో లేదు.' : 'Lyrics are not available for this song.'}</Text>
    </View>
  );

  if (fullScreen) {
    return (
      <View style={styles.readerRoot}>
        <StatusBar hidden />
        <View style={styles.readerTop}>
          <Text style={styles.readerBrand}>WorshipVerse · {isTe ? 'సాహిత్యం' : 'LYRICS'}</Text>
          <TouchableOpacity style={styles.readerExit} onPress={() => setFullScreen(false)} accessibilityLabel="Exit full screen lyrics">
            <Text style={styles.readerExitText}>✕</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.readerTitle}>{song.title}</Text>
        {scriptTabs}
        <ScrollView style={styles.readerScroll} contentContainerStyle={styles.readerInner} showsVerticalScrollIndicator={false}>
          {lyricsContent}
        </ScrollView>
        <View style={styles.readerBottom}>{sizeControls}</View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <View style={styles.appHeader}>
        <View style={styles.brandArea}>
          <Image source={require('../../assets/worshipverse-logo.png')} style={styles.logo} resizeMode="contain" />
          <View>
            <Text style={styles.brandTitle}>WorshipVerse</Text>
            <Text style={styles.churchBadge}>SHARON A.G. CHURCH</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.currentLanguage}>{isTe ? 'తెలుగు' : 'ENG'}</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Share song" style={styles.headerIcon} onPress={() => void shareSong()}>
            <Text style={styles.headerIconText}>↗</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={32}
        onLayout={(event) => { scrollViewport.current = event.nativeEvent.layout.height; }}
        onContentSizeChange={(_width, height) => { scrollContentHeight.current = height; }}
        onScroll={(event) => { scrollPosition.current = event.nativeEvent.contentOffset.y; }}
      >
        <View style={styles.quickNavigation}>
          <TouchableOpacity onPress={onBack} style={styles.backCircle} accessibilityRole="button" accessibilityLabel="Back to song library">
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.breadcrumb}>{isTe ? 'పాటలు / సాహిత్యం' : 'SONGS / LYRICS'}</Text>
          <Text style={styles.songLanguageBadge}>{isTe ? 'తెలుగు' : 'ENGLISH'}</Text>
        </View>

        <View style={styles.songInfoCard}>
          <View style={styles.songInfoUpper}>
            <View style={styles.songMain}>
              <Text style={styles.songCategory}>{isTe ? 'ఆరాధన గీతం · PRAISE & WORSHIP' : 'PRAISE & WORSHIP'}</Text>
              <Text style={styles.songTitle}>{song.title}</Text>
              {hasRomanized ? (
                <Text style={styles.subtitle} numberOfLines={3}>{song.lyrics_transliteration?.split(/\r?\n/)[0]}</Text>
              ) : null}
              <Text style={styles.songArtist}>✦  {song.artist || 'WorshipVerse'}</Text>
            </View>
            <TouchableOpacity onPress={() => void toggleFavourite()} disabled={checkingFavourite || updatingFavourite}
              style={styles.heartButton} accessibilityRole="button" accessibilityLabel={isFavourite ? 'Remove favourite' : 'Save favourite'}>
              {checkingFavourite || updatingFavourite ? <ActivityIndicator size="small" color={C.gold} /> : (
                <Text style={styles.heartText}>{isFavourite ? '♥' : '♡'}</Text>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction} onPress={() => { setAutoScrolling(false); setFullScreen(true); }} accessibilityRole="button">
              <Text style={styles.quickIcon}>⛶</Text><Text style={styles.quickLabel}>{isTe ? 'పూర్తి స్క్రీన్' : 'Full screen'}</Text>
            </TouchableOpacity>
            <View style={styles.quickAction}>{sizeControls}</View>
            <TouchableOpacity style={styles.quickAction} onPress={() => void shareSong()} accessibilityRole="button">
              <Text style={styles.quickIcon}>↗</Text><Text style={styles.quickLabel}>{isTe ? 'షేర్' : 'Share'}</Text>
            </TouchableOpacity>
            {song.youtube_url ? (
              <TouchableOpacity style={styles.quickAction} onPress={() => setVideoExpanded((value) => !value)} accessibilityRole="button">
                <Text style={styles.videoIcon}>▶</Text><Text style={styles.quickLabel}>{isTe ? 'వీడియో' : 'Video'}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {notice ? <View style={styles.notice}><Text style={styles.noticeText}>{notice}</Text></View> : null}

        {scriptTabs}

        {song.youtube_url && videoExpanded ? (
          <TouchableOpacity onPress={() => void openYouTube()} accessibilityRole="button" style={styles.videoCard}>
            <View style={styles.videoArtwork}>
              <Image source={require('../../assets/website/worship-background.jpg')} resizeMode="cover" style={styles.videoImage} />
              <View style={styles.videoShade} />
              <View style={styles.bigPlay}><Text style={styles.bigPlayText}>▶</Text></View>
            </View>
            <View style={styles.videoDescription}>
              <View style={styles.videoLogo}><Text style={styles.videoLogoText}>AG</Text></View>
              <View style={styles.videoDetails}>
                <Text style={styles.videoTitle}>{isTe ? 'యూట్యూబ్‌లో వినండి' : 'Watch on YouTube'}</Text>
                <Text style={styles.videoSub} numberOfLines={1}>{song.title}</Text>
              </View>
              <Text style={styles.openExternal}>↗</Text>
            </View>
          </TouchableOpacity>
        ) : null}

        <View style={styles.lyricsHeading} onLayout={(event) => { lyricsStartY.current = event.nativeEvent.layout.y; }}>
          <Text style={styles.lyricsHeadingText}>{isTe ? 'పాట సాహిత్యం' : 'SONG LYRICS'}</Text>
          <Text style={styles.lyricsHint}>{isTe ? 'ఆరాధిస్తూ పాడండి' : 'Read and worship along'}</Text>
        </View>
        {lyricsContent}

        {song.youtube_url ? (
          <TouchableOpacity style={styles.youtubeFooter} onPress={() => void openYouTube()} accessibilityRole="button">
            <Text style={styles.footerActionIcon}>▶</Text>
            <Text style={styles.footerActionLabel}>{isTe ? 'యూట్యూబ్‌లో వీడియో చూడండి' : 'Watch the song on YouTube'}</Text>
            <Text style={styles.footerActionIcon}>↗</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.shareFooter} onPress={() => void shareSong()} accessibilityRole="button">
          <Text style={styles.shareFooterText}>{isTe ? 'ఈ పాటను షేర్ చేయండి' : 'Share this song'}  ↗</Text>
        </TouchableOpacity>
        {/* Worship-leader tools: working lyric auto-scroll; musical metadata and
            admin review are deliberately not claimed without backend support. */}
        <View style={styles.leaderTools}>
          <View style={styles.leaderTopRow}>
            <TouchableOpacity
              style={styles.autoScrollButton}
              accessibilityRole="button"
              accessibilityLabel={autoScrolling ? 'Pause automatic lyrics scrolling' : 'Start automatic lyrics scrolling'}
              onPress={toggleAutoScroll}
            >
              <Text style={styles.leaderPlay}>{autoScrolling ? 'Ⅱ' : '▶'}</Text>
              <View style={styles.leaderCopy}>
                <Text style={styles.leaderPrimary}>{autoScrolling ? 'Pause Scroll' : 'Auto-Scroll'}</Text>
                <Text style={styles.leaderSecondary}>Speed: {scrollSpeed}×</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Change auto scroll speed"
              style={styles.speedChip}
              onPress={() => setScrollSpeed((value) => (value >= 3 ? 1 : value + 1))}
            >
              <Text style={styles.leaderSecondary}>{scrollSpeed}×  ↻</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Add song to a playlist"
              style={styles.playlistChip}
              onPress={() => void openPlaylistPicker()}
            ><Text style={styles.playlistChipText}>＋ List</Text></TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Cycle capo reference position"
              style={styles.capoChip}
              onPress={() => setCapo((value) => (value + 1) % 13)}
            >
              <Text style={styles.capoText}>♯  Capo: {capo === 0 ? 'None' : capo + ' (ref)'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.leaderNote}>{isTe
            ? 'కాపో స్థానం గుర్తు కోసం మాత్రమే; స్వరాలు మారవు.'
            : 'Capo is a reference only; it does not transpose chords.'}</Text>
        </View>

        <View style={styles.serviceActions}>
          <TouchableOpacity style={[styles.serviceAction, styles.serviceActionMuted]}
            accessibilityRole="button" accessibilityLabel="Add song to Sunday Worship playlist"
            disabled={playlistBusy} onPress={() => void addSundaySetlist()}>
            <Text style={styles.serviceActionMutedText}>⊞  {isTe ? 'ఆదివారం ఆరాధన లిస్ట్‌కు చేర్చు' : 'Add to Sunday worship setlist'}</Text>
            <Text style={styles.serviceUnavailable}>{playlistBusy ? 'Saving...' : (isTe ? 'Sunday Worship ప్లేలిస్ట్' : 'Save to Sunday Worship playlist')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.serviceAction, styles.serviceActionMuted]}
            accessibilityRole="button" accessibilityLabel="Choose another playlist"
            disabled={playlistBusy} onPress={() => void openPlaylistPicker()}>
            <Text style={styles.serviceActionGold}>＋  {isTe ? 'ఇతర ప్లేలిస్ట్‌కు జోడించండి' : 'Add to another playlist'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.serviceAction, styles.serviceActionMuted]}
            accessibilityRole="button" accessibilityLabel="Export song lyrics as PDF"
            disabled={pdfBusy} onPress={() => void exportLyricsPdf()}>
            <Text style={styles.serviceActionGold}>▤  {isTe ? 'PDF సాహిత్యం డౌన్‌లోడ్' : 'Download lyrics as PDF'}</Text>
            <Text style={styles.serviceUnavailable}>{pdfBusy ? 'Preparing PDF...' : (Platform.OS === 'web' ? 'Print → Save as PDF' : 'Save or share PDF')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.serviceAction, styles.serviceCorrection]}
            accessibilityRole="button"
            accessibilityLabel="Share a song correction suggestion"
            onPress={() => {
              const message = `${isTe ? 'పాట సవరణ సూచన' : 'Song correction suggestion'}\n${song.title}\n\n${isTe ? 'సవరించాల్సిన పంక్తి:' : 'Line to correct:'}\n\n${isTe ? 'సరైన పంక్తి:' : 'Suggested replacement:'}`;
              void Share.share({ message }).catch(() => setNotice(isTe ? 'సూచనను షేర్ చేయలేకపోయాము.' : 'Could not share a correction draft.'));
            }}
          >
            <Text style={styles.serviceCorrectionText}>✎  {isTe ? 'సవరణను సూచించండి' : 'Suggest a correction'}</Text>
            <Text style={styles.serviceUnavailable}>{isTe ? 'షేర్ చేయడానికి నమూనా తెరుచుకుంటుంది' : 'Opens a shareable draft, not admin review'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.serviceAttribution}>
          <Text style={styles.serviceAttributionText}>© Sharon A.G. Church · WorshipVerse · Song ID: {song.id.slice(0, 8)}</Text>
          <Text style={styles.serviceAttributionText}>For personal devotional and congregational use</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>WorshipVerse</Text>
          <Text style={styles.footerMotto}>Every Song, A Prayer. Every Verse, A Praise.</Text>
          <Text style={styles.footerChurch}>SHARON A.G. CHURCH</Text>
        </View>
      </ScrollView>
      <Modal visible={playlistModal} transparent animationType="fade"
        onRequestClose={() => setPlaylistModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{isTe ? 'ప్లేలిస్ట్‌కు పాటను జోడించండి' : 'Add to Playlist'}</Text>
            <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
              {playlistList.map((playlist) => (
                <TouchableOpacity key={playlist.id} style={styles.modalItem}
                  accessibilityRole="button" disabled={playlistBusy}
                  onPress={() => void addToSelectedPlaylist(playlist)}>
                  <Text style={styles.modalItemText}>♫  {playlist.name}</Text>
                  <Text style={styles.modalItemText}>＋</Text>
                </TouchableOpacity>
              ))}
              {!playlistList.length ? <Text style={styles.modalHint}>{isTe ? 'ఇంకా ప్లేలిస్ట్‌లు లేవు.' : 'No playlists yet.'}</Text> : null}
            </ScrollView>
            <TextInput style={styles.modalInput} placeholder={isTe ? 'కొత్త ప్లేలిస్ట్ పేరు' : 'New playlist name'}
              placeholderTextColor="#D9C1C1" value={playlistName} onChangeText={setPlaylistName}
              maxLength={60} autoCapitalize="words" />
            <TouchableOpacity style={styles.modalCreate} disabled={playlistBusy || !playlistName.trim()}
              onPress={() => void createAndAddPlaylist()} accessibilityRole="button">
              <Text style={styles.modalCreateText}>{playlistBusy ? 'Saving...' : (isTe ? 'సృష్టించి పాటను జోడించు' : 'Create and add song')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPlaylistModal(false)} style={styles.modalCancel} accessibilityRole="button">
              <Text style={styles.modalItemText}>{isTe ? 'రద్దు' : 'Cancel'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 18, backgroundColor: '#000000B8' },
  modalCard: { backgroundColor: '#2B1A25', borderRadius: 18, borderWidth: 1, borderColor: '#544343', padding: 16, maxHeight: '80%' },
  modalTitle: { color: '#F0BF5C', fontSize: 17, fontWeight: '800', marginBottom: 12 },
  modalList: { maxHeight: 260 },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#54434366' },
  modalItemText: { color: '#F7DBEA', fontSize: 13, fontWeight: '600' },
  modalHint: { color: '#D9C1C1', fontSize: 12, marginVertical: 12 },
  modalInput: { color: '#F7DBEA', backgroundColor: '#422F3B', borderRadius: 10, padding: 12, fontSize: 13, marginTop: 12 },
  modalCreate: { backgroundColor: '#F0BF5C', borderRadius: 10, marginTop: 10, paddingVertical: 12, alignItems: 'center' },
  modalCreateText: { color: '#261900', fontWeight: '800', fontSize: 13 },
  modalCancel: { alignItems: 'center', padding: 12 },
  playlistChip: { backgroundColor: '#4A0E17', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 10 },
  playlistChipText: { color: '#F0BF5C', fontSize: 10, fontWeight: '800' },
  leaderTools: { marginTop: 20, backgroundColor: C.high, borderRadius: 13, padding: 10 },
  leaderTopRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  autoScrollButton: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
  leaderPlay: { color: C.gold, width: 30, height: 30, fontSize: 16, textAlign: 'center', textAlignVertical: 'center', overflow: 'hidden', backgroundColor: C.red, borderRadius: 10 },
  leaderCopy: { flex: 1, minWidth: 0 },
  leaderPrimary: { color: C.ink, fontSize: 10, fontWeight: '800' },
  leaderSecondary: { color: C.gold, fontSize: 9, fontWeight: '700', marginTop: 2 },
  speedChip: { backgroundColor: C.card, paddingVertical: 10, paddingHorizontal: 7, borderRadius: 8 },
  capoChip: { maxWidth: '28%', backgroundColor: '#180913', paddingVertical: 10, paddingHorizontal: 7, borderRadius: 8 },
  capoText: { color: C.gold, fontSize: 9, fontWeight: '700' },
  leaderNote: { color: C.muted, fontSize: 9, marginTop: 8 },
  serviceActions: { marginTop: 10, gap: 8 },
  serviceAction: { minHeight: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 10 },
  serviceActionMuted: { backgroundColor: C.red, opacity: 0.8 },
  serviceActionMutedText: { color: '#FFB3B6', fontSize: 11, fontWeight: '800', textAlign: 'center' },
  serviceActionGold: { color: C.gold, fontSize: 11, fontWeight: '800', textAlign: 'center' },
  serviceCorrection: { backgroundColor: '#180913' },
  serviceCorrectionText: { color: C.ink, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  serviceUnavailable: { color: C.muted, fontSize: 9, textAlign: 'center', marginTop: 3 },
  serviceAttribution: { alignItems: 'center', marginTop: 18, paddingHorizontal: 8 },
  serviceAttributionText: { color: '#897984', fontSize: 9, lineHeight: 15, textAlign: 'center' },
  root: { flex: 1, backgroundColor: C.bg },
  appHeader: { minHeight: 75, backgroundColor: C.bg, borderBottomWidth: 1, borderBottomColor: '#54434366', paddingHorizontal: 15, paddingTop: 9, paddingBottom: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandArea: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  logo: { width: 34, height: 34 },
  brandTitle: { color: C.gold, fontSize: 19, fontFamily: serif, fontWeight: '700' },
  churchBadge: { alignSelf: 'flex-start', marginTop: 3, color: C.gold, fontSize: 9, fontWeight: '700', letterSpacing: 0.9, backgroundColor: '#322200', borderRadius: 8, paddingVertical: 2, paddingHorizontal: 6 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  currentLanguage: { color: C.gold, backgroundColor: C.red, overflow: 'hidden', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 20, fontWeight: '700', fontSize: 12 },
  headerIcon: { backgroundColor: C.high, width: 37, height: 37, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  headerIconText: { color: C.gold, fontSize: 23 },
  page: { paddingHorizontal: 15, paddingBottom: 36, paddingTop: 12 },
  quickNavigation: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 15 },
  backCircle: { backgroundColor: C.high, width: 39, height: 39, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  backArrow: { color: C.ink, fontSize: 30, lineHeight: 34 },
  breadcrumb: { flex: 1, fontSize: 11, color: C.muted, fontWeight: '700' },
  songLanguageBadge: { color: C.gold, backgroundColor: '#F0BF5C22', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 22, fontSize: 10, fontWeight: '800' },
  songInfoCard: { backgroundColor: C.low, borderRadius: 17, overflow: 'hidden', marginBottom: 14 },
  songInfoUpper: { paddingHorizontal: 17, paddingTop: 18, paddingBottom: 16, flexDirection: 'row', gap: 9 },
  songMain: { flex: 1, minWidth: 0 },
  songCategory: { color: C.gold, backgroundColor: '#322200', alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 8, overflow: 'hidden', borderRadius: 12, fontSize: 9, letterSpacing: 0.5, fontWeight: '700' },
  songTitle: { color: C.ink, fontSize: 27, lineHeight: 38, fontWeight: '700', marginTop: 11 },
  subtitle: { color: C.muted, fontSize: 15, lineHeight: 23, fontFamily: serif, fontStyle: 'italic', marginTop: 5 },
  songArtist: { color: C.muted, fontSize: 12, marginTop: 12 },
  heartButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.red, justifyContent: 'center', alignItems: 'center' },
  heartText: { color: '#FFB3B6', fontSize: 27, lineHeight: 32 },
  quickActions: { backgroundColor: '#18091399', paddingHorizontal: 7, paddingVertical: 9, flexDirection: 'row', gap: 6, justifyContent: 'space-around' },
  quickAction: { flex: 1, minHeight: 50, paddingHorizontal: 3, backgroundColor: C.high, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 4 },
  quickIcon: { fontSize: 20, color: C.gold },
  quickLabel: { color: C.muted, fontSize: 9, fontWeight: '700' },
  videoIcon: { color: '#FFB3B6', fontSize: 16 },
  fontSizer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  fontPress: { paddingHorizontal: 5, paddingVertical: 6 },
  fontPressText: { fontSize: 12, color: C.gold, fontWeight: '800' },
  sizeValue: { fontSize: 10, color: C.muted, minWidth: 16, textAlign: 'center' },
  notice: { borderRadius: 11, backgroundColor: '#4A0E17', paddingHorizontal: 13, paddingVertical: 12, marginBottom: 12 },
  noticeText: { color: C.ink, fontSize: 12, lineHeight: 18 },
  scriptTabs: { flexDirection: 'row', gap: 4, borderRadius: 13, backgroundColor: '#180913', padding: 4, marginBottom: 14 },
  scriptTab: { flex: 1, minWidth: 0, borderRadius: 10, paddingVertical: 11, paddingHorizontal: 3, justifyContent: 'center', alignItems: 'center' },
  scriptSelected: { backgroundColor: C.red },
  scriptLabel: { color: C.muted, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  scriptActiveLabel: { color: C.gold },
  videoCard: { backgroundColor: C.low, borderRadius: 15, overflow: 'hidden', marginBottom: 14 },
  videoArtwork: { height: 160, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  videoImage: { ...StyleSheet.absoluteFill, width: '100%', height: '100%', opacity: 0.74 },
  videoShade: { ...StyleSheet.absoluteFill, backgroundColor: '#18091355' },
  bigPlay: { backgroundColor: '#C83E48', width: 54, height: 54, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  bigPlayText: { color: 'white', fontSize: 22 },
  videoDescription: { padding: 12, backgroundColor: C.card, flexDirection: 'row', alignItems: 'center', gap: 9 },
  videoLogo: { width: 30, height: 30, borderRadius: 16, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },
  videoLogoText: { color: C.gold, fontWeight: '800', fontSize: 11 },
  videoDetails: { flex: 1 },
  videoTitle: { color: C.ink, fontSize: 12, fontWeight: '700' },
  videoSub: { color: C.muted, fontSize: 11, marginTop: 2 },
  openExternal: { color: C.gold, fontSize: 22 },
  lyricsHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5, marginBottom: 13 },
  lyricsHeadingText: { color: C.gold, fontSize: 13, fontWeight: '800' },
  lyricsHint: { color: C.muted, fontSize: 11 },
  stanzaList: { gap: 14 },
  stanza: { backgroundColor: C.low, borderRadius: 15, paddingHorizontal: 17, paddingTop: 14, paddingBottom: 18, borderWidth: 1, borderColor: '#54434344' },
  firstStanza: { backgroundColor: '#341A29', borderLeftWidth: 3, borderLeftColor: C.gold },
  stanzaTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 },
  stanzaBadge: { color: C.gold, fontSize: 10, fontWeight: '800', letterSpacing: 0.5, backgroundColor: C.highest, overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12 },
  stanzaMusic: { color: C.gold, fontSize: 17 },
  pairedLine: { marginBottom: 14 },
  lyricLine: { color: C.ink, fontWeight: '500', textAlign: 'left' },
  romanLine: { color: C.muted, fontFamily: serif, fontStyle: 'italic', marginTop: 3 },
  romanBlock: { marginTop: 12 },
  emptyLyrics: { color: C.muted, fontSize: 14, textAlign: 'center' },
  youtubeFooter: { marginTop: 16, paddingHorizontal: 14, paddingVertical: 14, borderRadius: 12, backgroundColor: C.red, flexDirection: 'row', alignItems: 'center', gap: 12 },
  footerActionIcon: { color: C.gold, fontSize: 17 },
  footerActionLabel: { flex: 1, fontSize: 12, color: C.ink, fontWeight: '700' },
  shareFooter: { backgroundColor: C.card, marginTop: 9, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  shareFooterText: { color: C.gold, fontSize: 12, fontWeight: '700' },
  footer: { alignItems: 'center', marginTop: 29, paddingTop: 18, borderTopWidth: 1, borderColor: '#54434355' },
  footerBrand: { color: C.gold, fontSize: 19, fontFamily: serif, fontWeight: '700' },
  footerMotto: { color: C.muted, fontSize: 10, marginTop: 6, textAlign: 'center' },
  footerChurch: { color: C.gold, fontSize: 9, letterSpacing: 1, marginTop: 8 },
  readerRoot: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 50 : 15 },
  readerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12 },
  readerBrand: { color: C.gold, fontSize: 15, fontWeight: '800' },
  readerExit: { backgroundColor: C.high, width: 38, height: 38, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  readerExitText: { color: C.ink, fontSize: 18 },
  readerTitle: { color: C.ink, fontWeight: '700', fontSize: 22, textAlign: 'center', marginBottom: 16 },
  readerScroll: { flex: 1 },
  readerInner: { paddingBottom: 35, paddingTop: 7 },
  readerBottom: { borderTopWidth: 1, borderTopColor: C.edge, paddingVertical: 14, alignItems: 'center' },
});
