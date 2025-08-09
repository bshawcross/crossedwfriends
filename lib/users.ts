import { promises as fs } from 'fs'
import path from 'path'

export interface User {
  phone: string
  [key: string]: unknown
}

const USERS_FILE = process.env.USERS_FILE || path.join(process.cwd(), 'users.json')

async function readStore(): Promise<Record<string, User>> {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8')
    return JSON.parse(data) as Record<string, User>
  } catch (err: any) {
    if (err && err.code === 'ENOENT') {
      return {}
    }
    throw err
  }
}

async function writeStore(store: Record<string, User>): Promise<void> {
  await fs.mkdir(path.dirname(USERS_FILE), { recursive: true })
  await fs.writeFile(USERS_FILE, JSON.stringify(store, null, 2), 'utf8')
}

export async function getUser(phone: string): Promise<User | undefined> {
  const store = await readStore()
  return store[phone]
}

export async function upsertUser(user: User): Promise<void> {
  const store = await readStore()
  store[user.phone] = user
  await writeStore(store)
}
