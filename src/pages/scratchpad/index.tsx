import { Copy, Download, Eraser, FilePlus2, NotebookPen, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { CodeMirrorEditor } from '@/components/common'
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
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useI18n } from '@/context/i18n-provider'
import { useCopyText } from '@/hooks/use-copy-text'
import { cn } from '@/lib/utils'

interface ScratchDraft {
  id: string
  title: string
  content: string
  updatedAt: number
}

interface ScratchpadWorkspace {
  activeId: string
  drafts: ScratchDraft[]
}

type SaveStatus = 'saved' | 'saving' | 'error'

const STORAGE_KEY = 'tool-box-scratchpad-v1'
const MAX_DRAFTS = 20

function createDraft(): ScratchDraft {
  return {
    id: crypto.randomUUID(),
    title: '',
    content: '',
    updatedAt: Date.now(),
  }
}

function createWorkspace(): ScratchpadWorkspace {
  const draft = createDraft()
  return { activeId: draft.id, drafts: [draft] }
}

function isDraft(value: unknown): value is ScratchDraft {
  if (!value || typeof value !== 'object')
    return false

  const draft = value as Partial<ScratchDraft>
  return typeof draft.id === 'string'
    && typeof draft.title === 'string'
    && typeof draft.content === 'string'
    && typeof draft.updatedAt === 'number'
}

function loadWorkspace(): ScratchpadWorkspace {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved)
      return createWorkspace()

    const parsed = JSON.parse(saved) as Partial<ScratchpadWorkspace>
    const drafts = Array.isArray(parsed.drafts) ? parsed.drafts.filter(isDraft).slice(0, MAX_DRAFTS) : []
    if (drafts.length === 0)
      return createWorkspace()

    const activeId = drafts.some(draft => draft.id === parsed.activeId)
      ? parsed.activeId as string
      : drafts[0].id
    return { activeId, drafts }
  }
  catch {
    return createWorkspace()
  }
}

function getDraftLabel(draft: ScratchDraft, fallback: string) {
  const firstContentLine = draft.content.split('\n').find(line => line.trim())?.trim()
  return draft.title.trim() || firstContentLine || fallback
}

function getWordCount(content: string, locale: string) {
  if (!content.trim())
    return 0

  if ('Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(locale, { granularity: 'word' })
    return [...segmenter.segment(content)].filter(segment => segment.isWordLike).length
  }

  return content.trim().split(/\s+/).length
}

