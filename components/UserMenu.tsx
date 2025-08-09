'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function UserMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [open])

  function handleLogout() {
    router.push('/')
  }

  return (
    <div ref={ref} className="relative">
      <button
        aria-label="Menu"
        type="button"
        className="p-2 text-xl leading-none"
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden>⋮</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 bg-white dark:bg-gray-800 border rounded shadow-md">
          <button
            type="button"
            onClick={handleLogout}
            className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
