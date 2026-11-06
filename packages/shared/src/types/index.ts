
export type SongLanguage = 'te' | 'en';

export interface Song {
  id: string;
  title: string;
  artist?: string;
  language: SongLanguage;
  lyrics: string;
  youtubeUrl?: string;
  createdAt: string;
}

export type UserRole = 'user' | 'premium' | 'admin' | 'super_admin';

export type SubscriptionStatus =
  | 'free'
  | 'active'
  | 'expired'
  | 'cancelled';
