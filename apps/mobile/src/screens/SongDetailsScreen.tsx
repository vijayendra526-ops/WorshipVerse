
import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Linking,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { supabase } from '../lib/supabase';

type Song = {
  id: string;
  title: string;
  artist: string | null;
  language: string;
  lyrics: string;
  lyrics_transliteration?: string | null;
  youtube_url: string | null;
};

type SongDetailsScreenProps = {
  song: Song;
  onBack: () => void;
  onFavouriteChange?: (isFavourite: boolean) => void;
};

const COLORS = {
  purple: '#32165C',
  deepPurple: '#24103F',
  gold: '#D8B66C',
  ivory: '#FAF8F4',
  white: '#FFFFFF',
  muted: '#77717F',
  border: '#EEE9F2',
};

export default function SongDetailsScreen({
  song,
  onBack,
  onFavouriteChange,
}: SongDetailsScreenProps) {
  const [lyricsView, setLyricsView] = useState<'te' | 'en'>('te');
  const [fontSize, setFontSize] = useState(17);

  const [isFavourite, setIsFavourite] = useState(false);
  const [checkingFavourite, setCheckingFavourite] = useState(true);
  const [updatingFavourite, setUpdatingFavourite] = useState(false);

  const [fullScreenLyrics, setFullScreenLyrics] = useState(false);

  const isTelugu = song.language === 'te';

  const displayedLyrics = isTelugu
    ? lyricsView === 'te'
      ? song.lyrics
      : song.lyrics_transliteration ?? ''
    : song.lyrics;

  // Check existing favourite status
  useEffect(() => {
    let isActive = true;

    async function checkFavourite() {
      setCheckingFavourite(true);

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          if (isActive) setIsFavourite(false);
          return;
        }

        const { data, error } = await supabase
          .from('favourites')
          .select('song_id')
          .eq('user_id', user.id)
          .eq('song_id', song.id)
          .maybeSingle();

        if (error) throw error;

        if (isActive) {
          setIsFavourite(!!data);
        }
      } catch (error) {
        console.error('Favourite check failed:', error);
      } finally {
        if (isActive) setCheckingFavourite(false);
      }
    }

    checkFavourite();

    return () => {
      isActive = false;
    };
  }, [song.id]);

  // Add or remove favourite
  async function toggleFavourite() {
    if (updatingFavourite) return;

    setUpdatingFavourite(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        Alert.alert(
          'Login required',
          'Please log in to save songs to your favourites.'
        );
        return;
      }

      if (isFavourite) {
        const { error } = await supabase
          .from('favourites')
          .delete()
          .eq('user_id', user.id)
          .eq('song_id', song.id);

        if (error) throw error;

        setIsFavourite(false);
        onFavouriteChange?.(false);

        Alert.alert(
          'Removed',
          'Song removed from your favourites.'
        );
      } else {
        const { error } = await supabase
          .from('favourites')
          .insert({
            user_id: user.id,
            song_id: song.id,
          });

        if (error) throw error;

        setIsFavourite(true);
        onFavouriteChange?.(true);

        Alert.alert(
          'Saved',
          'Song added to your favourites.'
        );
      }
    } catch (error: any) {
      console.error('Favourite update failed:', error);

      Alert.alert(
        'Unable to update favourites',
        error?.message ?? 'Please try again.'
      );
    } finally {
      setUpdatingFavourite(false);
    }
  }

  // Open YouTube
  async function openYouTube() {
    if (!song.youtube_url) return;

    try {
      await Linking.openURL(song.youtube_url);
    } catch {
      Alert.alert(
        'Unable to open video',
        'Please check the YouTube link.'
      );
    }
  }

  // Share lyrics
  async function shareLyrics() {
    try {
      const lyricsToShare = [
        song.title,
        song.artist ? `By ${song.artist}` : '',
        '',
        displayedLyrics,
        '',
        'Shared from WorshipVerse',
        song.youtube_url ?? '',
      ]
        .filter(Boolean)
        .join('\n');

      await Share.share({
        message: lyricsToShare,
      });
    } catch {
      Alert.alert(
        'Sharing failed',
        'Unable to share this song.'
      );
    }
  }

  // Adjust font size
  function changeFontSize(amount: number) {
    setFontSize((current) =>
      Math.min(26, Math.max(13, current + amount))
    );
  }

  // FULL-SCREEN LYRICS MODE
  if (fullScreenLyrics) {
    return (
      <View style={styles.fullScreenContainer}>
        <StatusBar hidden />

        {/* Full-screen header */}
        <View style={styles.fullScreenHeader}>
          <Text style={styles.fullScreenHeading}>
            WORSHIPVERSE
          </Text>

          <TouchableOpacity
            onPress={() => setFullScreenLyrics(false)}
            style={styles.closeButton}
            activeOpacity={0.8}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>

        {/* Song title */}
        <Text style={styles.fullScreenSongTitle}>
          {song.title}
        </Text>

        {!!song.artist && (
          <Text style={styles.fullScreenArtist}>
            {song.artist}
          </Text>
        )}

        {/* Language selector */}
        {isTelugu && (
          <View style={styles.fullScreenLanguageTabs}>
            <TouchableOpacity
              style={[
                styles.fullScreenLanguageTab,
                lyricsView === 'te' && styles.fullScreenActiveTab,
              ]}
              onPress={() => setLyricsView('te')}
            >
              <Text
                style={[
                  styles.fullScreenLanguageText,
                  lyricsView === 'te' &&
                    styles.fullScreenActiveText,
                ]}
              >
                తెలుగు
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.fullScreenLanguageTab,
                lyricsView === 'en' && styles.fullScreenActiveTab,
              ]}
              onPress={() => setLyricsView('en')}
            >
              <Text
                style={[
                  styles.fullScreenLanguageText,
                  lyricsView === 'en' &&
                    styles.fullScreenActiveText,
                ]}
              >
                English
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Full-screen lyrics */}
        <ScrollView
          style={styles.fullScreenScroll}
          contentContainerStyle={styles.fullScreenLyricsContent}
          showsVerticalScrollIndicator={false}
        >
          <Text
            selectable
            style={[
              styles.fullScreenLyricsText,
              {
                fontSize,
                lineHeight: fontSize * 1.9,
              },
            ]}
          >
            {displayedLyrics ||
              (isTelugu && lyricsView === 'en'
                ? 'English transliteration is not available yet.'
                : 'Lyrics are not available yet.')}
          </Text>
        </ScrollView>

        {/* Font controls */}
        <View style={styles.fullScreenControls}>
          <TouchableOpacity
            style={styles.fullScreenSizeButton}
            onPress={() => changeFontSize(-2)}
          >
            <Text style={styles.fullScreenSizeText}>A−</Text>
          </TouchableOpacity>

          <Text style={styles.fullScreenSizeValue}>
            {fontSize}
          </Text>

          <TouchableOpacity
            style={styles.fullScreenSizeButton}
            onPress={() => changeFontSize(2)}
          >
            <Text style={styles.fullScreenSizeText}>A+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // NORMAL SONG DETAILS SCREEN
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Back to Songs</Text>
        </TouchableOpacity>

        <Text style={styles.brand}>WORSHIPVERSE</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Song information */}
        <View style={styles.songHeader}>
          <View style={styles.musicIcon}>
            <Text style={styles.musicIconText}>♫</Text>
          </View>

          <Text style={styles.eyebrow}>
            WORSHIPVERSE LIBRARY
          </Text>

          <Text style={styles.songTitle}>
            {song.title}
          </Text>

          {!!song.artist && (
            <Text style={styles.artist}>
              {song.artist}
            </Text>
          )}

          <View style={styles.languageBadge}>
            <Text style={styles.languageBadgeText}>
              {isTelugu ? 'తెలుగు SONG' : 'ENGLISH SONG'}
            </Text>
          </View>

          {/* Favourite button */}
          <TouchableOpacity
            style={[
              styles.favouriteButton,
              isFavourite && styles.favouriteButtonActive,
            ]}
            onPress={toggleFavourite}
            disabled={checkingFavourite || updatingFavourite}
            activeOpacity={0.8}
          >
            {checkingFavourite || updatingFavourite ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.favouriteIcon}>
                  {isFavourite ? '♥' : '♡'}
                </Text>

                <Text style={styles.favouriteButtonText}>
                  {isFavourite
                    ? 'Remove from Favourites'
                    : 'Add to Favourites'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Lyrics card */}
        <View style={styles.lyricsCard}>
          <View style={styles.lyricsHeader}>
            <View>
              <Text style={styles.lyricsHeading}>
                Song Lyrics
              </Text>

              <Text style={styles.lyricsSubheading}>
                Read and worship along
              </Text>
            </View>

            <Text style={styles.lyricsIcon}>♫</Text>
          </View>

          {/* Lyrics language selector */}
          {isTelugu && (
            <View style={styles.languageTabs}>
              <TouchableOpacity
                style={[
                  styles.languageTab,
                  lyricsView === 'te' &&
                    styles.activeLanguageTab,
                ]}
                onPress={() => setLyricsView('te')}
              >
                <Text
                  style={[
                    styles.languageText,
                    lyricsView === 'te' &&
                      styles.activeLanguageText,
                  ]}
                >
                  తెలుగు
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.languageTab,
                  lyricsView === 'en' &&
                    styles.activeLanguageTab,
                ]}
                onPress={() => setLyricsView('en')}
              >
                <Text
                  style={[
                    styles.languageText,
                    lyricsView === 'en' &&
                      styles.activeLanguageText,
                  ]}
                >
                  English
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Full-screen button */}
          <TouchableOpacity
            style={styles.fullScreenButton}
            onPress={() => setFullScreenLyrics(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.fullScreenButtonText}>
              ⛶  Read Lyrics Full Screen
            </Text>
          </TouchableOpacity>

          {/* Text size controls */}
          <View style={styles.textSizeRow}>
            <Text style={styles.textSizeLabel}>
              Text size
            </Text>

            <View style={styles.textSizeControls}>
              <TouchableOpacity
                style={styles.sizeButton}
                onPress={() => changeFontSize(-2)}
              >
                <Text style={styles.sizeButtonText}>A−</Text>
              </TouchableOpacity>

              <Text style={styles.sizeValue}>
                {fontSize}
              </Text>

              <TouchableOpacity
                style={styles.sizeButton}
                onPress={() => changeFontSize(2)}
              >
                <Text style={styles.sizeButtonText}>A+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Complete lyrics */}
          <View style={styles.lyricsDivider} />

          <Text
            selectable
            style={[
              styles.lyricsText,
              {
                fontSize,
                lineHeight: fontSize * 1.8,
              },
            ]}
          >
            {displayedLyrics ||
              (isTelugu && lyricsView === 'en'
                ? 'English transliteration is not available yet.'
                : 'Lyrics are not available yet.')}
          </Text>
        </View>

        {/* YouTube */}
        {song.youtube_url && (
          <TouchableOpacity
            style={styles.youtubeButton}
            onPress={openYouTube}
            activeOpacity={0.85}
          >
            <Text style={styles.youtubeIcon}>▶</Text>

            <View style={styles.youtubeContent}>
              <Text style={styles.youtubeTitle}>
                Watch on YouTube
              </Text>

              <Text style={styles.youtubeSubtitle}>
                Listen to this worship song
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* Share */}
        <TouchableOpacity
          style={styles.shareButton}
          onPress={shareLyrics}
          activeOpacity={0.85}
        >
          <Text style={styles.shareButtonText}>
            ↗  Share Song Lyrics
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>
            WorshipVerse
          </Text>

          <Text style={styles.footerTagline}>
            Every Song, A Prayer. Every Verse, A Praise.
          </Text>

          <Text style={styles.footerChurch}>
            SHARON A.G. CHURCH
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ivory,
  },

  header: {
    backgroundColor: COLORS.deepPurple,
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  backButton: {
    paddingVertical: 8,
  },

  backText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },

  brand: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
  },

  content: {
    paddingBottom: 30,
  },

  songHeader: {
    backgroundColor: COLORS.purple,
    paddingHorizontal: 25,
    paddingTop: 32,
    paddingBottom: 35,
    alignItems: 'center',
  },

  musicIcon: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: '#4A2C70',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#765A96',
  },

  musicIconText: {
    color: COLORS.gold,
    fontSize: 43,
  },

  eyebrow: {
    color: COLORS.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },

  songTitle: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 35,
    marginTop: 12,
  },

  artist: {
    color: '#E0D5EA',
    fontSize: 13,
    marginTop: 8,
  },

  languageBadge: {
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 7,
    marginTop: 18,
  },

  languageBadgeText: {
    color: COLORS.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

  favouriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A2C70',
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 11,
    marginTop: 22,
    minWidth: 205,
    minHeight: 42,
  },

  favouriteButtonActive: {
    backgroundColor: '#6B2855',
    borderColor: '#F0B5C9',
  },

  favouriteIcon: {
    color: '#F4B8CC',
    fontSize: 19,
    marginRight: 9,
  },

  favouriteButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },

  lyricsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    marginHorizontal: 17,
    marginTop: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  lyricsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  lyricsHeading: {
    color: COLORS.purple,
    fontSize: 19,
    fontWeight: '800',
  },

  lyricsSubheading: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 5,
  },

  lyricsIcon: {
    color: COLORS.gold,
    fontSize: 30,
  },

  languageTabs: {
    flexDirection: 'row',
    backgroundColor: '#F4F0F7',
    borderRadius: 12,
    padding: 4,
    marginTop: 20,
  },

  languageTab: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 9,
  },

  activeLanguageTab: {
    backgroundColor: COLORS.purple,
  },

  languageText: {
    color: COLORS.purple,
    fontSize: 12,
    fontWeight: '700',
  },

  activeLanguageText: {
    color: COLORS.white,
  },

  fullScreenButton: {
    backgroundColor: '#F4F0F7',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },

  fullScreenButtonText: {
    color: COLORS.purple,
    fontSize: 13,
    fontWeight: '800',
  },

  textSizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
  },

  textSizeLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
  },

  textSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  sizeButton: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: '#F1EAF8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  sizeButtonText: {
    color: COLORS.purple,
    fontSize: 14,
    fontWeight: '800',
  },

  sizeValue: {
    color: COLORS.purple,
    fontSize: 12,
    fontWeight: '700',
    minWidth: 18,
    textAlign: 'center',
  },

  lyricsDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 20,
  },

  lyricsText: {
    color: '#51495A',
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 8,
  },

  youtubeButton: {
    backgroundColor: COLORS.purple,
    marginHorizontal: 17,
    marginTop: 18,
    borderRadius: 15,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
  },

  youtubeIcon: {
    color: COLORS.white,
    fontSize: 22,
    marginRight: 13,
  },

  youtubeContent: {
    flex: 1,
  },

  youtubeTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },

  youtubeSubtitle: {
    color: '#DED3E9',
    fontSize: 11,
    marginTop: 4,
  },

  arrow: {
    color: COLORS.gold,
    fontSize: 27,
  },

  shareButton: {
    marginHorizontal: 17,
    marginTop: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D8C7E8',
    borderRadius: 14,
    alignItems: 'center',
  },

  shareButtonText: {
    color: COLORS.purple,
    fontSize: 14,
    fontWeight: '800',
  },

  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 32,
  },

  footerBrand: {
    color: COLORS.purple,
    fontSize: 17,
    fontWeight: '800',
  },

  footerTagline: {
    color: '#98712F',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 7,
  },

  footerChurch: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 8,
  },

  // FULL-SCREEN LYRICS STYLES

  fullScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.ivory,
    paddingHorizontal: 22,
    paddingTop: 25,
    paddingBottom: 20,
  },

  fullScreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 18,
  },

  fullScreenHeading: {
    color: COLORS.purple,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
  },

  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F0EAF4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeButtonText: {
    color: COLORS.purple,
    fontSize: 30,
    lineHeight: 34,
  },

  fullScreenSongTitle: {
    color: COLORS.purple,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 5,
  },

  fullScreenArtist: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 15,
  },

  fullScreenLanguageTabs: {
    flexDirection: 'row',
    backgroundColor: '#F0EAF4',
    borderRadius: 12,
    padding: 4,
    marginTop: 15,
    marginBottom: 12,
  },

  fullScreenLanguageTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 9,
  },

  fullScreenActiveTab: {
    backgroundColor: COLORS.purple,
  },

  fullScreenLanguageText: {
    color: COLORS.purple,
    fontSize: 13,
    fontWeight: '700',
  },

  fullScreenActiveText: {
    color: COLORS.white,
  },

  fullScreenScroll: {
    flex: 1,
  },

  fullScreenLyricsContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
  },

  fullScreenLyricsText: {
    color: '#32165C',
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
  },

  fullScreenControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 25,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  fullScreenSizeButton: {
    width: 45,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F0EAF4',
    justifyContent: 'center',
    alignItems: 'center',
  },

  fullScreenSizeText: {
    color: COLORS.purple,
    fontSize: 17,
    fontWeight: '800',
  },

  fullScreenSizeValue: {
    color: COLORS.purple,
    fontSize: 14,
    fontWeight: '700',
  },
});
