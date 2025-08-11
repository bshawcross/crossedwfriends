'use client'
import React from 'react'

export default function KeyboardControls({ onCheck, kbOpen }: { onCheck: () => void; kbOpen?: boolean }) {
  if (kbOpen) return null
  return (
    <>
      <div className="px-2">
        <div className="mt-2 flex justify-end px-1">
          <button onClick={onCheck} className="px-3 py-1.5 text-sm border rounded-md border-gray-300 dark:border-gray-700">
            Check
          </button>
        </div>
      </div>
      <div className="px-4 text-sm text-gray-500 mt-2">
        Tip: tap a cell to type • tap again to switch direction
      </div>
    </>
  )
}

