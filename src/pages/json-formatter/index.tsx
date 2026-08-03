import { json } from '@codemirror/lang-json'
import { Copy, Minimize2, RefreshCw, WrapText } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { CodeMirrorEditor } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { useI18n } from '@/context/i18n-provider'
import { useCopyText } from '@/hooks/use-copy-text'

const jsonLanguage = json()

export function JsonFormatter() {
  const { t } = useI18n()
  const copyText = useCopyText()
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [indentSize, setIndentSize] = useState(2)
  const autoFormatTimerRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    window.clearTimeout(autoFormatTimerRef.current)

    if (!input.trim()) {
      setOutput('')
      setError(null)
      return
    }

    const timer = window.setTimeout(() => {
      try {
        const parsed = JSON.parse(input)
        setOutput(JSON.stringify(parsed, null, indentSize))
        setError(null)
      }
      catch (e) {
        setError((e as Error).message)
        setOutput('')
      }
    }, 200)

    autoFormatTimerRef.current = timer
    return () => window.clearTimeout(timer)
  }, [input, indentSize])

  const format = () => {
    window.clearTimeout(autoFormatTimerRef.current)
    if (!input.trim()) {
      setError(t('Input is empty'))
      setOutput('')
      return
    }
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed, null, indentSize))
      setError(null)
    }
    catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }

  const minify = () => {
    window.clearTimeout(autoFormatTimerRef.current)
    if (!input.trim()) {
      setError(t('Input is empty'))
      setOutput('')
      return
    }
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed))
      setError(null)
    }
    catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }

  const validate = () => {
    if (!input.trim()) {
      toast.error(t('Input is empty'))
      return
    }
    try {
      JSON.parse(input)
      toast.success(t('Valid JSON'))
      setError(null)
    }
    catch (e) {
      const msg = (e as Error).message
      setError(msg)
      toast.error(t('Invalid JSON: {message}', { message: msg }))
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border/70 bg-card/80 px-4 py-2.5">
        <Button size="sm" onClick={format}>
          <WrapText data-icon="inline-start" />
          {t('Format')}
        </Button>
        <Button size="sm" variant="outline" onClick={minify}>
          <Minimize2 data-icon="inline-start" />
          {t('Minify')}
        </Button>
        <Button size="sm" variant="outline" onClick={validate}>
          <RefreshCw data-icon="inline-start" />
          {t('Validate')}
        </Button>
        <Button size="sm" variant="outline" onClick={() => copyText(output || input)}>
          <Copy data-icon="inline-start" />
          {t('Copy')}
        </Button>

        <Separator orientation="vertical" className="hidden !h-5 sm:block" />

        <div className="flex items-center gap-2">
          <Typography variant="muted" className="text-xs">{t('Indent:')}</Typography>
          {[2, 4].map(n => (
            <Button
              key={n}
              size="sm"
              variant={indentSize === n ? 'secondary' : 'ghost'}
              className="size-8 p-0"
              onClick={() => setIndentSize(n)}
            >
              {n}
            </Button>
          ))}
        </div>
      </div>

      {/* Editors */}
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <div className="flex min-h-0 flex-1 flex-col border-b border-border/70 md:border-r md:border-b-0">
          <div className="flex items-center justify-between border-b border-border/70 bg-muted/35 px-4 py-2">
            <Typography variant="muted" className="text-[11px] font-semibold uppercase tracking-[0.12em]">{t('Input')}</Typography>
          </div>
          <div className="relative flex-1 overflow-hidden">
            <CodeMirrorEditor
              value={input}
              onChange={setInput}
              language={jsonLanguage}
              placeholder={t('Paste JSON here...')}
              ariaLabel={t('JSON input')}
            />
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-border/70 bg-muted/35 px-4 py-2">
            <Typography variant="muted" className="text-[11px] font-semibold uppercase tracking-[0.12em]">{t('Output')}</Typography>
          </div>
          {error
            ? (
                <div className="flex-1 p-3">
                  <Typography variant="small" className="text-destructive font-mono">{error}</Typography>
                </div>
              )
            : (
                <div className="relative flex-1 overflow-hidden">
                  <CodeMirrorEditor
                    value={output}
                    language={jsonLanguage}
                    readOnly
                    placeholder={t('Formatted JSON will appear here...')}
                    ariaLabel={t('Formatted JSON output')}
                  />
                </div>
              )}
        </div>
      </div>
    </div>
  )
}
