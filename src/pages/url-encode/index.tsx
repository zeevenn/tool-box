import { Copy, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { useI18n } from '@/context/i18n-provider'
import { useToolState } from '@/context/tool-state-provider'
import { useCopyText } from '@/hooks/use-copy-text'

export function UrlEncode() {
  const { t } = useI18n()
  const copyText = useCopyText()
  const [toolState, setToolState] = useToolState('urlEncode')
  const { decoded, encoded } = toolState
  const setDecoded = (decoded: string) => setToolState(current => ({ ...current, decoded }))
  const setEncoded = (encoded: string) => setToolState(current => ({ ...current, encoded }))

  const handleDecodedChange = (value: string) => {
    setDecoded(value)
    try {
      setEncoded(encodeURIComponent(value))
    }
    catch {
      setEncoded('')
    }
  }

  const handleEncodedChange = (value: string) => {
    setEncoded(value)
    try {
      setDecoded(decodeURIComponent(value))
    }
    catch {
      setDecoded('')
    }
  }

  const clear = () => {
    setDecoded('')
    setEncoded('')
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border/70 bg-card/80 px-4 py-2.5">
        <Button size="sm" variant="ghost" onClick={clear}>
          <Trash2 data-icon="inline-start" />
          {t('Clear')}
        </Button>
        <Typography variant="muted" className="text-xs ml-auto">{t('Converts in real-time')}</Typography>
      </div>

      {/* Panels */}
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <div className="flex min-h-0 flex-1 flex-col border-b border-border/70 md:border-r md:border-b-0">
          <div className="flex items-center justify-between border-b border-border/70 bg-muted/35 px-4 py-2">
            <Typography variant="muted" className="text-[11px] font-semibold uppercase tracking-[0.12em]">{t('Decoded URL')}</Typography>
            <Button size="icon-xs" variant="ghost" onClick={() => copyText(decoded, t('{label} copied to clipboard', { label: t('Decoded') }))}>
              <Copy data-icon="inline-start" />
            </Button>
          </div>
          <textarea
            value={decoded}
            onChange={e => handleDecodedChange(e.target.value)}
            placeholder="https://example.com/path?q=hello world&lang=中文"
            spellCheck={false}
            className="flex-1 resize-none bg-card p-4 font-mono text-sm leading-6 focus:outline-none"
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-border/70 bg-muted/35 px-4 py-2">
            <Typography variant="muted" className="text-[11px] font-semibold uppercase tracking-[0.12em]">{t('Encoded URL')}</Typography>
            <Button size="icon-xs" variant="ghost" onClick={() => copyText(encoded, t('{label} copied to clipboard', { label: t('Encoded') }))}>
              <Copy data-icon="inline-start" />
            </Button>
          </div>
          <textarea
            value={encoded}
            onChange={e => handleEncodedChange(e.target.value)}
            placeholder="https%3A%2F%2Fexample.com%2Fpath%3Fq%3Dhello%20world%26lang%3D%E4%B8%AD%E6%96%87"
            spellCheck={false}
            className="flex-1 resize-none bg-card p-4 font-mono text-sm leading-6 focus:outline-none"
          />
        </div>
      </div>
    </div>
  )
}
