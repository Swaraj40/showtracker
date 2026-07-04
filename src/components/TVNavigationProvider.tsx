'use client'

import { useEffect } from 'react'
import { init, setKeyMap } from '@noriginmedia/norigin-spatial-navigation'

export function TVNavigationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize spatial navigation only on the client
    init({
      debug: false,
      visualDebug: false,
    })

    // Map standard arrow keys and enter
    setKeyMap({
      left: 37,
      up: 38,
      right: 39,
      down: 40,
      enter: 13,
    })
  }, [])

  return <>{children}</>
}
