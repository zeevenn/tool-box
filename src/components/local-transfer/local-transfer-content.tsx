import type { FormEvent, KeyboardEvent } from 'react'
import { Check, ClipboardCopy, Inbox, Send, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { useI18n } from '@/context/i18n-provider'
import { useCopyText } from '@/hooks/use-copy-text'
import { cn } from '@/lib/utils'

interface LocalTransferItem {
  id: string
  content: string
  createdAt: number
}

interface LocalTransferContentProps {
  isMac: boolean
}

const STORAGE_KEY = 'tool-box-local-transfer-v1'
const MAX_ITEMS = 20
const LONG_CONTENT_LENGTH = 1200
const LONG_CONTENT_LINES = 16

function isLocalTransferItem(value: unknown): value is LocalTransferItem {
  if (!value || typeof value !== 'object')
    return false

  const item = value as Partial<LocalTransferItem>
  return typeof item.id === 'string'
    && typeof item.content === 'string'
    && typeof item.createdAt === 'number'
}

function readItems() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed)
      ? parsed.filter(isLocalTransferItem).slice(-MAX_ITEMS)
      : []
  }
  catch {
    return []
  }
}

function writeItems(items: LocalTransferItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

function presentContent(content: string) {
  const trimmed = content.trim()
  if (!trimmed.startsWith('{') && !trimmed.startsWith('['))
    return { display: content, isJson: false }

  try {
    return {
      display: JSON.stringify(JSON.parse(trimmed), null, 2),
      isJson: true,
    }
  }
  catch {
    return { display: content, isJson: false }
  }
}

export function LocalTransferContent({ isMac }: LocalTransferContentProps) {
  const { locale, t } = useI18n()
  const copyText = useCopyText()
  const [items, setItems] = useState<LocalTransferItem[]>(readItems)
  const [draft, setDraft] = useState('')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => new Set())
  const [confirmingClear, setConfirmingClear] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const listEndRef = useRef<HTMLDivElement>(null)
  const presentedItems = useMemo(
    () => items.map(item => ({ ...item, ...presentContent(item.content) })),
    [items],
  )

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ block: 'nearest' })
  }, [items.length])

  const updateItems = (nextItems: LocalTransferItem[]) => {
    try {
      writeItems(nextItems)
      setItems(nextItems)
      return true
    }
    catch {
      toast.error(t('Unable to update local drop'))
      return false
    }
  }

  const addItem = () => {
    if (!draft.trim())
      return

    const nextItems = [
      ...items,
      {
        id: crypto.randomUUID(),
        content: draft,
        createdAt: Date.now(),
      },
    ].slice(-MAX_ITEMS)

    if (updateItems(nextItems)) {
      setDraft('')
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    addItem()
  }

  const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      addItem()
    }
  }

  const deleteItem = (id: string) => {
    if (updateItems(items.filter(item => item.id !== id))) {
      setExpandedItems((current) => {
        const next = new Set(current)
        next.delete(id)
        return next
      })
    }
  }

  const clearItems = () => {
    if (updateItems([])) {
      setExpandedItems(new Set())
      setConfirmingClear(false)
      toast.success(t('Local drop cleared'))
    }
  }

  const toggleExpanded = (id: string) => {
    setExpandedItems((current) => {
      const next = new Set(current)
      if (next.has(id))
        next.delete(id)
      else
        next.add(id)
      return next
    })
  }

  return (
    <SheetContent
      className="w-full gap-0 p-0 sm:max-w-[480px]"
      closeLabel={t('Close')}
      overlayClassName="hidden"
      onOpenAutoFocus={(event) => {
        event.preventDefault()
        requestAnimationFrame(() => inputRef.current?.focus())
      }}
    >
      <SheetHeader className="border-b border-border/70 pr-12 text-left">
        <SheetTitle className="flex items-center gap-2">
          <Inbox className="size-4 text-primary" />
          {t('Local Drop')}
        </SheetTitle>
        <SheetDescription>{t('Keep snippets in this browser without sending them anywhere.')}</SheetDescription>
      </SheetHeader>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-11 items-center justify-between gap-3 border-b border-border/70 px-4 py-2">
          <p className="text-xs text-muted-foreground">
            {t('{count} of {max} items', { count: items.length, max: MAX_ITEMS })}
          </p>
          {confirmingClear
            ? (
                <div className="flex items-center gap-1">
                  <p className="text-xs text-muted-foreground">{t('Clear every local item?')}</p>
                  <Button variant="destructive" size="xs" onClick={clearItems}>
                    <Check data-icon="inline-start" />
                    {t('Confirm')}
                  </Button>
                  <Button variant="ghost" size="xs" onClick={() => setConfirmingClear(false)}>{t('Cancel')}</Button>
                </div>
              )
            : (
                <Button
                  variant="ghost"
                  size="xs"
                  disabled={items.length === 0}
                  onClick={() => setConfirmingClear(true)}
                >
                  <Trash2 data-icon="inline-start" />
                  {t('Clear all')}
                </Button>
              )}
        </div>

        <ScrollArea className="min-h-0 flex-1">
          {presentedItems.length === 0
            ? (
                <Empty className="min-h-full border-0">
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><Inbox /></EmptyMedia>
                    <EmptyTitle>{t('Your local drop is empty')}</EmptyTitle>
                    <EmptyDescription>{t('Paste JSON, logs, SQL, code, or any text below.')}</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )
            : (
                <div className="flex flex-col gap-3 p-3">
                  {presentedItems.map((item) => {
                    const lineCount = item.display.split('\n').length
                    const isLong = item.display.length > LONG_CONTENT_LENGTH || lineCount > LONG_CONTENT_LINES
                    const isExpanded = expandedItems.has(item.id)

                    return (
                      <Card key={item.id} className="gap-0 overflow-hidden py-0 shadow-xs">
                        <CardHeader className="gap-1 border-b border-border/60 px-3 py-2.5">
                          <CardTitle>
                            <Badge variant={item.isJson ? 'secondary' : 'outline'}>
                              {item.isJson ? 'JSON' : t('Plain Text')}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {new Intl.DateTimeFormat(locale, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            }).format(item.createdAt)}
                          </CardDescription>
                          <CardAction className="flex items-center gap-1">
                            {isLong && (
                              <Button variant="ghost" size="xs" onClick={() => toggleExpanded(item.id)}>
                                {t(isExpanded ? 'Show less' : 'Show more')}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label={t('Copy')}
                              title={t('Copy')}
                              onClick={() => copyText(item.content)}
                            >
                              <ClipboardCopy data-icon="inline-start" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label={t('Delete')}
                              title={t('Delete')}
                              onClick={() => deleteItem(item.id)}
                            >
                              <Trash2 data-icon="inline-start" />
                            </Button>
                          </CardAction>
                        </CardHeader>
                        <CardContent className="relative px-0">
                          <pre
                            className={cn(
                              'overflow-auto whitespace-pre-wrap break-words px-3 py-3 font-mono text-xs leading-relaxed',
                              isLong && !isExpanded ? 'max-h-56' : 'max-h-[60vh]',
                            )}
                          >
                            {item.display}
                          </pre>
                          {isLong && !isExpanded && (
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-card to-transparent" />
                          )}
                        </CardContent>
                        <CardFooter className="justify-between gap-3 border-t border-border/60 px-3 py-2">
                          <p className="text-[11px] text-muted-foreground">
                            {item.isJson
                              ? t('Formatted for viewing. Copy keeps the original.')
                              : t('{lines} lines · {characters} characters', {
                                  lines: lineCount,
                                  characters: item.content.length,
                                })}
                          </p>
                        </CardFooter>
                      </Card>
                    )
                  })}
                  <div ref={listEndRef} />
                </div>
              )}
        </ScrollArea>

        <form className="flex shrink-0 flex-col gap-2 border-t border-border/70 bg-background p-3" onSubmit={handleSubmit}>
          <Textarea
            ref={inputRef}
            value={draft}
            className="max-h-44 min-h-24 resize-none overflow-y-auto font-mono text-sm"
            placeholder={t('Paste any text here...')}
            aria-label={t('Temporary text')}
            onChange={event => setDraft(event.target.value)}
            onKeyDown={handleInputKeyDown}
          />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <KbdGroup>
                <Kbd>{isMac ? '⌘' : 'Ctrl'}</Kbd>
                <Kbd>Enter</Kbd>
              </KbdGroup>
              <span>{t('to add')}</span>
            </div>
            <Button type="submit" size="sm" disabled={!draft.trim()}>
              <Send data-icon="inline-start" />
              {t('Add')}
            </Button>
          </div>
        </form>
      </div>
    </SheetContent>
  )
}
