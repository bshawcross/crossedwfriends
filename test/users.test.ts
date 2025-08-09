import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

test('upsertUser and getUser persist data', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'user-store-'))
  process.env.USERS_FILE = path.join(dir, 'users.json')
  const { upsertUser, getUser } = await import('../lib/users')

  const user = { phone: '123', name: 'Alice' }
  await upsertUser(user)
  const fetched = await getUser('123')
  assert.deepEqual(fetched, user)
})
