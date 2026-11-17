
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { House, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import AdminNav from './AdminNav';

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Required for request-specific Supabase authentication.
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  const role = user.app_metadata?.role;

  if (role !== 'admin' && role !== 'super_admin') {
    redirect('/');
  }

  return (
    <div
      className="min-h-screen text-white"
      style={{
        backgroundColor: '#24103F',
        backgroundImage:
          "linear-gradient(120deg, rgba(27,11,49,0.97), rgba(43,19,72,0.94)), url('/images/worship-background.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div
        className="mx-auto min-h-screen max-w-[1600px]"
        style={{
          display: 'grid',
          gridTemplateColumns:
            'clamp(76px, 19vw, 250px) minmax(0, 1fr)',
        }}
      >
        {/* Permanent sidebar */}
        <aside
          className="min-w-0 border-r border-white/10 bg-[#190C2D]/95"
          style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Branding */}
          <Link
            href="/admin"
            className="flex items-center justify-center gap-3 px-2 py-7 md:justify-start md:px-5"
          >
            <Image
              src="/images/worshipverse-logo.png"
              alt="WorshipVerse"
              width={44}
              height={44}
              className="rounded-xl"
            />

            <div className="hidden md:block">
              <p className="font-bold">
                <span className="text-[#D8B66C]">
                  Worship
                </span>
                Verse
              </p>

              <p className="text-[10px] uppercase tracking-widest text-white/40">
                Administration
              </p>
            </div>
          </Link>

          <div className="mx-4 border-t border-white/10" />

          {/* Active navigation */}
          <Suspense
            fallback={
              <div className="mt-7 px-4 text-xs text-white/40">
                Loading navigation...
              </div>
            }
          >
            <AdminNav />
          </Suspense>

          {/* Footer */}
          <div className="mt-auto px-2 pb-6 md:px-4">
            <div className="hidden rounded-xl border border-white/10 bg-white/5 p-4 md:block">
              <div className="flex items-center gap-2 text-[#D8B66C]">
                <ShieldCheck size={17} />

                <span className="text-xs font-semibold">
                  {role === 'super_admin'
                    ? 'Super Administrator'
                    : 'Administrator'}
                </span>
              </div>

              <p className="mt-3 break-all text-xs text-white/50">
                {user.email}
              </p>
            </div>

            <Link
              href="/"
              title="View Website"
              className="mt-4 flex items-center justify-center gap-3 rounded-xl px-2 py-3 text-white/60 transition hover:bg-white/10 hover:text-white md:justify-start md:px-4"
            >
              <House size={18} className="shrink-0" />

              <span className="hidden text-sm md:inline">
                View Website
              </span>
            </Link>
          </div>
        </aside>

        {/* Admin page content */}
        <div className="min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}

export const instant = false;
