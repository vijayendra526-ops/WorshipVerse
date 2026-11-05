export type SongLanguage = 'te' | 'en' | 'hi';

export interface Song {
  id: string;
  title: string;
  language: SongLanguage;
  lyrics: string;
  youtubeUrl?: string;
  createdAt: string;
}

export type UserRole = 'user' | 'admin' | 'super_admin';

export type SubscriptionStatus =
  | 'free'
  | 'active'
  | 'expired'
  | 'cancelled';
