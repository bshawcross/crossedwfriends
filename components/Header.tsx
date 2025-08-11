'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'

type HeaderProps = {
  title: string
  subtitle?: string
  children?: ReactNode
}

export default function Header({ title, subtitle, children }: HeaderProps) {
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    function updateCountdown() {
      const now = new Date()
      const next = new Date(now)
      next.setHours(24, 0, 0, 0)
      const diff = next.getTime() - now.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      const pad = (n: number) => n.toString().padStart(2, '0')
      setTimeLeft(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`)
    }

    updateCountdown()
    const id = setInterval(updateCountdown, 1000)
    return () => clearInterval(id)
  }, [])

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
      <div className="flex flex-col items-end">
        <button onClick={handleLogout} className="text-sm text-blue-600">
          Logout
        </button>
        <span className="text-xs mt-1">{timeLeft}</span>
      </div>
    </header>
  )
}

