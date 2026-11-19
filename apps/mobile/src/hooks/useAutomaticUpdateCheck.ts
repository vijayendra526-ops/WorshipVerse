import { useEffect, useRef } from 'react';
import { Alert, AppState, Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MANIFEST_URL = 'https://worshipverse-silk.vercel.app/latest-version.json';
const DOWNLOAD_URL = 'https://worshipverse-silk.vercel.app/download';
const DISMISS_KEY = 'worshipverse:dismissed-update-version';
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // Check at most every six hours per app session
const REMIND_AFTER_MS = 24 * 60 * 60 * 1000;

type Release = { version: string; versionCode?: number; releaseNotes?: string; downloadUrl?: string };

function versionParts(value: string): number[] | null {
  if (!/^\d+\.\d+\.\d+$/.test(value)) return null;
  return value.split('.').map(Number);
}

function isNewer(latest: string, installed: string): boolean {
  const a = versionParts(latest);
  const b = versionParts(installed);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
}

export function useAutomaticUpdateCheck() {
  const running = useRef(false);
  const lastCheck = useRef(0);
  const shownVersions = useRef(new Set<string>());

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    let active = true;

    async function check() {
      if (!active || running.current) return;
      if (Date.now() - lastCheck.current < CHECK_INTERVAL_MS) return;
      running.current = true;
      lastCheck.current = Date.now();
      const installed = Constants.expoConfig?.version;
      if (!installed) { running.current = false; return; }
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        let response: Response;
        try {
          response = await fetch(`${MANIFEST_URL}?t=${Date.now()}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          });
        } finally {
          clearTimeout(timeout);
        }
        if (!response.ok) return;
        const data: Release = await response.json();
        if (!data || typeof data.version !== 'string') return;
        if (!isNewer(data.version, installed)) return;
        if (shownVersions.current.has(data.version)) return;
        const dismissedRaw = await AsyncStorage.getItem(DISMISS_KEY);
        if (dismissedRaw) {
          const [dismissedVersion, dismissedAt] = dismissedRaw.split('|');
          if (dismissedVersion === data.version && Date.now() - Number(dismissedAt) < REMIND_AFTER_MS) return;
        }
        if (!active) return;
        shownVersions.current.add(data.version);
        const notes = typeof data.releaseNotes === 'string' ? data.releaseNotes.slice(0, 300) : '';
        // Only open the official WorshipVerse download page, not an arbitrary manifest URL.
        Alert.alert(
          'WorshipVerse à°…à°ªà±â€Œà°¡à±‡à°Ÿà± à°…à°‚à°¦à±à°¬à°¾à°Ÿà±à°²à±‹ à°‰à°‚à°¦à°¿ / Update Available',
          `à°•à±Šà°¤à±à°¤ à°µà±†à°°à±à°·à°¨à± ${data.version} à°…à°‚à°¦à±à°¬à°¾à°Ÿà±à°²à±‹ à°‰à°‚à°¦à°¿.\nVersion ${data.version} is available.${notes ? `\n\n${notes}` : ''}`,
          [
            {
              text: 'à°¤à°°à±à°µà°¾à°¤ / Later',
              style: 'cancel',
              onPress: () => { void AsyncStorage.setItem(DISMISS_KEY, `${data.version}|${Date.now()}`); },
            },
            {
              text: 'à°…à°ªà±â€Œà°¡à±‡à°Ÿà± / Update Now',
              onPress: () => { void Linking.openURL(DOWNLOAD_URL); },
            },
          ],
          { cancelable: false },
        );
      } catch {
        // No internet or server unavailable: keep the app and offline lyrics working.
      } finally {
        running.current = false;
      }
    }

    // First check at startup; also recheck when user returns to the app.
    void check();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void check();
    });
    return () => { active = false; subscription.remove(); };
  }, []);
}