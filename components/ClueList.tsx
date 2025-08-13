'use client'
import type { Clue } from '@/lib/puzzle'
export default function ClueList({
  title, clues, activeNumber, onSelect
}:{title:string; clues:Clue[]; activeNumber:number|null; onSelect?:(n:number)=>void}){
  return (
    <section className="px-4">
      <h2 className="mt-2 mb-1 text-base font-semibold">{title}</h2>
      <ul className="divide-y divide-gray-200 dark:divide-gray-800 rounded-md border border-gray-200 dark:border-gray-800">
        {clues.map(c=>
          <li key={c.number}
              onClick={()=>onSelect?.(c.number)}
              className={`px-3 py-2 text-sm ${activeNumber===c.number?'bg-yellow-50 dark:bg-yellow-900/20':'hover:bg-gray-50 dark:hover:bg-white/5'}`}>
            <span className="font-semibold mr-2">{c.number}.</span>
            <span className="text-gray-700 dark:text-gray-300">{c.text}</span>
            <span className="text-gray-400 dark:text-gray-500"> {c.enumeration}</span>
          </li>
        )}
      </ul>
    </section>
  )
}
