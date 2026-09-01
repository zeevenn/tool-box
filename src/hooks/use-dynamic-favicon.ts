import { useEffect } from 'react'

export function useDynamicFavicon() {
  useEffect(() => {
    const updateFavicon = () => {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const favicon = document.querySelector(
        'link[rel="icon"]',
      ) as HTMLLinkElement

      if (favicon) {
        const fileName = isDark ? 'logo-dark.svg' : 'logo.svg'
        favicon.href = `${import.meta.env.BASE_URL}${fileName}`
      }
    }

    updateFavicon()

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', updateFavicon)

    return () => {
      mediaQuery.removeEventListener('change', updateFavicon)
    }
  }, [])
}
