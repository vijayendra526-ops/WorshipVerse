
import * as SQLite from 'expo-sqlite';
import { supabase } from './supabase';

export type OfflineSong = {
  id: string;
  title: string;
  artist: string | null;
  language: string;
  lyrics: string;
  lyrics_transliteration: string | null;
  youtube_url: string | null;
};

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('worshipverse.db');
  }

  const db = await databasePromise;

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS offline_songs (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      artist TEXT,
      language TEXT NOT NULL,
      lyrics TEXT NOT NULL,
      lyrics_transliteration TEXT,
      youtube_url TEXT
    );
  `);

  return db;
}

// Get songs saved on this device
export async function getOfflineSongs(
  language?: 'te' | 'en'
): Promise<OfflineSong[]> {
  const db = await getDatabase();

  if (language) {
    return db.getAllAsync<OfflineSong>(
      `SELECT * FROM offline_songs
       WHERE language = ?
       ORDER BY title COLLATE NOCASE ASC`,
      language
    );
  }

  return db.getAllAsync<OfflineSong>(
    `SELECT * FROM offline_songs
     ORDER BY title COLLATE NOCASE ASC`
  );
}

// Download all songs from Supabase and save them locally
export async function syncOfflineSongs(): Promise<OfflineSong[]> {
  const { data, error } = await supabase
    .from('songs')
    .select(
      'id, title, artist, language, lyrics, lyrics_transliteration, youtube_url'
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const songs = (data ?? []) as OfflineSong[];
  const db = await getDatabase();

  // Replace the local library only after Supabase returns successfully.
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM offline_songs');

    for (const song of songs) {
      await db.runAsync(
        `INSERT INTO offline_songs (
          id,
          title,
          artist,
          language,
          lyrics,
          lyrics_transliteration,
          youtube_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        song.id,
        song.title,
        song.artist,
        song.language,
        song.lyrics,
        song.lyrics_transliteration,
        song.youtube_url
      );
    }
  });

  return songs;
}
