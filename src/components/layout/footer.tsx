import { useI18n } from '../../context/i18n-provider'
import { Button } from '../ui/button'
import { Typography } from '../ui/typography'

export function Footer() {
  const { t } = useI18n()

  return (
    <footer className="bg-background border-t border-border">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <Typography variant="muted" className="text-center">
            Tool Box -
            {' '}
            {t('A collection of useful tools.')}
          </Typography>
          <div className="flex mt-4 md:mt-0">
            <Button variant="link" size="sm" asChild>
              <a
                href="https://github.com/zeevenn/tool-box/issues"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('Report Bug')}
              </a>
            </Button>
            <Button variant="link" size="sm" asChild>
              <a
                href="https://github.com/zeevenn/tool-box/discussions"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('Feature Request')}
              </a>
            </Button>
            <Button variant="link" size="sm" asChild>
              <a
                href="https://github.com/zeevenn/tool-box/blob/master/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('License')}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  )
}
