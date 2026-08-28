import { useEffect, useState } from 'react'

const QUERY = '(pointer: coarse), (max-width: 767px)'

/** Phones/tablets: fat-finger targets, and site details go in the drawer instead of a map popup. */
export function useCoarsePointer() {
  const [coarse, setCoarse] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(QUERY).matches : false))
  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const on = () => setCoarse(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return coarse
}
