
import SongsLibraryClient from './SongsLibraryClient';

export const instant = false;

type SongsPageProps = {
  searchParams: Promise<{
    language?: string;
    q?: string;
  }>;
};

export default async function SongsPage({
  searchParams,
}: SongsPageProps) {
  const { language, q } = await searchParams;

  const selectedLanguage = language === 'te' ? 'te' : 'en';

  return (
    <SongsLibraryClient
      language={selectedLanguage}
      search={q?.trim() ?? ''}
    />
  );
}
