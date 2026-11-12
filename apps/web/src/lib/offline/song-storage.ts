
export type OfflineSong = {
  id: string;
  title: string;
  artist: string | null;
  language: 'te' | 'en';
  lyrics: string;
  lyrics_transliteration?: string | null;
  youtube_url: string | null;
  created_at: string;
};

const DB_NAME = 'worshipverse-offline';
const STORE_NAME = 'songs';
const DB_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (
      typeof window === 'undefined' ||
      !('indexedDB' in window)
    ) {
      reject(new Error('Offline storage is not supported.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
        });

        store.createIndex('language', 'language', {
          unique: false,
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Save or update songs without deleting existing downloads.
export async function saveSongs(
  songs: OfflineSong[],
): Promise<void> {
  if (songs.length === 0) return;

  const db = await openDatabase();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      for (const song of songs) {
        store.put(song);
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

// Save one song without deleting other songs.
export async function saveSong(
  song: OfflineSong,
): Promise<void> {
  await saveSongs([song]);
}

// Download and replace the complete offline library.
export async function saveAllSongs(
  songs: OfflineSong[],
): Promise<void> {
  const db = await openDatabase();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      store.clear();

      for (const song of songs) {
        store.put(song);
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

// Get all downloaded songs.
export async function getAllOfflineSongs(): Promise<OfflineSong[]> {
  const db = await openDatabase();

  try {
    return await new Promise((resolve, reject) => {
      const request = db
        .transaction(STORE_NAME, 'readonly')
        .objectStore(STORE_NAME)
        .getAll();

      request.onsuccess = () =>
        resolve(request.result as OfflineSong[]);

      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

// Get one downloaded song by ID.
export async function getOfflineSong(
  id: string,
): Promise<OfflineSong | null> {
  const db = await openDatabase();

  try {
    return await new Promise((resolve, reject) => {
      const request = db
        .transaction(STORE_NAME, 'readonly')
        .objectStore(STORE_NAME)
        .get(id);

      request.onsuccess = () =>
        resolve((request.result as OfflineSong) ?? null);

      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

// Remove all downloaded songs.
export async function removeAllOfflineSongs(): Promise<void> {
  const db = await openDatabase();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');

      transaction.objectStore(STORE_NAME).clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}
