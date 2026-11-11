
import SongDetailClient from '../SongDetailClient';

export const instant = false;

type SongDetailProps = {
  params: Promise<{ id: string }>;
};

export default async function SongDetailPage({
  params,
}: SongDetailProps) {
  const { id } = await params;

  return <SongDetailClient id={id} />;
}
