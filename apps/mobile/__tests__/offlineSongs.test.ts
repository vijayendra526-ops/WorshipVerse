import * as SQLite from 'expo-sqlite';
import { supabase } from '../src/lib/supabase';
import {
  getOfflineSongs,
  syncOfflineSongs,
} from '../src/lib/offlineSongs';

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

jest.mock('../src/lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

const song = {
  id: 'song-1',
  title: 'యేసు ప్రేమ',
  artist: null,
  language: 'te',
  lyrics: 'తెలుగు పాట',
  lyrics_transliteration: 'Yesu Prema',
  youtube_url: null,
};

const db = {
  execAsync: jest.fn(),
  getAllAsync: jest.fn(),
  runAsync: jest.fn(),
  withTransactionAsync: jest.fn(),
};

const mockOpenDatabase = SQLite.openDatabaseAsync as jest.Mock;
const mockFrom = supabase.from as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();

  mockOpenDatabase.mockResolvedValue(db);
  db.execAsync.mockResolvedValue(undefined);
  db.getAllAsync.mockResolvedValue([song]);
  db.runAsync.mockResolvedValue({ changes: 1 });

  db.withTransactionAsync.mockImplementation(
    async (callback: () => Promise<void>) => {
      await callback();
    }
  );
});

function mockSupabaseResponse(data: unknown, error: unknown = null) {
  const order = jest.fn().mockResolvedValue({ data, error });
  const select = jest.fn().mockReturnValue({ order });

  mockFrom.mockReturnValue({ select });

  return { select, order };
}

describe('WorshipVerse offline lyrics', () => {
  test('creates the offline songs table', async () => {
    await getOfflineSongs();

    expect(db.execAsync).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE IF NOT EXISTS offline_songs')
    );
  });

  test('reads locally cached songs', async () => {
    const result = await getOfflineSongs();

    expect(result).toEqual([song]);
    expect(db.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM offline_songs')
    );
  });

  test('filters cached songs by language', async () => {
    await getOfflineSongs('te');

    expect(db.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('WHERE language = ?'),
      'te'
    );
  });

  test('synchronizes songs from Supabase to SQLite', async () => {
    mockSupabaseResponse([song]);

    const result = await syncOfflineSongs();

    expect(result).toEqual([song]);
    expect(mockFrom).toHaveBeenCalledWith('songs');
    expect(db.withTransactionAsync).toHaveBeenCalledTimes(1);

    expect(db.runAsync).toHaveBeenNthCalledWith(
      1,
      'DELETE FROM offline_songs'
    );

    expect(db.runAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO offline_songs'),
      song.id,
      song.title,
      song.artist,
      song.language,
      song.lyrics,
      song.lyrics_transliteration,
      song.youtube_url
    );
  });

  test('does not erase cached songs when Supabase fails', async () => {
    const error = new Error('Network unavailable');
    mockSupabaseResponse(null, error);

    await expect(syncOfflineSongs()).rejects.toThrow(
      'Network unavailable'
    );

    expect(db.runAsync).not.toHaveBeenCalled();
    expect(db.withTransactionAsync).not.toHaveBeenCalled();
  });

  test('propagates SQLite insertion errors', async () => {
    mockSupabaseResponse([song]);

    db.runAsync
      .mockResolvedValueOnce({ changes: 1 })
      .mockRejectedValueOnce(new Error('SQLite insert failed'));

    await expect(syncOfflineSongs()).rejects.toThrow(
      'SQLite insert failed'
    );
  });

  test('an empty successful sync clears the local library', async () => {
    mockSupabaseResponse([]);

    const result = await syncOfflineSongs();

    expect(result).toEqual([]);
    expect(db.runAsync).toHaveBeenCalledTimes(1);
    expect(db.runAsync).toHaveBeenCalledWith(
      'DELETE FROM offline_songs'
    );
  });
});
