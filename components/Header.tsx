'use client'

import type { ReactNode } from 'react'

export default function Header({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children?: ReactNode
}) {
  return (
    <header className="px-4 pt-4 pb-2 sticky top-0 backdrop-blur bg-white/70 dark:bg-black/30 z-10 flex items-start">
      <div className="flex-1">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      {children}
    </header>
  )
}
