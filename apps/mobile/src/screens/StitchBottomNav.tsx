import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Tab = 'home' | 'songs' | 'lyrics' | 'favourites' | 'offline';
type Props = {
  active: Tab;
  language: 'te' | 'en';
  onHome: () => void;
  onSongs: () => void;
  onLyrics: () => void;
  onFavourites: () => void;
  onOffline: () => void;
};
const labels = {
  te: ['హోమ్', 'పాటలు', 'సాహిత్యం', 'ఇష్టమైనవి', 'ఆఫ్‌లైన్'],
  en: ['Home', 'Songs', 'Lyrics', 'Favourites', 'Offline'],
};
const entries: {key: Tab; icon: string; action: keyof Pick<Props,'onHome'|'onSongs'|'onLyrics'|'onFavourites'|'onOffline'>}[] = [
  { key: 'home', icon: '⌂', action: 'onHome' },
  { key: 'songs', icon: '♫', action: 'onSongs' },
  { key: 'lyrics', icon: '▤', action: 'onLyrics' },
  { key: 'favourites', icon: '♡', action: 'onFavourites' },
  { key: 'offline', icon: '↓', action: 'onOffline' },
];
export default function StitchBottomNav(props: Props) {
  return (
    <View style={s.bar}>
      {entries.map(({key, icon, action}, i) => {
        const selected = props.active === key;
        return (
          <TouchableOpacity key={key} style={s.tab} onPress={props[action]} accessibilityRole="tab" accessibilityState={{selected}} accessibilityLabel={labels[props.language][i]}>
            <View style={[s.indicator, selected && s.indicatorSelected]} />
            <Text style={[s.icon, selected && s.gold]}>{icon}</Text>
            <Text style={[s.label, selected && s.gold]} numberOfLines={1}>{labels[props.language][i]}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const s = StyleSheet.create({
  bar: {height: Platform.OS === 'ios' ? 83 : 67, paddingBottom: Platform.OS === 'ios' ? 19 : 5, backgroundColor: '#180913', flexDirection: 'row', alignItems: 'stretch', borderTopColor: '#54434366', borderTopWidth: 1},
  tab: {flex: 1, alignItems: 'center', justifyContent: 'center', minWidth: 0},
  indicator: {height: 2, width: 23, borderRadius: 2, marginBottom: 5, backgroundColor: 'transparent'},
  indicatorSelected: {backgroundColor: '#F0BF5C'},
  icon: {color: '#D9C1C1', fontSize: 23, lineHeight: 26},
  label: {color: '#D9C1C1', fontSize: 9, fontWeight: '600', marginTop: 2},
  gold: {color: '#F0BF5C', fontWeight: '800'},
});
