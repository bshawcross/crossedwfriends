'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [phone, setPhone] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    try {
      const challenge = new Uint8Array(32)
      crypto.getRandomValues(challenge)
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'preferred'
        }
      })
      console.log('login credential', credential)
      await fetch('/api/auth/webauthn-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      })
    } catch (err) {
      console.error('Login failed', err)
    }
  }

  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold mb-4">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="Phone number"
          className="w-full p-2 border rounded"
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
          Login with Passkey
        </button>
      </form>
    </main>
  )
}

