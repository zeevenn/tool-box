import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useI18n } from '@/context/i18n-provider'

import { Loading } from './loading'

interface ComingSoonProps {
  title?: string
  description?: string
  className?: string
}

export function ComingSoon({
  title = 'Coming Soon',
  description = 'This feature is under development and will be available soon.',
}: ComingSoonProps) {
  const { t } = useI18n()

  return (
    <div className="flex-1 flex items-center justify-center">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl">{t(title)}</CardTitle>
          <CardDescription className="leading-relaxed">
            {t(description)}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Loading />
        </CardContent>
      </Card>
    </div>
  )
}
