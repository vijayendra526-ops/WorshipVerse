
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadProfile() {
      const { data: { user }, error } = await supabase.auth.getUser();

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
  }, [router, supabase]);

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const { error } = await supabase.auth.updateUser({
      data: { full_name: name.trim() },
    });

    setSaving(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage('Profile updated successfully!');
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage(error.message);
      return;
    }

    router.replace('/login');
    router.refresh();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAF8F4] text-[#32165C]">
        Loading profile...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF8F4] px-5 py-10 text-[#24103F]">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="font-semibold text-[#65409A] hover:underline">
          ← Back to WorshipVerse
        </Link>

        <section className="mt-8 rounded-3xl border border-[#E9E1D3] bg-white p-7 shadow-lg sm:p-10">
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#F4EFF9] text-3xl font-bold text-[#32165C]">
              {name.trim() ? name.trim()[0].toUpperCase() : '♪'}
            </div>

            <h1 className="mt-4 text-2xl font-bold text-[#32165C]">
              My Profile
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Manage your WorshipVerse account
            </p>
          </div>

          <form onSubmit={saveProfile} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Display Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                placeholder="Enter your name"
                className="w-full rounded-xl border border-[#E9E1D3] bg-[#FAF8F4] px-4 py-3 outline-none focus:border-[#65409A]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Email Address
              </label>
              <input
                value={email}
                readOnly
                className="w-full rounded-xl border border-[#E9E1D3] bg-gray-100 px-4 py-3 text-gray-500"
              />
              <p className="mt-1 text-xs text-gray-400">
                Your registered email address
              </p>
            </div>

            {message && (
              <p role="status" className="rounded-xl bg-[#F4EFF9] p-3 text-sm text-[#65409A]">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-[#32165C] px-5 py-3 font-bold text-white hover:bg-[#48247C] disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>

          <div className="mt-8 border-t border-[#E9E1D3] pt-6">
            <button
              onClick={signOut}
              className="w-full rounded-xl border border-red-200 px-5 py-3 font-semibold text-red-600 hover:bg-red-50"
            >
              Sign Out
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
