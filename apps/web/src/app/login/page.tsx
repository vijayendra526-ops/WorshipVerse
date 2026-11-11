'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

useEffect(() => {
  let active = true;

  async function checkSession() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!active || !user) return;

    const role = user.app_metadata?.role;

    router.replace(
      role === 'admin' || role === 'super_admin'
        ? '/admin'
        : '/'
    );
  }

  checkSession();

  return () => {
    active = false;
  };
}, [router, supabase]);

  const [language, setLanguage] = useState<'en' | 'te'>('en');
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const isTelugu = language === 'te';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          window.location.href = '/';
        } else {
          setMessage(
            isTelugu
              ? 'నమోదు విజయవంతమైంది. మీ ఇమెయిల్‌ను ధృవీకరించండి.'
              : 'Account created. Please check your email to confirm your account.'
          );
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (error) throw error;

const role = data.user.app_metadata?.role;

if (role === 'admin' || role === 'super_admin') {
  window.location.href = '/admin';
} else {
  window.location.href = '/';
}
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Google Sign-In failed.'
      );
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAF8F4] px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-7 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <Image
              src="/images/worshipverse-logo.png"
              alt="WorshipVerse logo"
              width={52}
              height={52}
              className="rounded-xl object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-[#32165C]">
                WorshipVerse
              </h1>
              <p className="text-[10px] tracking-[0.2em] text-[#98712F]">
                SHARON A.G. CHURCH
              </p>
            </div>
          </a>

          <button
            type="button"
            onClick={() =>
              setLanguage(isTelugu ? 'en' : 'te')
            }
            className="rounded-full border border-[#D8B66C] px-4 py-2 text-sm font-semibold text-[#65409A]"
          >
            {isTelugu ? 'English' : 'తెలుగు'}
          </button>
        </div>

        <section className="rounded-3xl border border-[#E9E1D3] bg-white p-7 shadow-xl sm:p-9">
          <div className="mb-8 text-center">
            <div className="mb-4 text-4xl text-[#A17B38]">♫</div>

            <p className="text-xs font-bold tracking-[0.22em] text-[#A17B38]">
              {isTelugu ? 'ఆరాధన • స్తుతి • గీతాలు' : 'WORSHIP • PRAISE • SONGS'}
            </p>

            <h2 className="mt-3 text-3xl font-bold text-[#32165C]">
              {isSignup
                ? isTelugu
                  ? 'ఖాతా సృష్టించండి'
                  : 'Create Account'
                : isTelugu
                  ? 'తిరిగి స్వాగతం'
                  : 'Welcome Back'}
            </h2>

            <p className="mt-3 text-sm text-gray-500">
              {isSignup
                ? isTelugu
                  ? 'WorshipVerse లో మీ ప్రయాణాన్ని ప్రారంభించండి.'
                  : 'Create your account and join WorshipVerse.'
                : isTelugu
                  ? 'మీ ఆరాధన ప్రయాణాన్ని కొనసాగించండి.'
                  : 'Sign in to continue your worship journey.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#32165C]">
                {isTelugu ? 'ఇమెయిల్' : 'Email Address'}
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[#E9E1D3] bg-[#FAF8F4] px-4 py-3 text-sm text-[#24103F] outline-none transition focus:border-[#65409A] focus:ring-2 focus:ring-[#65409A]/15"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#32165C]">
                {isTelugu ? 'పాస్‌వర్డ్' : 'Password'}
              </label>
              <input
                type="password"
                required
                minLength={6}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isTelugu ? 'మీ పాస్‌వర్డ్ నమోదు చేయండి' : 'Enter your password'}
                className="w-full rounded-xl border border-[#E9E1D3] bg-[#FAF8F4] px-4 py-3 text-sm text-[#24103F] outline-none transition focus:border-[#65409A] focus:ring-2 focus:ring-[#65409A]/15"
              />
            </div>

            {message && (
              <p
                role="status"
                className="rounded-xl bg-[#F4EFFA] p-3 text-sm text-[#65409A]"
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#32165C] px-5 py-3.5 font-bold text-white transition hover:bg-[#48247C] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? isTelugu
                  ? 'దయచేసి వేచి ఉండండి...'
                  : 'Please wait...'
                : isSignup
                  ? isTelugu
                    ? 'ఖాతా సృష్టించండి'
                    : 'Create Account'
                  : isTelugu
                    ? 'లాగిన్'
                    : 'Sign In'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-[#E9E1D3]" />
            <span className="text-xs text-gray-400">
              {isTelugu ? 'లేదా' : 'OR'}
            </span>
            <div className="h-px flex-1 bg-[#E9E1D3]" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#E9E1D3] bg-white px-5 py-3 font-semibold text-[#32165C] transition hover:bg-[#FAF8F4] disabled:opacity-60"
          >
            <span className="text-lg font-bold">G</span>
            {isTelugu ? 'Google తో కొనసాగించండి' : 'Continue with Google'}
          </button>

          <p className="mt-7 text-center text-sm text-gray-500">
            {isSignup
              ? isTelugu
                ? 'ఇప్పటికే ఖాతా ఉందా?'
                : 'Already have an account?'
              : isTelugu
                ? 'ఖాతా లేదా?'
                : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup);
                setMessage('');
              }}
              className="font-bold text-[#65409A] hover:underline"
            >
              {isSignup
                ? isTelugu
                  ? 'లాగిన్ చేయండి'
                  : 'Sign In'
                : isTelugu
                  ? 'నమోదు చేసుకోండి'
                  : 'Create Account'}
            </button>
          </p>
        </section>

        <p className="mt-7 text-center text-xs text-gray-400">
          Every Song, A Prayer. Every Verse, A Praise.
        </p>

        <p className="mt-2 text-center text-xs text-gray-400">
          © 2026 WorshipVerse · SHARON A.G. CHURCH
        </p>
      </div>
    </main>
  );
}