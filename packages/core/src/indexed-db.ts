import { openDB, type IDBPDatabase } from "idb"

const DB_NAME = "imify-storage"
const STORE_NAME = "watermarks"
const DB_VERSION = 2

export interface FontStorageEntry {
  id: string           // 'roboto-700', 'my-custom-font'
  name: string         // 'Roboto'
  fileName: string     // 'roboto-bold.woff2'
  source: 'google' | 'custom'
  weight: number       // 700, 900, etc.
  data: ArrayBuffer    // WOFF2 binary data
  fileSize: number     // bytes
  addedAt: number      // timestamp
}

interface ImifyDBSchema {
  watermarks: {
    key: string
    value: {
      id: string
      blob: Blob
      updatedAt: number
    }
  }
  fonts: {
    key: string
    value: FontStorageEntry
  }
}

let dbPromise: Promise<IDBPDatabase<ImifyDBSchema>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ImifyDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" })
        }
        if (!db.objectStoreNames.contains("fonts")) {
          db.createObjectStore("fonts", { keyPath: "id" })
        }
      }
    })
  }
  return dbPromise
}

export const watermarkStorage = {
  async save(id: string, blob: Blob): Promise<void> {
    const db = await getDB()
    await db.put(STORE_NAME, {
      id,
      blob,
      updatedAt: Date.now()
    })
  },

  async get(id: string): Promise<Blob | null> {
    const db = await getDB()
    const entry = await db.get(STORE_NAME, id)
    return entry?.blob || null
  },

  async remove(id: string): Promise<void> {
    const db = await getDB()
    await db.delete(STORE_NAME, id)
  },

  async clear(): Promise<void> {
    const db = await getDB()
    await db.clear(STORE_NAME)
  }
}

export const fontStorage = {
  async save(entry: FontStorageEntry): Promise<void> {
    const db = await getDB()
    await db.put("fonts", entry)
  },

  async get(id: string): Promise<FontStorageEntry | null> {
    const db = await getDB()
    const entry = await db.get("fonts", id)
    return entry || null
  },

  async getAll(): Promise<FontStorageEntry[]> {
    const db = await getDB()
    return db.getAll("fonts")
  },

  async remove(id: string): Promise<void> {
    const db = await getDB()
    await db.delete("fonts", id)
  },

  async clear(): Promise<void> {
    const db = await getDB()
    await db.clear("fonts")
  }
}

