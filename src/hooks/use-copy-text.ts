import { useCallback } from 'react'
import { toast } from 'sonner'

import { useI18n } from '@/context/i18n-provider'

export function useCopyText() {
  const { t } = useI18n()

  return useCallback(async (value: string, successMessage?: string) => {
    if (!value) {
      toast.error(t('Nothing to copy'))
      return false
    }

    try {
      if (!navigator.clipboard?.writeText)
        throw new Error('Clipboard API is unavailable')
      await navigator.clipboard.writeText(value)
      toast.success(successMessage ?? t('Copied to clipboard'))
      return true
    }
    catch {
      toast.error(t('Unable to copy to clipboard'))
      return false
    }
  }, [t])
}
