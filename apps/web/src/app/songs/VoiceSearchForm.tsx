
'use client';

import { useRouter } from 'next/navigation';
import VoiceSearch from '@/components/VoiceSearch';

type Props = {
  language: 'te' | 'en';
  onTranscript: (transcript: string) => void;
};

export default function VoiceSearchForm({
  language,
  onTranscript,
}: Props) {
  const router = useRouter();

  function handleTranscript(
    transcript: string,
    isFinal: boolean
  ) {
    onTranscript(transcript);

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
    <VoiceSearch
      language={language}
      onTranscript={handleTranscript}
    />
  );
}
