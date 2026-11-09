import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Required', 'Please enter your email and password.');
      return;
    }

    if (!isLogin && !name.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Password', 'Use at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() },
          },
        });

        if (error) throw error;

        Alert.alert(
          'Check your email',
          'Please verify your email address to activate your account.'
        );
      }
    } catch (error: any) {
      Alert.alert('Authentication failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>WorshipVerse</Text>
      <Text style={styles.tagline}>Every Song, A Prayer.</Text>

      <Text style={styles.heading}>
        {isLogin ? 'Welcome Back' : 'Create Account'}
      </Text>

      {!isLogin && (
        <TextInput
          style={styles.input}
          placeholder="Full name"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Email address"
        placeholderTextColor="#999"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password (minimum 8 characters)"
        placeholderTextColor="#999"
        secureTextEntry
        autoComplete={isLogin ? 'current-password' : 'new-password'}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleAuth}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryText}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
        <Text style={styles.switchText}>
          {isLogin
            ? "Don't have an account? Sign Up"
            : 'Already have an account? Sign In'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.footer}>SHARON A.G. CHURCH</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6FC',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  brand: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#56318C',
    textAlign: 'center',
  },
  tagline: {
    color: '#A58543',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 45,
  },
  heading: {
    fontSize: 25,
    fontWeight: '700',
    color: '#292039',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6DFEF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    color: '#292039',
  },
  primaryButton: {
    backgroundColor: '#56318C',
    padding: 17,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  switchText: {
    color: '#56318C',
    textAlign: 'center',
    marginTop: 24,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    color: '#A58543',
    marginTop: 55,
    letterSpacing: 2,
    fontSize: 11,
  },
});
