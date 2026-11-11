
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Props = {
  songId: string;
};

export default function FavouriteButton({ songId }: Props) {
  const [supabase] = useState(() => createClient());
  const [userId, setUserId] = useState<string | null>(null);
  const [favourite, setFavourite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadFavourite() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from('favourites')
        .select('id')
        .eq('user_id', user.id)
        .eq('song_id', songId)
        .maybeSingle();

      if (!error) {
        setFavourite(!!data);
      }

      setLoading(false);
    }

    loadFavourite();
  }, [songId, supabase]);

  async function toggleFavourite() {
    if (!userId || saving) return;

    setSaving(true);

    if (favourite) {
      const { error } = await supabase
        .from('favourites')
        .delete()
        .eq('user_id', userId)
        .eq('song_id', songId);

      if (!error) setFavourite(false);
    } else {
      const { error } = await supabase
        .from('favourites')
        .insert({
          user_id: userId,
          song_id: songId,
        });

      if (!error) setFavourite(true);
    }

    setSaving(false);
  }

  return (
    <button
      type="button"
      onClick={toggleFavourite}
      disabled={loading || saving || !userId}
      aria-label={favourite ? 'Remove from favourites' : 'Add to favourites'}
      aria-pressed={favourite}
      title={favourite ? 'Remove from favourites' : 'Add to favourites'}
      className={`rounded-full border px-4 py-2 text-lg transition ${
        favourite
          ? 'border-red-200 bg-red-50 text-red-600'
          : 'border-[#E9E1D3] bg-white text-gray-500 hover:border-red-200 hover:text-red-500'
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {favourite ? '♥' : '♡'}
    </button>
  );
}
