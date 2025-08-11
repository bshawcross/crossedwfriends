'use client'

import { useState } from 'react'
import { toArrayBuffer, fromArrayBuffer } from '@/utils/base64url'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSuccess(null)
    setError(null)
    try {
      const optionsRes = await fetch(
        `/api/auth/webauthn-login?phone=${encodeURIComponent(phone)}`
      )
      if (!optionsRes.ok) {
        throw new Error('Failed to get authentication options')
      }
      const optionsJSON = await optionsRes.json()

      const publicKey: PublicKeyCredentialRequestOptions = {
        ...optionsJSON,
        challenge: toArrayBuffer(optionsJSON.challenge),
        allowCredentials: optionsJSON.allowCredentials?.map(
          (cred: { id: string; type: string }) => ({
            ...cred,
            id: toArrayBuffer(cred.id)
          })
        ),
        userVerification: 'required'
      }

      const credential = (await navigator.credentials.get({
        publicKey
      })) as PublicKeyCredential

      const { id, rawId, response, type, authenticatorAttachment } = credential
      const assertionResponse = {
        id,
        rawId: fromArrayBuffer(rawId),
        response: {
          authenticatorData: fromArrayBuffer(
            (response as AuthenticatorAssertionResponse).authenticatorData
          ),
          clientDataJSON: fromArrayBuffer(response.clientDataJSON),
          signature: fromArrayBuffer(
            (response as AuthenticatorAssertionResponse).signature
          ),
          userHandle: response.userHandle
            ? fromArrayBuffer(response.userHandle)
            : null
        },
        type,
        authenticatorAttachment,
        clientExtensionResults: credential.getClientExtensionResults()
      }

      const verifyRes = await fetch('/api/auth/webauthn-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, assertionResponse })
      })
      if (!verifyRes.ok) {
        const { error: errMessage } = await verifyRes.json()
        throw new Error(errMessage || 'Login failed')
      }
      const { verified } = await verifyRes.json()
      if (!verified) {
        throw new Error('Login verification failed')
      }
      setSuccess('Logged in successfully')
    } catch (err) {
      setError((err as Error).message)
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
      {success && <p className="mt-4 text-green-600">{success}</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </main>
  )
}

