
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Language = 'en' | 'te';

export default function LoginPage() {
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  const [language, setLanguage] = useState<Language>('te');
  const [isSignup, setIsSignup] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [message, setMessage] = useState('');
  const [hasError, setHasError] = useState(false);

  const isTelugu = language === 'te';

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active) return;

        if (user) {
          const role = user.app_metadata?.role;

          router.replace(
            role === 'admin' || role === 'super_admin'
              ? '/admin'
              : '/'
          );
          return;
        }
      } finally {
        if (active) setCheckingSession(false);
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, [router, supabase]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setMessage('');
    setHasError(false);

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        if (data.session) {
          window.location.assign('/');
        } else {
          setMessage(
            isTelugu
              ? 'à°¨à°®à±‹à°¦à± à°…à°­à±à°¯à°°à±à°¥à°¨ à°…à°‚à°¦à°¿à°‚à°¦à°¿. à°®à±€ à°‡à°®à±†à°¯à°¿à°²à±â€Œà°¨à± à°§à±ƒà°µà±€à°•à°°à°¿à°‚à°šà°‚à°¡à°¿.'
              : 'Registration request received. Please check your email to confirm your account.'
          );
          setPassword('');
        }
      } else {
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (error) throw error;

        const role = data.user.app_metadata?.role;

        window.location.assign(
          role === 'admin' || role === 'super_admin'
            ? '/admin'
            : '/'
        );
      }
    } catch (err) {
      setHasError(true);
      setMessage(
        err instanceof Error
          ? err.message
          : isTelugu
            ? 'à°à°¦à±‹ à°¸à°®à°¸à±à°¯ à°à°°à±à°ªà°¡à°¿à°‚à°¦à°¿. à°®à°³à±à°²à±€ à°ªà±à°°à°¯à°¤à±à°¨à°¿à°‚à°šà°‚à°¡à°¿.'
            : 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    if (loading) return;

    setLoading(true);
    setMessage('');
    setHasError(false);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (err) {
      setHasError(true);
      setMessage(
        err instanceof Error
          ? err.message
          : 'Google Sign-In failed.'
      );
      setLoading(false);
    }
  }

  const backgroundStyle = {
    backgroundImage:
      "linear-gradient(rgba(36, 16, 63, 0.78), rgba(36, 16, 63, 0.88)), url('/images/worship-background.jpg')",
  };

  if (checkingSession) {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-cover bg-center text-white"
        style={backgroundStyle}
      >
        {isTelugu ? 'à°¦à°¯à°šà±‡à°¸à°¿ à°µà±‡à°šà°¿ à°‰à°‚à°¡à°‚à°¡à°¿...' : 'Please wait...'}
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat px-4 py-7 text-white sm:px-6 sm:py-10"
      style={backgroundStyle}
    >
      <div className="mx-auto w-full max-w-md">
        <header className="mb-7 flex items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <Image
              src="/images/worshipverse-logo.png"
              alt="WorshipVerse logo"
              width={48}
              height={48}
              className="rounded-xl object-contain"
            />

            <div className="min-w-0">
              <h1 className="text-lg font-bold tracking-tight sm:text-xl">
                <span className="text-[#D8B66C]">Worship</span>
                Verse
              </h1>

              <p className="text-[10px] tracking-[0.15em] text-[#F1D99D]">
                SHARON A.G. CHURCH
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() =>
              setLanguage(isTelugu ? 'en' : 'te')
            }
            className="shrink-0 rounded-full border border-[#D8B66C]/60 bg-white/10 px-4 py-2 text-xs font-semibold text-[#F1D99D] transition hover:bg-white/20"
          >
            {isTelugu ? 'English' : 'à°¤à±†à°²à±à°—à±'}
          </button>
        </header>

        <section className="overflow-hidden rounded-3xl border border-[#E8E0D2]/70 bg-[#FAF8F4]/95 text-[#24103F] shadow-2xl">
          <div className="relative h-36 overflow-hidden sm:h-44">
            <Image
              src="/images/worshipverse-hero-artwork.png"
              alt="WorshipVerse worship artwork"
              fill
              sizes="(max-width: 640px) 100vw, 448px"
              className="object-cover"
              priority
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#24103F]/85 via-[#24103F]/25 to-transparent" />

            <div className="absolute bottom-4 left-5 right-5 text-white sm:left-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#F1D99D]">
                {isTelugu
                  ? 'à°†à°°à°¾à°§à°¨ â€¢ à°¸à±à°¤à±à°¤à°¿ â€¢ à°—à±€à°¤à°¾à°²à±'
                  : 'WORSHIP â€¢ PRAISE â€¢ SONGS'}
              </p>

              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                {isSignup
                  ? isTelugu
                    ? 'à°–à°¾à°¤à°¾ à°¸à±ƒà°·à±à°Ÿà°¿à°‚à°šà°‚à°¡à°¿'
                    : 'Create Account'
                  : isTelugu
                    ? 'à°¤à°¿à°°à°¿à°—à°¿ à°¸à±à°µà°¾à°—à°¤à°‚'
                    : 'Welcome Back'}
              </h2>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            <p className="mb-6 text-center text-sm text-gray-600">
              {isSignup
                ? isTelugu
                  ? 'WorshipVerse à°²à±‹ à°®à±€ à°ªà±à°°à°¯à°¾à°£à°¾à°¨à±à°¨à°¿ à°ªà±à°°à°¾à°°à°‚à°­à°¿à°‚à°šà°‚à°¡à°¿.'
                  : 'Create your account and join WorshipVerse.'
                : isTelugu
                  ? 'à°®à±€ à°†à°°à°¾à°§à°¨ à°ªà±à°°à°¯à°¾à°£à°¾à°¨à±à°¨à°¿ à°•à±Šà°¨à°¸à°¾à°—à°¿à°‚à°šà°‚à°¡à°¿.'
                  : 'Sign in to continue your worship journey.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-2 block text-sm font-semibold text-[#32165C]"
                >
                  {isTelugu ? 'à°‡à°®à±†à°¯à°¿à°²à±' : 'Email Address'}
                </label>

                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-[#E9E1D3] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#65409A] focus:ring-2 focus:ring-[#65409A]/15"
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="mb-2 block text-sm font-semibold text-[#32165C]"
                >
                  {isTelugu ? 'à°ªà°¾à°¸à±â€Œà°µà°°à±à°¡à±' : 'Password'}
                </label>

                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete={
                      isSignup
                        ? 'new-password'
                        : 'current-password'
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      isTelugu
                        ? 'à°®à±€ à°ªà°¾à°¸à±â€Œà°µà°°à±à°¡à± à°¨à°®à±‹à°¦à± à°šà±‡à°¯à°‚à°¡à°¿'
                        : 'Enter your password'
                    }
                    className="w-full rounded-xl border border-[#E9E1D3] bg-white px-4 py-3 pr-20 text-sm outline-none transition focus:border-[#65409A] focus:ring-2 focus:ring-[#65409A]/15"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                    className="absolute inset-y-0 right-3 text-xs font-semibold text-[#65409A] hover:underline"
                  >
                    {showPassword
                      ? isTelugu
                        ? 'à°¦à°¾à°šà±'
                        : 'Hide'
                      : isTelugu
                        ? 'à°šà±‚à°ªà±'
                        : 'Show'}
                  </button>
                </div>
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
                disabled={loading}
                className="w-full rounded-xl bg-[#32165C] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#48247C] disabled:opacity-60"
              >
                {loading
                  ? isTelugu
                    ? 'à°¦à°¯à°šà±‡à°¸à°¿ à°µà±‡à°šà°¿ à°‰à°‚à°¡à°‚à°¡à°¿...'
                    : 'Please wait...'
                  : isSignup
                    ? isTelugu
                      ? 'à°–à°¾à°¤à°¾ à°¸à±ƒà°·à±à°Ÿà°¿à°‚à°šà°‚à°¡à°¿'
                      : 'Create Account'
                    : isTelugu
                      ? 'à°²à°¾à°—à°¿à°¨à±'
                      : 'Sign In'}
              </button>
            </form>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-[#E9E1D3]" />
              <span className="text-xs text-gray-500">
                {isTelugu ? 'à°²à±‡à°¦à°¾' : 'OR'}
              </span>
              <div className="h-px flex-1 bg-[#E9E1D3]" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#E9E1D3] bg-white px-5 py-3 text-sm font-semibold text-[#32165C] transition hover:bg-[#F4EFF9] disabled:opacity-60"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-lg font-bold text-[#4285F4]">
                G
              </span>
              {isTelugu
                ? 'Google à°¤à±‹ à°•à±Šà°¨à°¸à°¾à°—à°¿à°‚à°šà°‚à°¡à°¿'
                : 'Continue with Google'}
            </button>

            <p className="mt-6 text-center text-sm text-gray-600">
              {isSignup
                ? isTelugu
                  ? 'à°‡à°ªà±à°ªà°Ÿà°¿à°•à±‡ à°–à°¾à°¤à°¾ à°‰à°‚à°¦à°¾?'
                  : 'Already have an account?'
                : isTelugu
                  ? 'à°–à°¾à°¤à°¾ à°²à±‡à°¦à°¾?'
                  : "Don't have an account?"}{' '}

              <button
                type="button"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setMessage('');
                  setHasError(false);
                  setPassword('');
                  setShowPassword(false);
                }}
                className="font-bold text-[#65409A] hover:underline"
              >
                {isSignup
                  ? isTelugu
                    ? 'à°²à°¾à°—à°¿à°¨à± à°šà±‡à°¯à°‚à°¡à°¿'
                    : 'Sign In'
                  : isTelugu
                    ? 'à°¨à°®à±‹à°¦à± à°šà±‡à°¸à±à°•à±‹à°‚à°¡à°¿'
                    : 'Create Account'}
              </button>
            </p>

            <div className="mt-5 text-center">
              <Link
                href="/"
                className="text-xs font-semibold text-[#65409A] hover:underline"
              >
                {isTelugu
                  ? 'à°²à°¾à°—à°¿à°¨à± à°²à±‡à°•à±à°‚à°¡à°¾ à°ªà°¾à°Ÿà°²à°¨à± à°šà±‚à°¡à°‚à°¡à°¿'
                  : 'Browse songs without signing in'}
              </Link>
            </div>
          </div>
        </section>

        <p className="mt-7 text-center text-xs text-[#F1D99D]">
          Every Song, A Prayer. Every Verse, A Praise.
        </p>

        <p className="mt-2 text-center text-xs text-white/60">
          Â© 2026 WorshipVerse Â· SHARON A.G. CHURCH
        </p>
      </div>
    </main>
  );
}

