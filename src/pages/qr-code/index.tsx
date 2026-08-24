import { Clock3, Download, History, QrCode, Sparkles, Trash2 } from 'lucide-react'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { useI18n } from '@/context/i18n-provider'
import { useToolState } from '@/context/tool-state-provider'

interface QrHistoryEntry {
  id: string
  content: string
  createdAt: number
}

const STORAGE_KEY = 'tool-box-qr-history-v1'
const MAX_HISTORY = 20

function isHistoryEntry(value: unknown): value is QrHistoryEntry {
  if (!value || typeof value !== 'object')
    return false

  const entry = value as Partial<QrHistoryEntry>
  return typeof entry.id === 'string'
    && typeof entry.content === 'string'
    && entry.content.length > 0
    && typeof entry.createdAt === 'number'
}

function loadHistory(): QrHistoryEntry[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved)
      return []

    const parsed = JSON.parse(saved) as unknown
    if (!Array.isArray(parsed))
      return []

    return parsed.filter(isHistoryEntry).slice(0, MAX_HISTORY)
  }
  catch {
    return []
  }
}

function createDownloadName() {
  const timestamp = new Date().toISOString().replaceAll(':', '-').replace(/\.\d{3}Z$/, 'Z')
  return `qr-code-${timestamp}.png`
}

function dataUrlToBlob(dataUrl: string) {
  const [metadata, encoded] = dataUrl.split(',')
  const mimeType = metadata.match(/^data:(.*?);base64$/)?.[1] ?? 'image/png'
  const binary = window.atob(encoded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1)
    bytes[index] = binary.charCodeAt(index)
  return new Blob([bytes], { type: mimeType })
}

export function QrCodeGenerator() {
  const { locale, t } = useI18n()
  const [toolState, setToolState] = useToolState('qrCode')
  const [history, setHistory] = useState(loadHistory)
  const [dataUrl, setDataUrl] = useState('')
  const [generatedContent, setGeneratedContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    }
    catch {
      toast.error(t('Unable to save QR code history'))
    }
  }, [history, t])

  const remember = (content: string) => {
    const entry: QrHistoryEntry = {
      id: crypto.randomUUID(),
      content,
      createdAt: Date.now(),
    }
    setHistory(current => [entry, ...current.filter(item => item.content !== content)].slice(0, MAX_HISTORY))
  }

  const generate = async (content = toolState.input, saveToHistory = true) => {
    if (!content.trim())
      return

    const value = content
    setIsGenerating(true)
    try {
      const nextDataUrl = await QRCode.toDataURL(value, {
        width: 768,
        margin: 3,
        errorCorrectionLevel: 'M',
        color: { dark: '#000000', light: '#ffffff' },
      })
      setDataUrl(nextDataUrl)
      setGeneratedContent(value)
      if (saveToHistory)
        remember(value)
    }
    catch {
      toast.error(t('Unable to generate QR code. Try shorter content.'))
    }
    finally {
      setIsGenerating(false)
    }
  }

  const restore = async (entry: QrHistoryEntry) => {
    setToolState({ input: entry.content })
    await generate(entry.content, false)
  }

  const download = () => {
    if (!dataUrl)
      return

    const url = URL.createObjectURL(dataUrlToBlob(dataUrl))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = createDownloadName()
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    toast.success(t('QR code downloaded'))
  }

  const deleteEntry = (id: string) => {
    setHistory(current => current.filter(entry => entry.id !== id))
    toast.success(t('History entry deleted'))
  }

  const clearHistory = () => {
    setHistory([])
    setConfirmClear(false)
    toast.success(t('QR code history cleared'))
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto grid max-w-6xl items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>{t('Create QR code')}</CardTitle>
            <CardDescription>{t('Enter text or a URL to create a downloadable QR code.')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_18rem]">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="qr-content">{t('Content')}</FieldLabel>
                  <Textarea
                    id="qr-content"
                    value={toolState.input}
                    onChange={event => setToolState({ input: event.target.value })}
                    placeholder={t('Enter text or paste a URL...')}
                    rows={9}
                    spellCheck={false}
                    className="min-h-52 resize-none"
                  />
                  <FieldDescription>{t('Your content stays in this browser.')}</FieldDescription>
                </Field>
              </FieldGroup>

              <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-muted/20 p-4">
                {dataUrl
                  ? (
                      <img
                        src={dataUrl}
                        alt={t('Generated QR code')}
                        className="size-full rounded-md object-contain"
                      />
                    )
                  : (
                      <Empty className="border-0 p-4 md:p-4">
                        <EmptyHeader>
                          <EmptyMedia variant="icon"><QrCode /></EmptyMedia>
                          <EmptyTitle>{t('QR code preview')}</EmptyTitle>
                          <EmptyDescription>{t('Your generated code will appear here.')}</EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-wrap gap-2 border-t">
            <Button disabled={!toolState.input.trim() || isGenerating} onClick={() => void generate()}>
              <Sparkles data-icon="inline-start" />
              {isGenerating ? t('Generating...') : t('Generate QR code')}
            </Button>
            <Button variant="outline" disabled={!dataUrl} onClick={download}>
              <Download data-icon="inline-start" />
              {t('Download PNG')}
            </Button>
            {generatedContent && (
              <span className="ml-auto hidden max-w-56 truncate text-xs text-muted-foreground sm:block" title={generatedContent}>
                {generatedContent}
              </span>
            )}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('Recent history')}</CardTitle>
            <CardDescription>{t('Stored locally, newest first.')}</CardDescription>
            <CardAction><Badge variant="secondary">{`${history.length}/${MAX_HISTORY}`}</Badge></CardAction>
          </CardHeader>
          <CardContent>
            {history.length > 0
              ? (
                  <div className="flex max-h-[28rem] flex-col gap-1 overflow-y-auto pr-1">
                    {history.map(entry => (
                      <div key={entry.id} className="flex min-w-0 items-center gap-1">
                        <Button
                          variant={generatedContent === entry.content ? 'secondary' : 'ghost'}
                          className="h-auto min-w-0 flex-1 justify-start px-3 py-2.5"
                          onClick={() => void restore(entry)}
                        >
                          <Clock3 data-icon="inline-start" />
                          <span className="min-w-0 flex-1 text-left">
                            <span className="block truncate">{entry.content}</span>
                            <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                              {new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(entry.createdAt)}
                            </span>
                          </span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t('Delete history entry')}
                          title={t('Delete')}
                          onClick={() => deleteEntry(entry.id)}
                        >
                          <Trash2 data-icon="inline-start" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )
              : (
                  <Empty className="border-0 px-2 py-8 md:p-8">
                    <EmptyHeader>
                      <EmptyMedia variant="icon"><History /></EmptyMedia>
                      <EmptyTitle>{t('No QR code history')}</EmptyTitle>
                      <EmptyDescription>{t('Generated QR codes will be kept here automatically.')}</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
          </CardContent>
          {history.length > 0 && (
            <CardFooter className="border-t">
              <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)}>
                <Trash2 data-icon="inline-start" />
                {t('Clear all')}
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Clear all QR code history?')}</AlertDialogTitle>
            <AlertDialogDescription>{t('This permanently removes all saved QR code history from this browser.')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={clearHistory}>{t('Clear all')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
