
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import VoiceSearch from '@/components/VoiceSearch';

type Props = {
  language: 'te' | 'en';
  initialQuery: string;
};

export default function VoiceSearchForm({
  language,
  initialQuery,
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  function handleTranscript(transcript: string, isFinal: boolean) {
    setQuery(transcript);

    if (isFinal && transcript.trim()) {
      const params = new URLSearchParams();

      params.set('language', language);
      params.set('q', transcript.trim());

      router.replace(`/songs?${params.toString()}`, {
        scroll: false,
      });
    }
  }

  return (
    <div>
      <form
        action="/songs"
        method="GET"
        className="mt-8 flex flex-wrap gap-2"
      >
        <input type="hidden" name="language" value={language} />

        <input
          type="search"
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            language === 'te'
              ? 'పాట పేరు ద్వారా వెతకండి...'
              : 'Search songs by title...'
          }
          className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#32165C]"
        />

        <VoiceSearch
          language={language}
          onTranscript={handleTranscript}
        />

        <button
          type="submit"
          className="rounded-xl bg-[#32165C] px-5 py-3 font-semibold text-white"
        >
          Search
        </button>
      </form>
    </div>
  );
}
