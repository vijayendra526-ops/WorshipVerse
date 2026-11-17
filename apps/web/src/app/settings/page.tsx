
"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAccount() {
      const {
        data,
        error: authError,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (authError || !data.user) {
        router.replace("/login");
        return;
      }

      setEmail(data.user.email ?? "");
      setLoading(false);
    }

    loadAccount();

    return () => {
      active = false;
    };
  }, [router, supabase]);

  async function updateEmail(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (savingEmail) return;

    setMessage("");
    setError("");

    const requestedEmail = newEmail.trim();

    if (!requestedEmail) {
      setError("Please enter your new email address.");
      return;
    }

    if (requestedEmail.toLowerCase() === email.toLowerCase()) {
      setError("Please enter a different email address.");
      return;
    }

    setSavingEmail(true);

    try {
      const { error: updateError } =
        await supabase.auth.updateUser({
          email: requestedEmail,
        });

      if (updateError) {
        setError(updateError.message);
      } else {
        setMessage(
          "Email change requested. Please check your inbox for the confirmation link and follow the instructions."
        );
        setNewEmail("");
      }
    } catch {
      setError("Unable to update email. Please try again.");
    } finally {
      setSavingEmail(false);
    }
  }

  async function updatePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (savingPassword) return;

    setMessage("");
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSavingPassword(true);

    try {
      const { error: updateError } =
        await supabase.auth.updateUser({
          password,
        });

      if (updateError) {
        setError(updateError.message);
      } else {
        setMessage("Password updated successfully.");
        setPassword("");
        setConfirmPassword("");
        setShowPassword(false);
        setShowConfirmPassword(false);
      }
    } catch {
      setError("Unable to update password. Please try again.");
    } finally {
      setSavingPassword(false);
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
        Loading account settings...
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-fixed bg-cover bg-center bg-no-repeat text-white"
      style={backgroundStyle}
    >
      <header className="border-b border-white/15 bg-[#24103F]/75 px-5 py-4 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="text-xl font-bold">
            <span className="text-[#D8B66C]">
              Worship
            </span>
            Verse
          </Link>

          <Link
            href="/profile"
            className="rounded-xl border border-[#D8B66C]/50 px-4 py-2 text-sm font-semibold text-[#F1D99D] transition hover:bg-white/10"
          >
            My Profile
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D8B66C]">
            WorshipVerse Account
          </p>

          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            Account Settings
          </h1>

          <p className="mt-2 text-sm text-white/75">
            Manage your account information and security.
          </p>
        </div>

        {message && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-[#D8B66C]/50 bg-[#FAF8F4] p-4 text-sm text-[#32165C]"
          >
            {message}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="space-y-5">
          <section className="rounded-2xl border border-[#E8E0D2]/70 bg-[#FAF8F4]/95 p-5 text-[#24103F] shadow-xl sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F1E6CC] text-xl text-[#80601F]">
                @
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#32165C]">
                  Account Information
                </h2>
                <p className="text-xs text-gray-500">
                  Your registered email address
                </p>
              </div>
            </div>

            <label
              htmlFor="current-email"
              className="mb-2 block text-sm font-semibold"
            >
              Current Email
            </label>

            <input
              id="current-email"
              type="email"
              value={email}
              readOnly
              className="w-full rounded-xl border border-[#E9E1D3] bg-gray-100 px-4 py-3 text-sm text-gray-600"
            />
          </section>

          <section className="rounded-2xl border border-[#E8E0D2]/70 bg-[#FAF8F4]/95 p-5 text-[#24103F] shadow-xl sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F1E6CC] text-xl text-[#80601F]">
                ✉
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#32165C]">
                  Change Email Address
                </h2>
                <p className="text-xs text-gray-500">
                  Update the email linked to your account
                </p>
              </div>
            </div>

            <form onSubmit={updateEmail} className="space-y-4">
              <div>
                <label
                  htmlFor="new-email"
                  className="mb-2 block text-sm font-semibold"
                >
                  New Email Address
                </label>

                <input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter your new email"
                  autoComplete="email"
                  required
                  className="w-full rounded-xl border border-[#E9E1D3] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#65409A] focus:ring-2 focus:ring-[#65409A]/15"
                />
              </div>

              <button
                type="submit"
                disabled={savingEmail || savingPassword}
                className="rounded-xl bg-[#32165C] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#48247C] disabled:opacity-50"
              >
                {savingEmail ? "Sending..." : "Update Email"}
              </button>
            </form>

            <p className="mt-4 text-xs leading-5 text-gray-500">
              Supabase may require confirmation through your
              current and new email addresses, depending on
              your project's authentication settings.
            </p>
          </section>

          <section className="rounded-2xl border border-[#E8E0D2]/70 bg-[#FAF8F4]/95 p-5 text-[#24103F] shadow-xl sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F1E6CC] text-xl text-[#80601F]">
                🔒
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#32165C]">
                  Change Password
                </h2>
                <p className="text-xs text-gray-500">
                  Keep your account secure
                </p>
              </div>
            </div>

            <form onSubmit={updatePassword} className="space-y-4">
              <div>
                <label
                  htmlFor="new-password"
                  className="mb-2 block text-sm font-semibold"
                >
                  New Password
                </label>

                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    minLength={8}
                    autoComplete="new-password"
                    required
                    className="w-full rounded-xl border border-[#E9E1D3] bg-white px-4 py-3 pr-20 text-sm outline-none transition focus:border-[#65409A] focus:ring-2 focus:ring-[#65409A]/15"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword
                        ? "Hide new password"
                        : "Show new password"
                    }
                    className="absolute inset-y-0 right-3 text-xs font-semibold text-[#65409A] hover:underline"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-2 block text-sm font-semibold"
                >
                  Confirm New Password
                </label>

                <div className="relative">
                  <input
                    id="confirm-password"
                    type={
                      showConfirmPassword ? "text" : "password"
                    }
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    placeholder="Re-enter your new password"
                    minLength={8}
                    autoComplete="new-password"
                    required
                    className="w-full rounded-xl border border-[#E9E1D3] bg-white px-4 py-3 pr-20 text-sm outline-none transition focus:border-[#65409A] focus:ring-2 focus:ring-[#65409A]/15"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirmation password"
                        : "Show confirmation password"
                    }
                    className="absolute inset-y-0 right-3 text-xs font-semibold text-[#65409A] hover:underline"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingPassword || savingEmail}
                className="rounded-xl bg-[#32165C] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#48247C] disabled:opacity-50"
              >
                {savingPassword
                  ? "Updating..."
                  : "Update Password"}
              </button>
            </form>

            <p className="mt-4 text-xs leading-5 text-gray-500">
              Choose a strong, unique password with at least
              8 characters. Supabase may require additional
              verification for sensitive account changes.
            </p>
          </section>
        </div>

        <div className="mt-7 text-center">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm font-semibold text-[#F1D99D] hover:underline"
          >
            ← Back
          </button>
        </div>
      </section>

      <footer className="mt-12 border-t border-white/15 bg-[#24103F]/70 px-5 py-5 text-center text-xs text-white/65">
        © 2026 WorshipVerse
      </footer>
    </main>
  );
}

