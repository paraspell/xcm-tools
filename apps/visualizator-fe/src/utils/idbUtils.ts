import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface SkyboxDB extends DBSchema {
  images: {
    key: string;
    value: string; // Base64 encoded image data
  };
}

const initDB = async (): Promise<IDBPDatabase<SkyboxDB>> => {
  return openDB<SkyboxDB>('SkyboxDB', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('images')) {
        db.createObjectStore('images');
      }
    }
  });
};

export const saveImageToDB = async (key: string, image: string): Promise<void> => {
  const db = await initDB();
  await db.put('images', image, key);
};

export const loadImageFromDB = async (key: string): Promise<string | undefined> => {
  const db = await initDB();
  return db.get('images', key);
};
