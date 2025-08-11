'use client'

import { RefObject, useEffect, useState } from 'react'
import { KEYBOARD_INSET_THRESHOLD } from '@/utils/constants'

type Dir = { number: number | null; dir: 'across' | 'down' }

export default function useKeyboardViewport(
  gridInnerRef: RefObject<HTMLDivElement>,
  clueBarH: number,
  active?: Dir
) {
  const [kbOpen, setKbOpen] = useState(false)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const vv = (window as any).visualViewport
    if (!vv) return
    const onResize = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      const isKeyboard = inset > KEYBOARD_INSET_THRESHOLD
      setKbOpen(isKeyboard)
      requestAnimationFrame(() => {
        const inner = gridInnerRef.current
        if (!inner) return
        const naturalHeight = inner.offsetHeight
        const available = vv.height - clueBarH - 12
        const s = Math.min(1, Math.max(0.6, available / naturalHeight))
        setScale(s)
      })
    }
    onResize()
    vv.addEventListener('resize', onResize)
    vv.addEventListener('scroll', onResize)
    return () => {
      vv.removeEventListener('resize', onResize)
      vv.removeEventListener('scroll', onResize)
    }
  }, [clueBarH, gridInnerRef])

  useEffect(() => {
    const inner = gridInnerRef.current
    if (!inner) return
    const vv = (window as any).visualViewport
    if (!vv) return
    const naturalHeight = inner.offsetHeight
    const available = vv.height - clueBarH - 12
    const s = Math.min(1, Math.max(0.6, available / naturalHeight))
    setScale(s)
  }, [clueBarH, active, gridInnerRef])

  return { kbOpen, scale }
}

