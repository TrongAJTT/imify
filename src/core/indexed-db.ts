import { openDB, type IDBPDatabase } from "idb"

const DB_NAME = "imify-storage"
const STORE_NAME = "watermarks"
const DB_VERSION = 1

interface ImifyDBSchema {
  watermarks: {
    key: string
    value: {
      id: string
      blob: Blob
      updatedAt: number
    }
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
