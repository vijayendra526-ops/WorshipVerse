
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

type SettingsScreenProps = {
  onBack: () => void;
};

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [email, setEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(true);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAccount() {
      const { data, error: authError } = await supabase.auth.getUser();

      if (authError || !data.user) {
        setLoading(false);
        Alert.alert(
          'Sign in required',
          'Please sign in to access account settings.',
          [{ text: 'OK', onPress: onBack }],
        );
        return;
      }

      setEmail(data.user.email ?? '');
      setLoading(false);
    }

    loadAccount();
  }, [onBack]);

  async function updateEmail() {
    setMessage('');
    setError('');

    const trimmedEmail = newEmail.trim();

    if (!trimmedEmail) {
      setError('Please enter your new email address.');
      return;
    }

    if (trimmedEmail.toLowerCase() === email.toLowerCase()) {
      setError('Your new email is the same as your current email.');
      return;
    }

    setSavingEmail(true);

    const { error: updateError } = await supabase.auth.updateUser({
      email: trimmedEmail,
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage(
        'Confirmation email sent. Please check your inbox to complete the email change.',
      );
      setNewEmail('');
    }

    setSavingEmail(false);
  }

  async function updatePassword() {
    setMessage('');
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSavingPassword(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage('Password updated successfully.');
      setPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Your password has been updated.');
    }

    setSavingPassword(false);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#65409A" />
        <Text style={styles.loadingText}>Loading account settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>‹  Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>WorshipVerse</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Account Settings</Text>
        <Text style={styles.subtitle}>
          Manage your WorshipVerse account information and security.
        </Text>

        {message ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{message}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          <Text style={styles.label}>Current email address</Text>
          <TextInput
            value={email}
            editable={false}
            style={styles.readOnlyInput}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Change Email Address</Text>

          <TextInput
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder="Enter new email address"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />

          <TouchableOpacity
            style={[
              styles.primaryButton,
              savingEmail && styles.disabledButton,
            ]}
            disabled={savingEmail}
            onPress={updateEmail}
          >
            <Text style={styles.primaryButtonText}>
              {savingEmail ? 'Sending...' : 'Update Email'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.helperText}>
            A confirmation email will be sent to your new address. Please
            check your inbox to complete the change.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Change Password</Text>

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="New password (minimum 8 characters)"
            placeholderTextColor="#999"
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
          />

          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            placeholderTextColor="#999"
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
          />

          <TouchableOpacity
            style={[
              styles.primaryButton,
              savingPassword && styles.disabledButton,
            ]}
            disabled={savingPassword}
            onPress={updatePassword}
          >
            <Text style={styles.primaryButtonText}>
              {savingPassword ? 'Updating...' : 'Update Password'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F4',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF8F4',
  },
  loadingText: {
    marginTop: 12,
    color: '#32165C',
    fontSize: 15,
  },
  header: {
    minHeight: 62,
    paddingHorizontal: 18,
    backgroundColor: '#32165C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backText: {
    color: '#D8B66C',
    fontSize: 15,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 45,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 45,
  },
  title: {
    color: '#32165C',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#777',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 22,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7DCC7',
    padding: 18,
    marginBottom: 18,
  },
  sectionTitle: {
    color: '#32165C',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    color: '#555',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9D3CA',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 13,
    color: '#24103F',
    fontSize: 14,
    marginBottom: 13,
  },
  readOnlyInput: {
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#D9D3CA',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 13,
    color: '#666',
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: '#32165C',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  helperText: {
    color: '#888',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },
  successBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 13,
    marginBottom: 15,
  },
  successText: {
    color: '#246B35',
    fontSize: 13,
    lineHeight: 19,
  },
  errorBox: {
    backgroundColor: '#FDECEC',
    borderRadius: 10,
    padding: 13,
    marginBottom: 15,
  },
  errorText: {
    color: '#B42318',
    fontSize: 13,
    lineHeight: 19,
  },
});
