'use client'
export default function Header({title, subtitle}:{title:string; subtitle?:string}){
  return (
    <header className="px-4 pt-4 pb-2 sticky top-0 backdrop-blur bg-white/70 dark:bg-black/30 z-10">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </header>
  )
}
