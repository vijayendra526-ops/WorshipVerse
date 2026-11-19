import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './src/lib/supabase';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import AdminScreen from './src/screens/AdminScreen';
import { useAutomaticUpdateCheck } from './src/hooks/useAutomaticUpdateCheck';

type HomeScreenProps = {
  session: Session | null;
  onLogin: () => void;
};

const HomeScreenWithSession = HomeScreen as React.ComponentType<HomeScreenProps>;

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  useAutomaticUpdateCheck();

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.error('WorshipVerse session:', error.message);
      if (mounted) {
        setSession(data.session);
        setChecking(false);
      }
    }).catch((error) => {
      console.error('WorshipVerse session:', error);
      if (mounted) setChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) {
        setSession(nextSession);
        if (nextSession) setShowAuth(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (checking) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#56318C" />
        <Text style={styles.loadingText}>WorshipVerse...</Text>
      </View>
    );
  }

  if (session) {
    const role = session.user.app_metadata?.role;
    if (role === 'admin' || role === 'super_admin') {
      return <AdminScreen />;
    }
  }

  if (!session && showAuth) {
    return <AuthScreen onBrowse={() => setShowAuth(false)} />;
  }

  return <HomeScreenWithSession session={session} onLogin={() => setShowAuth(true)} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#FAF8F4',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
  loadingText: { color: '#32165C', fontWeight: '600' },
  authContainer: { flex: 1, backgroundColor: '#FAF8F4' },
  authContent: { flex: 1 },
  backButton: {
    backgroundColor: '#24103F',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backText: { color: '#D8B66C', fontWeight: '700', fontSize: 13 },
});
