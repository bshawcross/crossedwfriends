'use client'

import { useState } from 'react'
import {
  base64URLStringToBuffer,
  bufferToBase64URLString
} from '@simplewebauthn/browser'

export default function RegisterPage() {
  const [phone, setPhone] = useState('')
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSuccess(null)
    setError(null)
    try {
      const optionsRes = await fetch(
        `/api/auth/webauthn-register?phone=${encodeURIComponent(phone)}`
      )
      if (!optionsRes.ok) {
        throw new Error('Failed to get registration options')
      }
      const optionsJSON = await optionsRes.json()

      const publicKey: PublicKeyCredentialCreationOptions = {
        ...optionsJSON,
        challenge: base64URLStringToBuffer(optionsJSON.challenge),
        user: {
          ...optionsJSON.user,
          id: base64URLStringToBuffer(optionsJSON.user.id)
        },
        excludeCredentials: optionsJSON.excludeCredentials?.map(
          (cred: { id: string; type: string }) => ({
            ...cred,
            id: base64URLStringToBuffer(cred.id)
          })
        )
      }

      const credential = (await navigator.credentials.create({
        publicKey
      })) as PublicKeyCredential

      const { id, rawId, response, type, authenticatorAttachment } =
        credential
      const attestationResponse = {
        id,
        rawId: bufferToBase64URLString(rawId),
        response: {
          attestationObject: bufferToBase64URLString(
            (response as AuthenticatorAttestationResponse).attestationObject
          ),
          clientDataJSON: bufferToBase64URLString(response.clientDataJSON)
        },
        type,
        authenticatorAttachment,
        clientExtensionResults: credential.getClientExtensionResults()
      }

      const verifyRes = await fetch('/api/auth/webauthn-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, attestationResponse })
      })

      if (!verifyRes.ok) {
        const { error: errMessage } = await verifyRes.json()
        throw new Error(errMessage || 'Registration failed')
      }

      setSuccess('Passkey registered successfully')
    } catch (err) {
      setError((err as Error).message)
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
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Register Passkey
        </button>
      </form>
      {success && <p className="mt-4 text-green-600">{success}</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </main>
  )
}

