"use client"
import { useRouter } from 'next/navigation'
import Countdown from '@/components/Countdown'

export default function Header({title, subtitle}:{title:string; subtitle?:string}){
  const router = useRouter()

  async function handleLogout(){
    try{
      await fetch('/api/auth/logout', {method:'POST'})
      router.refresh()
    }catch(err){
      console.error('Logout failed', err)
    }
  }

  return (
    <header
      className="px-4 pt-4 pb-2 sticky top-0 backdrop-blur bg-white/70 dark:bg-black/30 z-10 flex justify-between items-start"
    >
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <Countdown />
        <button onClick={handleLogout} className="text-sm text-blue-600">Logout</button>
      </div>
    </header>
  )
}
