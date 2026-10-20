import { json } from '@codemirror/lang-json'
import { Copy, FileText, Minimize2, RefreshCw, WrapText } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { toast } from 'sonner'

import { CodeMirrorEditor } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { useI18n } from '@/context/i18n-provider'
import { useToolState } from '@/context/tool-state-provider'
import { useCopyText } from '@/hooks/use-copy-text'

import { deserializeJson, getJsonStringFields } from './deserialize'

const jsonLanguage = json()

function renderOutput(input: string, mode: 'format' | 'minify' | 'deserialize', indentSize: number) {
  const parsed: unknown = JSON.parse(input)
  return mode === 'deserialize'
    ? deserializeJson(parsed, indentSize)
    : JSON.stringify(parsed, null, mode === 'minify' ? undefined : indentSize)
}

export function JsonFormatter() {
  const { t } = useI18n()
  const copyText = useCopyText()
  const [toolState, setToolState] = useToolState('jsonFormatter')
  const { input, output, error, indentSize, outputMode, selectedField } = toolState
  const setInput = (input: string) => setToolState(current => ({ ...current, input }))
  const setError = (error: string | null) => setToolState(current => ({ ...current, error }))
  const setIndentSize = (indentSize: number) => setToolState(current => ({ ...current, indentSize }))
  const autoFormatTimerRef = useRef<number | undefined>(undefined)
  const autoFormatSourceRef = useRef({ input, indentSize, outputMode })
  const isDeserialized = outputMode === 'deserialize'
  const stringFields = useMemo(() => {
    if (!isDeserialized || !input.trim())
      return []
    try {
      return getJsonStringFields(JSON.parse(input))
    }
    catch {
      return []
    }
  }, [input, isDeserialized])
  const activeField = stringFields.find(field => field.path === selectedField)
  const visibleOutput = isDeserialized && activeField ? activeField.value : output

  useEffect(() => {
    const previous = autoFormatSourceRef.current
    autoFormatSourceRef.current = { input, indentSize, outputMode }
    if (previous.input === input && previous.indentSize === indentSize && previous.outputMode === outputMode)
      return

    window.clearTimeout(autoFormatTimerRef.current)

    if (!input.trim()) {
      setToolState(current => ({ ...current, output: '', error: null }))
      return
    }

    const timer = window.setTimeout(() => {
      try {
        setToolState(current => ({
          ...current,
          output: renderOutput(input, outputMode, indentSize),
          error: null,
        }))
      }
      catch (e) {
        setToolState(current => ({ ...current, output: '', error: (e as Error).message }))
      }
    }, 200)

    autoFormatTimerRef.current = timer
    return () => window.clearTimeout(timer)
  }, [input, indentSize, outputMode, setToolState])

  const transform = (mode: typeof outputMode) => {
    window.clearTimeout(autoFormatTimerRef.current)
    autoFormatSourceRef.current = { input, indentSize, outputMode: mode }
    if (!input.trim()) {
      setToolState(current => ({ ...current, outputMode: mode, output: '', error: t('Input is empty') }))
      return
    }
    try {
      const output = renderOutput(input, mode, indentSize)
      setToolState(current => ({ ...current, outputMode: mode, output, error: null }))
    }
    catch (e) {
      setToolState(current => ({ ...current, outputMode: mode, output: '', error: (e as Error).message }))
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
        <Button size="sm" onClick={() => transform('format')}>
          <WrapText data-icon="inline-start" />
          {t('Format')}
        </Button>
        <Button
          size="sm"
          variant={isDeserialized ? 'secondary' : 'outline'}
          aria-pressed={isDeserialized}
          onClick={() => transform('deserialize')}
        >
          <FileText data-icon="inline-start" />
          {t('Deserialize')}
        </Button>
        <Button size="sm" variant="outline" onClick={() => transform('minify')}>
          <Minimize2 data-icon="inline-start" />
          {t('Minify')}
        </Button>
        <Button size="sm" variant="outline" onClick={validate}>
          <RefreshCw data-icon="inline-start" />
          {t('Validate')}
        </Button>
        <Button size="sm" variant="outline" onClick={() => copyText(error ? input : (isDeserialized ? visibleOutput : output || input))}>
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
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col border-b border-border/70 md:border-r md:border-b-0">
          <div className="flex shrink-0 items-center justify-between border-b border-border/70 bg-muted/35 px-4 py-2">
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

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/70 bg-muted/35 px-4 py-2">
            <Typography variant="muted" className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em]">{t(isDeserialized ? 'Deserialized text' : 'Output')}</Typography>
            {isDeserialized && stringFields.length > 0 && (
              <div className="flex h-4 min-w-0 flex-1 items-center justify-end">
                <Select
                  value={activeField?.path ?? 'document'}
                  onValueChange={selectedField => setToolState(current => ({ ...current, selectedField }))}
                >
                  <SelectTrigger size="sm" className="min-w-0 max-w-full py-0 data-[size=sm]:h-6 sm:max-w-72" aria-label={t('View string field')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectGroup>
                      <SelectItem value="document">{t('Entire document')}</SelectItem>
                      {stringFields.map(field => (
                        <SelectItem key={field.path} value={field.path}>{field.path}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}
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
                    value={visibleOutput}
                    language={isDeserialized ? undefined : jsonLanguage}
                    readOnly
                    placeholder={t(isDeserialized ? 'Deserialized text will appear here...' : 'Formatted JSON will appear here...')}
                    ariaLabel={t(isDeserialized ? 'Deserialized text output' : 'Formatted JSON output')}
                  />
                </div>
              )}
          {isDeserialized && (
            <Typography variant="muted" className="shrink-0 border-t border-border/70 px-4 py-2 text-xs">
              {t('Escapes are decoded for reading. This view is plain text, not valid JSON.')}
            </Typography>
          )}
        </div>
      </div>
    </div>
  )
}
