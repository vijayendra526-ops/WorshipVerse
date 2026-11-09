
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { supabase } from './src/lib/supabase';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import AdminScreen from './src/screens/AdminScreen';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.error(error.message);
      setSession(data.session);
      setChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => setSession(newSession)
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  if (checking) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#56318C" />
        <Text>Loading WorshipVerse...</Text>
      </View>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  const role = session.user.app_metadata?.role;

  if (role === 'admin' || role === 'super_admin') {
    return <AdminScreen />;
  }

  return <HomeScreen />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#FAF8F4',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
});
