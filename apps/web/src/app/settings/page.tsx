
"use client";

import { useEffect, useState } from "react";
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
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAccount() {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.replace("/login");
        return;
      }

      setEmail(data.user.email ?? "");
      setLoading(false);
    }

    loadAccount();
  }, [router, supabase]);

  async function updateEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!newEmail.trim()) {
      setError("Please enter your new email address.");
      return;
    }

    setSavingEmail(true);

    const { error } = await supabase.auth.updateUser({
      email: newEmail.trim(),
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Confirmation email sent. Please check your inbox to complete the email change.");
      setNewEmail("");
    }

    setSavingEmail(false);
  }

  async function updatePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
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

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Password updated successfully.");
      setPassword("");
      setConfirmPassword("");
    }

    setSavingPassword(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAF8F4] p-8 text-[#32165C]">
        Loading account settings...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF8F4] px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => router.back()}
          className="mb-6 text-sm font-medium text-[#32165C] hover:underline"
        >
          ← Back
        </button>

        <h1 className="mb-2 text-3xl font-bold text-[#32165C]">
          Account Settings
        </h1>
        <p className="mb-8 text-gray-600">
          Manage your WorshipVerse account information and security.
        </p>

        {message && (
          <div className="mb-5 rounded-lg bg-green-100 p-4 text-sm text-green-800">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-lg bg-red-100 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mb-6 rounded-xl border border-[#E7DCC7] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-[#32165C]">
            Account Information
          </h2>

          <label className="mb-2 block text-sm font-medium text-gray-700">
            Current email address
          </label>
          <input
            type="email"
            value={email}
            readOnly
            className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-gray-700"
          />
        </section>

        <section className="mb-6 rounded-xl border border-[#E7DCC7] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-[#32165C]">
            Change Email Address
          </h2>

          <form onSubmit={updateEmail} className="space-y-4">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter new email address"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#32165C]"
            />

            <button
              type="submit"
              disabled={savingEmail}
              className="rounded-lg bg-[#32165C] px-5 py-3 font-medium text-white hover:bg-[#24103F] disabled:opacity-50"
            >
              {savingEmail ? "Sending..." : "Update Email"}
            </button>
          </form>
          <p className="mt-3 text-xs text-gray-500">
            A confirmation email will be sent to your new address. Please check your inbox to complete the change.
          </p>
        </section>

        <section className="rounded-xl border border-[#E7DCC7] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-[#32165C]">
            Change Password
          </h2>

          <form onSubmit={updatePassword} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password (minimum 8 characters)"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#32165C]"
            />

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#32165C]"
            />

            <button
              type="submit"
              disabled={savingPassword}
              className="rounded-lg bg-[#32165C] px-5 py-3 font-medium text-white hover:bg-[#24103F] disabled:opacity-50"
            >
              {savingPassword ? "Updating..." : "Update Password"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
