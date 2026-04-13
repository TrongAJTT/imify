import { openDB, type IDBPDatabase } from "idb"
import type { FillingTemplate } from "@/features/filling/types"

const DB_NAME = "imify-filling-storage"
const TEMPLATES_STORE = "templates"
const THUMBNAILS_STORE = "thumbnails"
const DB_VERSION = 1

interface FillingDBSchema {
  templates: {
    key: string
    value: FillingTemplate
  }
  thumbnails: {
    key: string
    value: {
      id: string
      blob: Blob
      updatedAt: number
    }
  }
}

let dbPromise: Promise<IDBPDatabase<FillingDBSchema>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<FillingDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(TEMPLATES_STORE)) {
          db.createObjectStore(TEMPLATES_STORE, { keyPath: "id" })
        }
        if (!db.objectStoreNames.contains(THUMBNAILS_STORE)) {
          db.createObjectStore(THUMBNAILS_STORE, { keyPath: "id" })
        }
      },
    })
  }
  return dbPromise
}

export const templateStorage = {
  async getAll(): Promise<FillingTemplate[]> {
    const db = await getDB()
    return db.getAll(TEMPLATES_STORE)
  },

  async get(id: string): Promise<FillingTemplate | undefined> {
    const db = await getDB()
    return db.get(TEMPLATES_STORE, id)
  },

  async save(template: FillingTemplate): Promise<void> {
    const db = await getDB()
    await db.put(TEMPLATES_STORE, template)
  },

  async remove(id: string): Promise<void> {
    const db = await getDB()
    await db.delete(TEMPLATES_STORE, id)
    await db.delete(THUMBNAILS_STORE, id).catch(() => {})
  },

  async saveThumbnail(id: string, blob: Blob): Promise<void> {
    const db = await getDB()
    await db.put(THUMBNAILS_STORE, { id, blob, updatedAt: Date.now() })
  },

  async getThumbnail(id: string): Promise<Blob | null> {
    const db = await getDB()
    const entry = await db.get(THUMBNAILS_STORE, id)
    return entry?.blob ?? null
  },

  async incrementUsage(id: string): Promise<void> {
    const db = await getDB()
    const template = await db.get(TEMPLATES_STORE, id)
    if (!template) return
    template.usageCount += 1
    template.lastUsedAt = Date.now()
    await db.put(TEMPLATES_STORE, template)
  },

  async togglePin(id: string): Promise<boolean> {
    const db = await getDB()
    const template = await db.get(TEMPLATES_STORE, id)
    if (!template) return false
    template.isPinned = !template.isPinned
    template.updatedAt = Date.now()
    await db.put(TEMPLATES_STORE, template)
    return template.isPinned
  },
}
