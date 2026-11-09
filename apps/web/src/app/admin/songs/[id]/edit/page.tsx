import { Suspense } from 'react';
import EditSongClient from './EditSongClient';

export default function EditSongPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#FAF8F4]">
          <p className="font-semibold text-[#32165C]">
            Loading song editor...
          </p>
        </main>
      }
    >
      <EditSongClient />
    </Suspense>
  );
}