function safeFilename(value: string) {
  const filename = value.trim().replace(/[\\/:*?"<>|]+/g, '-').slice(0, 80)
  return filename || 'scratch-draft'
}

export function Scratchpad() {
  const { locale, t } = useI18n()
  const copyText = useCopyText()
  const [workspace, setWorkspace] = useState(loadWorkspace)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [pendingAction, setPendingAction] = useState<'clear' | 'delete' | null>(null)
  const activeDraft = workspace.drafts.find(draft => draft.id === workspace.activeId) ?? workspace.drafts[0]

  useEffect(() => {
    setSaveStatus('saving')
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace))
        setSaveStatus('saved')
      }
      catch {
        setSaveStatus('error')
      }
    }, 250)

    return () => window.clearTimeout(timer)
  }, [workspace])

  const stats = useMemo(() => ({
    characters: activeDraft.content.length,
    lines: activeDraft.content ? activeDraft.content.split('\n').length : 0,
    words: getWordCount(activeDraft.content, locale),
  }), [activeDraft.content, locale])

  const updateActiveDraft = (updates: Partial<Pick<ScratchDraft, 'title' | 'content'>>) => {
    setWorkspace(current => ({
      ...current,
      drafts: current.drafts.map(draft => draft.id === current.activeId
        ? { ...draft, ...updates, updatedAt: Date.now() }
        : draft),
    }))
  }

  const addDraft = () => {
    if (workspace.drafts.length >= MAX_DRAFTS) {
      toast.error(t('You can keep up to {max} drafts.', { max: MAX_DRAFTS }))
      return
    }

    const draft = createDraft()
    setWorkspace(current => ({ activeId: draft.id, drafts: [draft, ...current.drafts] }))
  }

  const clearDraft = () => {
    updateActiveDraft({ title: '', content: '' })
  }

  const deleteDraft = () => {
    setWorkspace((current) => {
      const remaining = current.drafts.filter(draft => draft.id !== current.activeId)
      if (remaining.length === 0)
        return createWorkspace()
      return { activeId: remaining[0].id, drafts: remaining }
    })
  }

  const downloadDraft = () => {
    const label = getDraftLabel(activeDraft, t('Untitled draft'))
    const blob = new Blob([activeDraft.content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${safeFilename(label)}.txt`
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success(t('Draft downloaded'))
  }

  const saveStatusLabel = {
    error: t('Unable to save locally'),
    saved: t('Saved locally'),
    saving: t('Saving...'),
  }[saveStatus]

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border/70 bg-card/80 px-3 py-2.5 sm:px-4">
        <Button size="sm" onClick={addDraft}>
          <FilePlus2 data-icon="inline-start" />
          {t('New draft')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!activeDraft.content}
          onClick={() => copyText(activeDraft.content, t('Draft copied'))}
        >
          <Copy data-icon="inline-start" />
          <span className="hidden sm:inline">{t('Copy')}</span>
        </Button>
        <Button size="sm" variant="outline" disabled={!activeDraft.content} onClick={downloadDraft}>
          <Download data-icon="inline-start" />
          <span className="hidden sm:inline">{t('Download')}</span>
        </Button>

        <Separator orientation="vertical" className="hidden !h-5 sm:block" />

        <Button size="sm" variant="ghost" disabled={!activeDraft.content && !activeDraft.title} onClick={() => setPendingAction('clear')}>
          <Eraser data-icon="inline-start" />
          <span className="hidden sm:inline">{t('Clear')}</span>
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setPendingAction('delete')}>
          <Trash2 data-icon="inline-start" />
          <span className="hidden sm:inline">{t('Delete')}</span>
        </Button>

        <span
          className={cn(
            'ml-auto text-xs text-muted-foreground',
            saveStatus === 'error' && 'text-destructive',
          )}
          role="status"
        >
          {saveStatusLabel}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="flex h-40 shrink-0 flex-col border-b border-border/70 bg-muted/20 md:h-auto md:w-64 md:border-r md:border-b-0">
          <div className="flex shrink-0 items-center justify-between border-b border-border/70 px-3 py-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {t('Drafts')}
            </span>
            <span className="text-xs text-muted-foreground">
              {workspace.drafts.length}
              /
              {MAX_DRAFTS}
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            <div className="flex flex-col gap-1">
              {workspace.drafts.map((draft) => {
                const active = draft.id === workspace.activeId
                return (
                  <button
                    key={draft.id}
                    type="button"
                    className={cn(
                      'flex w-full cursor-pointer items-start gap-2 rounded-lg px-3 py-2 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground',
                    )}
                    onClick={() => setWorkspace(current => ({ ...current, activeId: draft.id }))}
                  >
                    <NotebookPen className="mt-0.5 size-3.5 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {getDraftLabel(draft, t('Untitled draft'))}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(draft.updatedAt)}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-border/70 bg-muted/15 px-4 py-2.5 sm:px-5">
            <input
              value={activeDraft.title}
              onChange={event => updateActiveDraft({ title: event.target.value })}
              placeholder={t('Untitled draft')}
              aria-label={t('Draft title')}
              className="w-full bg-transparent text-base font-semibold outline-none placeholder:text-muted-foreground/70"
            />
          </div>

          <div className="relative min-h-0 flex-1">
            <CodeMirrorEditor
              value={activeDraft.content}
              onChange={content => updateActiveDraft({ content })}
              placeholder={t('Write anything here...')}
              ariaLabel={t('Draft content')}
            />
          </div>

          <div className="flex shrink-0 items-center gap-3 border-t border-border/70 bg-muted/20 px-4 py-2 text-[11px] text-muted-foreground sm:px-5">
            <span>{t('{count} lines', { count: stats.lines })}</span>
            <span>{t('{count} words', { count: stats.words })}</span>
            <span>{t('{count} characters', { count: stats.characters })}</span>
            <span className="ml-auto hidden sm:inline">{t('Autosaved in this browser')}</span>
          </div>
        </section>
      </div>

      <AlertDialog open={pendingAction !== null} onOpenChange={open => !open && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction === 'delete' ? t('Delete this draft?') : t('Clear this draft?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction === 'delete'
                ? t('This permanently removes the current draft.')
                : t('This permanently removes the title and content from the current draft.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={pendingAction === 'delete' ? deleteDraft : clearDraft}
            >
              {pendingAction === 'delete' ? t('Delete') : t('Clear')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
