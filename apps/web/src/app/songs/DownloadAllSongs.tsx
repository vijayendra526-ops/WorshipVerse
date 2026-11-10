
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  saveAllSongs,
  type OfflineSong,
} from '@/lib/offline/song-storage';

export default function DownloadAllSongs() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function downloadSongs() {
    setLoading(true);
    setMessage('');

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Please sign in to download songs.');
      }

      const allSongs: OfflineSong[] = [];
      const pageSize = 500;
      let offset = 0;

      while (true) {
        const { data, error } = await supabase
          .from('songs')
          .select(
            'id, title, artist, language, lyrics, youtube_url, created_at'
          )
          .in('language', ['te', 'en'])
          .order('created_at', { ascending: false })
          .range(offset, offset + pageSize - 1);

        if (error) throw error;

        const batch = (data ?? []) as OfflineSong[];
        allSongs.push(...batch);

        setMessage(`Preparing songs... ${allSongs.length} downloaded`);

        if (batch.length < pageSize) break;

        offset += pageSize;
      }

      await saveAllSongs(allSongs);

      setMessage(
        allSongs.length > 0
          ? `Success! ${allSongs.length} songs saved for offline use.`
          : 'No published songs found.'
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to download songs. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-[#E8E0D2] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-[#32165C]">
        Offline Song Library
      </h2>

      <p className="mt-2 text-sm text-gray-600">
        Download all published Telugu and English songs to this device.
      </p>

      <button
        type="button"
        onClick={downloadSongs}
        disabled={loading}
        className="mt-4 rounded-xl bg-[#32165C] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#24103F] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Downloading...' : 'Download All Songs'}
      </button>

      {message && (
        <p className="mt-3 text-sm text-[#65409A]" aria-live="polite">
          {message}
        </p>
      )}
    </div>
  );
}
