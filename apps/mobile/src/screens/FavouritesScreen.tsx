
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '../lib/supabase';

type Song = {
  id: string;
  title: string;
  artist: string | null;
  language: string;
  lyrics: string;
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

export default function FavouritesScreen({
  onBack,
  onBrowseSongs,
}: FavouritesScreenProps) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSongId, setExpandedSongId] = useState<string | null>(null);
  const [removingSongId, setRemovingSongId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadFavourites() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (authError || !user) {
        setError(authError?.message || 'Please sign in to view favourites.');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('favourites')
        .select(`
          song_id,
          songs (
            id,
            title,
            artist,
            language,
            lyrics,
            youtube_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!mounted) return;

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      const rows = (data ?? []) as unknown as FavouriteRow[];

      const favouriteSongs = rows.flatMap((item) => {
        if (!item.songs) return [];
        return Array.isArray(item.songs) ? item.songs : [item.songs];
      });

      setSongs(favouriteSongs);
      setLoading(false);
    }

    loadFavourites();

    return () => {
      mounted = false;
    };
  }, []);

  async function removeFavourite(songId: string) {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setError(authError?.message || 'Please sign in again.');
      return;
    }

    setRemovingSongId(songId);
    setError('');

    const { error: removeError } = await supabase
      .from('favourites')
      .delete()
      .eq('user_id', user.id)
      .eq('song_id', songId);

    setRemovingSongId(null);

    if (removeError) {
      setError(removeError.message);
      return;
    }

    setSongs((current) =>
      current.filter((song) => song.id !== songId)
    );
  }

  async function openYouTube(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open YouTube', 'Please try again later.');
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.headerBrand}>WorshipVerse</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onBrowseSongs}>
          <Text style={styles.browseButton}>Browse Songs →</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>YOUR PERSONAL LIBRARY</Text>

        <Text style={styles.title}>♥ My Favourites</Text>

        <Text style={styles.subtitle}>
          All your saved worship songs in one place.
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#32165C" />
            <Text style={styles.loadingText}>
              Loading your favourites...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : songs.length > 0 ? (
          <View style={styles.songList}>
            <Text style={styles.countText}>
              {songs.length} saved {songs.length === 1 ? 'song' : 'songs'}
            </Text>

            {songs.map((song) => {
              const expanded = expandedSongId === song.id;

              return (
                <View key={song.id} style={styles.songCard}>
                  <View style={styles.songHeader}>
                    <View style={styles.songInfo}>
                      <Text style={styles.songTitle}>
                        {song.title}
                      </Text>

                      {!!song.artist && (
                        <Text style={styles.artist}>
                          {song.artist}
                        </Text>
                      )}

                      <Text style={styles.language}>
                        {song.language === 'te' ? 'TELUGU' : 'ENGLISH'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeFavourite(song.id)}
                      disabled={removingSongId === song.id}
                    >
                      {removingSongId === song.id ? (
                        <ActivityIndicator color="#B42318" />
                      ) : (
                        <Text style={styles.removeText}>♥</Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.lyricsButton}
                    onPress={() =>
                      setExpandedSongId(expanded ? null : song.id)
                    }
                  >
                    <Text style={styles.lyricsButtonText}>
                      {expanded ? 'Hide Lyrics ▲' : 'View Lyrics ▼'}
                    </Text>
                  </TouchableOpacity>

                  {expanded && (
                    <View style={styles.lyricsContainer}>
                      <Text style={styles.lyricsText}>
                        {song.lyrics || 'Lyrics are not available.'}
                      </Text>
                    </View>
                  )}

                  {!!song.youtube_url && (
                    <TouchableOpacity
                      style={styles.youtubeButton}
                      onPress={() => openYouTube(song.youtube_url!)}
                    >
                      <Text style={styles.youtubeButtonText}>
                        ▶ Watch on YouTube
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyHeart}>♡</Text>

            <Text style={styles.emptyTitle}>
              No favourites yet
            </Text>

            <Text style={styles.emptyDescription}>
              Browse songs and tap the heart to save your favourites.
            </Text>

            <TouchableOpacity
              style={styles.exploreButton}
              onPress={onBrowseSongs}
            >
              <Text style={styles.exploreButtonText}>
                Browse Songs
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          WorshipVerse · SHARON A.G. CHURCH
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF8F4',
  },
  header: {
    backgroundColor: '#32165C',
    paddingHorizontal: 20,
    paddingVertical: 19,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBrand: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  browseButton: {
    color: '#D8B66C',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    padding: 20,
    paddingBottom: 35,
  },
  eyebrow: {
    color: '#9B7A3C',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 12,
  },
  title: {
    color: '#32165C',
    fontSize: 29,
    fontWeight: '800',
    marginTop: 12,
  },
  subtitle: {
    color: '#77717F',
    fontSize: 13,
    marginTop: 9,
    lineHeight: 21,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#77717F',
    marginTop: 14,
  },
  errorBox: {
    backgroundColor: '#FDECEC',
    borderRadius: 12,
    padding: 15,
    marginTop: 25,
  },
  errorText: {
    color: '#B42318',
    fontSize: 13,
  },
  songList: {
    marginTop: 28,
    gap: 16,
  },
  countText: {
    color: '#77717F',
    fontSize: 12,
    fontWeight: '600',
  },
  songCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E0D2',
    borderRadius: 19,
    padding: 17,
    elevation: 2,
  },
  songHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: '#32165C',
    fontSize: 18,
    fontWeight: '800',
  },
  artist: {
    color: '#77717F',
    fontSize: 12,
    marginTop: 5,
  },
  language: {
    color: '#98712F',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 10,
    letterSpacing: 1,
  },
  removeButton: {
    width: 42,
    height: 42,
    borderRadius: 22,
    backgroundColor: '#FFF1F1',
    borderWidth: 1,
    borderColor: '#F2CACA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    color: '#B42318',
    fontSize: 21,
  },
  lyricsButton: {
    borderTopWidth: 1,
    borderTopColor: '#EEE8DE',
    marginTop: 18,
    paddingTop: 15,
  },
  lyricsButtonText: {
    color: '#6B4A91',
    fontSize: 13,
    fontWeight: '700',
  },
  lyricsContainer: {
    backgroundColor: '#FAF8F4',
    borderRadius: 12,
    padding: 14,
    marginTop: 13,
  },
  lyricsText: {
    color: '#4B4552',
    fontSize: 14,
    lineHeight: 26,
  },
  youtubeButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#32165C',
    borderRadius: 9,
    paddingHorizontal: 15,
    paddingVertical: 11,
    marginTop: 17,
  },
  youtubeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D8B66C',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginTop: 35,
  },
  emptyHeart: {
    color: '#D8B66C',
    fontSize: 58,
  },
  emptyTitle: {
    color: '#32165C',
    fontSize: 21,
    fontWeight: '800',
    marginTop: 12,
  },
  emptyDescription: {
    color: '#77717F',
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 9,
  },
  exploreButton: {
    backgroundColor: '#32165C',
    borderRadius: 12,
    paddingHorizontal: 23,
    paddingVertical: 14,
    marginTop: 22,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  footer: {
    backgroundColor: '#1B0D2D',
    padding: 17,
    alignItems: 'center',
  },
  footerText: {
    color: '#D8B66C',
    fontSize: 10,
  },
});
