'use client'

import { useState } from 'react'

export default function Header({title, subtitle}:{title:string; subtitle?:string}){
  const [open, setOpen] = useState(false)

  function handleLogout() {
    window.location.href = '/'
  }

  return (
    <header className="px-4 pt-4 pb-2 sticky top-0 backdrop-blur bg-white/70 dark:bg-black/30 z-10 flex items-start">
      <div className="flex-1">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      <div className="relative">
        <button
          aria-label="Menu"
          className="p-2 text-xl leading-none"
          onClick={() => setOpen(!open)}
        >
          ⋮
        </button>
        {open && (
          <div className="absolute right-0 mt-2 bg-white dark:bg-gray-800 border rounded shadow-md">
            <button
              onClick={handleLogout}
              className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
