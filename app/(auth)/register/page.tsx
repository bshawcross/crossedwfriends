'use client'

import { useState } from 'react'

export default function RegisterPage() {
  const [phone, setPhone] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    try {
      const challenge = new Uint8Array(32)
      crypto.getRandomValues(challenge)
      const userId = new Uint8Array(16)
      crypto.getRandomValues(userId)
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'Crossed with Friends' },
          user: {
            id: userId,
            name: phone,
            displayName: phone
          },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }]
        }
      })
      console.log('registration credential', credential)
      await fetch('/api/auth/webauthn-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      })
    } catch (err) {
      console.error('Registration failed', err)
    }
  }

  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold mb-4">Register</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="Phone number"
          className="w-full p-2 border rounded"
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
          Register Passkey
        </button>
      </form>
    </main>
  )
}

