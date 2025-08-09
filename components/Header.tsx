'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'

type HeaderProps = {
  title: string
  subtitle?: string
  children?: ReactNode
}

export default function Header({ title, subtitle, children }: HeaderProps) {
  const router = useRouter()

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.refresh()
    } catch (err) {
      console.error('Logout failed', err)
    }
  }

  return (
    <header
      className={clsx(
        'px-4 pt-4 pb-2 sticky top-0 backdrop-blur bg-white/70 dark:bg-black/30',
        'z-10 flex justify-between items-start'
      )}
    >
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        {children}
      </div>
      <button onClick={handleLogout} className="text-sm text-blue-600">
        Logout
      </button>
    </header>
  )
}

