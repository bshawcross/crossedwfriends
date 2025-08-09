'use client'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { KEYBOARD_INSET_THRESHOLD } from '@/utils/constants'

export default function ClueBar({
  text,
  onHeightChange,
}: {
  text: string
  onHeightChange?: (px: number) => void
}) {
  const [bottom, setBottom] = useState(0)
  const [maxH, setMaxH] = useState<number>(120) // will update via viewport
  const wrapRef = useRef<HTMLDivElement>(null)

  // Track keyboard height (visual viewport) and compute max bar height
  useEffect(() => {
    const vv = (window as any).visualViewport
    if (!vv) return
    const update = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      const isKeyboard = inset > KEYBOARD_INSET_THRESHOLD
      setBottom(isKeyboard ? inset : 0)
      setMaxH(Math.floor(vv.height * 0.42)) // allow up to ~42% of visible height
    }
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  // Report actual rendered height up to parent (so grid can avoid being obscured)
  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => onHeightChange?.(el.getBoundingClientRect().height))
    ro.observe(el)
    return () => ro.disconnect()
  }, [onHeightChange, text])

  return (
    <div
      style={{ bottom }}
      className="fixed left-0 right-0 z-20 border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-black/80"
    >
      <div
        ref={wrapRef}
        style={{ maxHeight: maxH }}
        className="px-3 py-2 max-w-md mx-auto overflow-y-auto [scrollbar-width:none]"
      >
        <div className="text-sm leading-snug whitespace-pre-wrap">
          {text || ' '}
        </div>
      </div>
      {/* iOS safe-area shim */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  )
}
