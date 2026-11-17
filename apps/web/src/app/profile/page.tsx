
'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ProfilePage() {
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (error || !user) {
        router.replace('/login');
        return;
      }

      setEmail(user.email ?? '');
      setName(
        user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          ''
      );
      setLoading(false);
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [router, supabase]);

  async function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (saving) return;

    setSaving(true);
    setMessage('');
    setHasError(false);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: name.trim() },
      });

      if (error) {
        setMessage(error.message);
        setHasError(true);
      } else {
        setMessage('Profile updated successfully!');
      }
    } catch {
      setMessage('Unable to update your profile. Please try again.');
      setHasError(true);
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    if (signingOut) return;

    setSigningOut(true);
    setMessage('');
    setHasError(false);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        setMessage(error.message);
        setHasError(true);
        return;
      }

      router.replace('/login');
      router.refresh();
    } catch {
      setMessage('Unable to sign out. Please try again.');
      setHasError(true);
    } finally {
      setSigningOut(false);
    }
  }

  const backgroundStyle = {
    backgroundImage:
      "linear-gradient(rgba(36, 16, 63, 0.78), rgba(36, 16, 63, 0.88)), url('/images/worship-background.jpg')",
  };

  if (loading) {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-cover bg-center text-white"
        style={backgroundStyle}
      >
        Loading profile...
      </main>
    );
  }

  const initial = name.trim()
    ? Array.from(name.trim())[0].toLocaleUpperCase()
    : '♪';

  return (
    <main
      className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat text-white"
      style={backgroundStyle}
    >
      <header className="border-b border-white/15 bg-[#24103F]/75 px-5 py-4 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="text-xl font-bold">
            <span className="text-[#D8B66C]">Worship</span>Verse
          </Link>

          <Link
            href="/"
            className="rounded-xl border border-[#D8B66C]/50 px-4 py-2 text-sm font-semibold text-[#F1D99D] transition hover:bg-white/10"
          >
            Home
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D8B66C]">
            Your WorshipVerse Account
          </p>

          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            My Profile
          </h1>

          <p className="mt-2 text-sm text-white/75">
            Manage your personal details and account.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-[#E8E0D2]/70 bg-[#FAF8F4]/95 text-[#24103F] shadow-xl">
          <div className="bg-gradient-to-r from-[#32165C] to-[#65409A] px-6 py-7 text-center text-white sm:px-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#D8B66C] bg-[#FAF8F4] text-3xl font-bold text-[#32165C] shadow-lg">
              {initial}
            </div>

            <h2 className="mt-4 break-words text-xl font-bold">
              {name.trim() || 'WorshipVerse Member'}
            </h2>

            <p className="mt-1 break-all text-sm text-white/75">
              {email}
            </p>

            <span className="mt-3 inline-block rounded-full border border-[#D8B66C]/60 bg-white/10 px-4 py-1.5 text-xs font-semibold text-[#F1D99D]">
              WorshipVerse Member
            </span>
          </div>

          <div className="p-5 sm:p-8">
            <h3 className="text-lg font-bold text-[#32165C]">
              Personal Information
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Update how your name appears on WorshipVerse.
            </p>

            <form onSubmit={saveProfile} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="profile-name"
                  className="mb-2 block text-sm font-semibold"
                >
                  Display Name
                </label>

                <input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  placeholder="Enter your name"
                  autoComplete="name"
                  className="w-full rounded-xl border border-[#E9E1D3] bg-white px-4 py-3 text-sm text-[#24103F] outline-none transition focus:border-[#65409A] focus:ring-2 focus:ring-[#65409A]/15"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-email"
                  className="mb-2 block text-sm font-semibold"
                >
                  Email Address
                </label>

                <input
                  id="profile-email"
                  type="email"
                  value={email}
                  readOnly
                  className="w-full rounded-xl border border-[#E9E1D3] bg-gray-100 px-4 py-3 text-sm text-gray-600"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Your registered email address cannot be edited here.
                </p>
              </div>

              {message && (
                <p
                  role={hasError ? 'alert' : 'status'}
                  className={`rounded-xl border p-3 text-sm ${
                    hasError
                      ? 'border-red-200 bg-red-50 text-red-700'
                      : 'border-[#D8B66C]/50 bg-[#F4EFF9] text-[#65409A]'
                  }`}
                >
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={saving || signingOut}
                className="w-full rounded-xl bg-[#32165C] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#48247C] disabled:cursor-wait disabled:opacity-60"
              >
                {saving ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </form>

            <div className="mt-8 border-t border-[#E9E1D3] pt-6">
              <h3 className="text-sm font-bold text-[#32165C]">
                Quick Access
              </h3>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Link
                  href="/favourites"
                  className="rounded-xl border border-[#E9E1D3] bg-white px-4 py-4 text-center text-sm font-semibold transition hover:border-[#D8B66C] hover:bg-[#F4EFF9]"
                >
                  ♥ My Favourites
                </Link>

                <Link
                  href="/playlists"
                  className="rounded-xl border border-[#E9E1D3] bg-white px-4 py-4 text-center text-sm font-semibold transition hover:border-[#D8B66C] hover:bg-[#F4EFF9]"
                >
                  ♫ My Playlists
                </Link>

                <Link
                  href="/settings"
                  className="rounded-xl border border-[#E9E1D3] bg-white px-4 py-4 text-center text-sm font-semibold transition hover:border-[#D8B66C] hover:bg-[#F4EFF9]"
                >
                  âš™ Settings
                </Link>
              </div>
            </div>

            <div className="mt-8 border-t border-[#E9E1D3] pt-6">
              <button
                type="button"
                onClick={signOut}
                disabled={signingOut || saving}
                className="w-full rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
              >
                {signingOut ? 'Signing Out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-12 border-t border-white/15 bg-[#24103F]/70 px-5 py-5 text-center text-xs text-white/65">
        © 2026 WorshipVerse
      </footer>
    </main>
  );
}

