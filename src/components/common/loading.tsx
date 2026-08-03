import { Skeleton } from '@/components/ui/skeleton'
import { useI18n } from '@/context/i18n-provider'

export function Loading() {
  const { t } = useI18n()

  return (
    <div className="flex gap-1.5" role="status" aria-label={t('Loading')}>
      <Skeleton className="size-2 rounded-full" />
      <Skeleton className="size-2 rounded-full [animation-delay:0.2s]" />
      <Skeleton className="size-2 rounded-full [animation-delay:0.4s]" />
    </div>
  )
}
