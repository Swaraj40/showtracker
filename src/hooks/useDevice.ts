'use client'

import { useEffect, useState } from 'react'

export function useDevice() {
  const [isTV, setIsTV] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkDevice = () => {
      const ua = navigator.userAgent.toLowerCase()
      // Basic TV detection
      const tvKeywords = ['tv', 'smarttv', 'tizen', 'webos', 'aftb', 'android tv', 'apple tv', 'chromecast', 'roku']
      const _isTV = tvKeywords.some((keyword) => ua.includes(keyword))
      // Or check if the screen is large and we force TV mode via query param/localStorage for dev
      const forceTV = window.localStorage.getItem('forceTV') === 'true'

      const _isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)

      setIsTV(_isTV || forceTV)
      setIsMobile(_isMobile && !_isTV && !forceTV)
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  return { isTV, isMobile, isDesktop: !isTV && !isMobile }
}
