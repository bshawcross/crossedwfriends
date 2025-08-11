'use client'
import React from 'react'
import clsx from 'clsx'
import type { Cell } from '@/lib/puzzle'

export default function GridCell({
  cell,
  isCursor,
  isHighlighted,
  onTap,
  onChange,
  onKeyDown,
  inputRef,
}: {
  cell: Cell
  isCursor: boolean
  isHighlighted: boolean
  onTap: (r: number, c: number) => void
  onChange: (r: number, c: number, val: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, r: number, c: number) => void
  inputRef?: (el: HTMLInputElement | null) => void
}) {
  const id = `${cell.row}_${cell.col}`
  return (
    <div id={`cell_${id}`} onClick={() => onTap(cell.row, cell.col)}
      className={clsx(
        "relative aspect-square w-full border border-gray-300 dark:border-gray-700",
        cell.isBlack ? "bg-black" : "bg-white dark:bg-neutral-900",
        isHighlighted && !cell.isBlack ? "bg-yellow-50 dark:bg-yellow-900/20" : "",
        isCursor && !cell.isBlack ? "ring-2 ring-blue-500" : ""
      )}>
      {!cell.isBlack && (
        <>
          {cell.clueNumber && (
            <span className="absolute top-0.5 left-0.5 text-[10px] text-gray-500">{cell.clueNumber}</span>
          )}
          <input
            ref={inputRef}
            inputMode="text" autoCapitalize="characters" autoCorrect="off" maxLength={1}
            value={cell.userInput || ''}
            onChange={e => onChange(cell.row, cell.col, e.target.value)}
            onKeyDown={e => onKeyDown(e, cell.row, cell.col)}
            className="absolute inset-0 w-full h-full bg-transparent text-lg font-semibold text-center outline-none caret-transparent selection:bg-transparent"
          />
        </>
      )}
    </div>
  )
}

