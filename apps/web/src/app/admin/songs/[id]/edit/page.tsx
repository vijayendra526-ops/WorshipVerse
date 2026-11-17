
import { Suspense } from 'react';
import { LoaderCircle, Music2 } from 'lucide-react';
import EditSongClient from './EditSongClient';

export default function EditSongPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[75vh] min-w-0 items-center justify-center px-5 py-12 text-white">
          <div
            role="status"
            className="w-full max-w-md rounded-2xl border border-[#D8B66C]/20 bg-[#321950] p-8 text-center shadow-xl"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D8B66C]/10 text-[#D8B66C]">
              <Music2 size={28} />
            </div>

            <h1 className="mt-5 text-xl font-bold">
              Edit Worship Song
            </h1>

            <p className="mt-2 text-sm text-white/55">
              Preparing your song details...
            </p>

            <LoaderCircle
              size={22}
              className="mx-auto mt-6 animate-spin text-[#D8B66C]"
            />

            <span className="sr-only">
              Loading song editor
            </span>
          </div>
        </main>
      }
    >
      <EditSongClient />
    </Suspense>
  );
}
