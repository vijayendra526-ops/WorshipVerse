
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '../lib/supabase';

type ProfileScreenProps = {
  onBack: () => void;
};

export default function ProfileScreen({ onBack }: ProfileScreenProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [messageIsError, setMessageIsError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      const { data, error } = await supabase.auth.getUser();

      if (!mounted) return;

      if (error || !data.user) {
        setMessage(error?.message || 'Please sign in to view your profile.');
        setMessageIsError(true);
        setLoading(false);
        return;
      }

      setEmail(data.user.email ?? '');
      setName(
        data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          ''
      );

      setLoading(false);
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  async function saveProfile() {
    setSaving(true);
    setMessage('');

    const { error } = await supabase.auth.updateUser({
      data: { full_name: name.trim() },
    });

    setSaving(false);

    if (error) {
      setMessage(error.message);
      setMessageIsError(true);
      return;
    }

    setMessage('Profile updated successfully!');
    setMessageIsError(false);
  }

  async function signOut() {
    setSaving(true);

    const { error } = await supabase.auth.signOut();

    setSaving(false);

    if (error) {
      setMessage(error.message);
      setMessageIsError(true);
      return;
    }

    onBack();
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#32165C" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back to WorshipVerse</Text>
        </TouchableOpacity>

        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {name.trim() ? name.trim()[0].toUpperCase() : '♪'}
              </Text>
            </View>

            <Text style={styles.title}>My Profile</Text>
            <Text style={styles.subtitle}>
              Manage your WorshipVerse account
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Display Name</Text>

            <TextInput
              value={name}
              onChangeText={(value) => {
                setName(value);
                setMessage('');
              }}
              maxLength={80}
              placeholder="Enter your name"
              placeholderTextColor="#999"
              style={styles.input}
            />

            <Text style={styles.label}>Email Address</Text>

            <TextInput
              value={email}
              editable={false}
              style={[styles.input, styles.disabledInput]}
            />

            <Text style={styles.helperText}>
              Your registered email address
            </Text>

            {!!message && (
              <View
                style={[
                  styles.messageBox,
                  messageIsError && styles.errorBox,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    messageIsError && styles.errorText,
                  ]}
                >
                  {message}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.saveButton,
                saving && styles.disabledButton,
              ]}
              onPress={saveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.signOutSection}>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={signOut}
              disabled={saving}
            >
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footer}>
          WorshipVerse · SHARON A.G. CHURCH
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF8F4',
  },
  content: {
    padding: 20,
    paddingBottom: 35,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FAF8F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#32165C',
    marginTop: 12,
    fontSize: 14,
  },
  backButton: {
    paddingVertical: 12,
  },
  backText: {
    color: '#65409A',
    fontSize: 14,
    fontWeight: '700',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#E9E1D3',
    padding: 22,
    marginTop: 18,
    elevation: 4,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#F4EFF9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#32165C',
    fontSize: 32,
    fontWeight: '800',
  },
  title: {
    color: '#32165C',
    fontSize: 25,
    fontWeight: '800',
    marginTop: 16,
  },
  subtitle: {
    color: '#77717F',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    gap: 10,
  },
  label: {
    color: '#24103F',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
  },
  input: {
    backgroundColor: '#FAF8F4',
    borderWidth: 1,
    borderColor: '#E9E1D3',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#24103F',
    fontSize: 14,
  },
  disabledInput: {
    backgroundColor: '#F0F0F0',
    color: '#77717F',
  },
  helperText: {
    color: '#999',
    fontSize: 11,
    marginTop: -4,
  },
  messageBox: {
    backgroundColor: '#F4EFF9',
    borderRadius: 12,
    padding: 13,
    marginTop: 10,
  },
  errorBox: {
    backgroundColor: '#FDECEC',
  },
  messageText: {
    color: '#65409A',
    fontSize: 13,
  },
  errorText: {
    color: '#B42318',
  },
  saveButton: {
    backgroundColor: '#32165C',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  signOutSection: {
    borderTopWidth: 1,
    borderTopColor: '#E9E1D3',
    marginTop: 28,
    paddingTop: 20,
  },
  signOutButton: {
    borderWidth: 1,
    borderColor: '#F2CACA',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: {
    color: '#B42318',
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    textAlign: 'center',
    color: '#8D8297',
    fontSize: 10,
    marginTop: 25,
  },
});
