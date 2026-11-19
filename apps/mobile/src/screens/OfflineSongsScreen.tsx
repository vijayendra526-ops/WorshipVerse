import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getOfflineSongs } from '../lib/offlineSongs';
import SongDetailsScreen from './SongDetailsScreen';

type Song = { id: string; title: string; artist: string | null; language: string; lyrics: string; lyrics_transliteration?: string | null; youtube_url: string | null };
type Props = { language: 'te' | 'en' };
export default function OfflineSongsScreen({language}: Props) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [selected, setSelected] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([getOfflineSongs('te'), getOfflineSongs('en')]).then(([te,en]) => {
      if (active) setSongs([...(te as Song[]), ...(en as Song[])]);
    }).catch(error => console.warn('Offline songs unavailable:', error)).finally(() => {if (active) setLoading(false);});
    return () => {active = false;};
  }, []);
  if (selected) return <SongDetailsScreen song={selected} onBack={() => setSelected(null)} />;
  return <View style={s.root}>
    <Text style={s.title}>{language === 'te' ? 'ఆఫ్‌లైన్ పాటలు' : 'Offline Songs'}</Text>
    <Text style={s.subtitle}>{language === 'te' ? 'ఈ పరికరంలో నిల్వ చేసిన పాటలు' : 'Songs saved on this device'}</Text>
    {loading ? <ActivityIndicator color="#F0BF5C" /> : null}
    <ScrollView style={s.scroll} contentContainerStyle={s.body}>
      {!loading && !songs.length ? <Text style={s.empty}>{language === 'te' ? 'ఇంకా ఆఫ్‌లైన్ పాటలు లేవు. ఇంటర్నెట్‌తో పాటల జాబితాను ఒకసారి తెరవండి.' : 'No cached songs yet. Visit the song library while online first.'}</Text> : null}
      {songs.map(song => <TouchableOpacity key={song.id} style={s.item} onPress={() => setSelected(song)} accessibilityRole="button">
        <Text style={s.note}>♫</Text><View style={s.copy}><Text style={s.songTitle} numberOfLines={2}>{song.title}</Text><Text style={s.artist}>{song.artist || 'WorshipVerse'} · {song.language === 'te' ? 'తెలుగు' : 'English'}</Text></View><Text style={s.arrow}>›</Text>
      </TouchableOpacity>)}
    </ScrollView>
  </View>;
}
const s=StyleSheet.create({
  root:{flex:1,backgroundColor:'#1E0E19',paddingTop:18},title:{fontSize:24,color:'#F7DBEA',fontWeight:'800',marginHorizontal:16},subtitle:{color:'#D9C1C1',fontSize:12,marginHorizontal:16,marginTop:5,marginBottom:15},scroll:{flex:1},body:{paddingHorizontal:15,paddingBottom:25},item:{flexDirection:'row',alignItems:'center',backgroundColor:'#2B1A25',borderRadius:14,padding:14,marginBottom:9,borderWidth:1,borderColor:'#54434366'},note:{fontSize:22,color:'#F0BF5C',marginRight:12},copy:{flex:1},songTitle:{color:'#F7DBEA',fontSize:15,fontWeight:'700'},artist:{color:'#D9C1C1',fontSize:11,marginTop:5},arrow:{color:'#F0BF5C',fontSize:24,marginLeft:8},empty:{color:'#D9C1C1',fontSize:13,lineHeight:21,marginTop:15}
});
