import type { LanguageSupport } from '@codemirror/language'
import type { MergeView } from '@codemirror/merge'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { ArrowLeftRight, CloudUpload, Copy, Share2, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { CodeMirrorMerge } from '@/components/common'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { compress, decompress } from '@/utils/compress'

import { useDragAndDrop } from '../../hooks/use-drag-and-drop'

type DropZone = 'original' | 'modified'
type Language = 'plain' | 'javascript' | 'typescript' | 'json'

const DROP_ZONE = {
  ORIGINAL: 'original' as const,
  MODIFIED: 'modified' as const,
} satisfies Record<string, DropZone>

const LANGUAGE_OPTIONS: { value: Language, label: string }[] = [
  { value: 'plain', label: 'Plain Text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'json', label: 'JSON' },
]

function getLanguageExtension(lang: Language): LanguageSupport | undefined {
  switch (lang) {
    case 'javascript': return javascript({ jsx: true })
    case 'typescript': return javascript({ jsx: true, typescript: true })
    case 'json': return json()
    default: return undefined
  }
}

export function TextDiff() {
  const [originalText, setOriginalText] = useState(
    'function hello() {\n  console.log("Hello World");\n}',
  )
  const [modifiedText, setModifiedText] = useState(
    'function hello() {\n  console.log("Hello, World!");\n  return "Hello";\n}',
  )
  const [language, setLanguage] = useState<Language>('plain')
  const mergeViewRef = useRef<MergeView | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shared = params.get('s')
    if (!shared)
      return
    void (async () => {
      try {
        const json = await decompress(shared)
        const { original, modified, lang } = JSON.parse(json)
        if (typeof original === 'string')
          setOriginalText(original)
        if (typeof modified === 'string')
          setModifiedText(modified)
        if (lang)
          setLanguage(lang)
        // Clean URL without reload
        window.history.replaceState({}, '', window.location.pathname)
      }
      catch {
        toast.error('Failed to load shared diff')
      }
    })()
  }, [])

  const formatContentIfJSON = (content: string): string => {
    try {
      const formatted = JSON.stringify(JSON.parse(content), null, 2)
      return formatted
    }
    catch {
      return content
    }
  }

  const readFile = (file: File, side: DropZone) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const rawContent = e.target?.result as string
      const content = formatContentIfJSON(rawContent)

      if (side === DROP_ZONE.ORIGINAL) {
        setOriginalText(content)
      }
      else {
        setModifiedText(content)
      }
    }
    reader.readAsText(file)
  }

  const {
    isDragging: isOriginalDragging,
    registerDropZone: registerOriginalDropZone,
  } = useDragAndDrop(null, {
    onFilesDrop: (files) => {
      const file = files[0]
      readFile(file, DROP_ZONE.ORIGINAL)
    },
  })

  const {
    isDragging: isModifiedDragging,
    registerDropZone: registerModifiedDropZone,
  } = useDragAndDrop(null, {
    onFilesDrop: (files) => {
      const file = files[0]
      readFile(file, DROP_ZONE.MODIFIED)
    },
  })

  const handleMount = (view: MergeView) => {
    mergeViewRef.current = view
    const aEditor = view.a.dom
    const bEditor = view.b.dom

    if (aEditor) {
      registerOriginalDropZone(aEditor)
    }
    if (bEditor) {
      registerModifiedDropZone(bEditor)
    }
  }

  const handleSwap = () => {
    setOriginalText(modifiedText)
    setModifiedText(originalText)
  }

  const handleClear = () => {
    setOriginalText('')
    setModifiedText('')
  }

  const handleShare = async () => {
    try {
      const payload = JSON.stringify({ original: originalText, modified: modifiedText, lang: language })
      const compressed = await compress(payload)
      const param = encodeURIComponent(compressed)
      if (param.length > 4096) {
        toast.warning('Link generated but may be too long to share reliably (content exceeds ~4KB)')
      }
      const url = `${window.location.origin}${window.location.pathname}?s=${param}`
      await navigator.clipboard.writeText(url)
      toast.success('Share link copied to clipboard')
    }
    catch {
      toast.error('Failed to generate share link')
    }
  }

  const handleCopyDiff = async () => {
    if (!mergeViewRef.current)
      return
    const orig = originalText.split('\n')
    const mod = modifiedText.split('\n')
    const lines: string[] = []
    const maxLen = Math.max(orig.length, mod.length)
    for (let i = 0; i < maxLen; i++) {
      if (i >= orig.length) {
        lines.push(`+ ${mod[i]}`)
      }
      else if (i >= mod.length) {
        lines.push(`- ${orig[i]}`)
      }
      else if (orig[i] !== mod[i]) {
        lines.push(`- ${orig[i]}`)
        lines.push(`+ ${mod[i]}`)
      }
      else {
        lines.push(`  ${orig[i]}`)
      }
    }
    await navigator.clipboard.writeText(lines.join('\n'))
    toast.success('Diff copied to clipboard')
  }

  const getDiffStats = () => {
    const orig = originalText.split('\n')
    const mod = modifiedText.split('\n')
    let added = 0
    let removed = 0
    const maxLen = Math.max(orig.length, mod.length)
    for (let i = 0; i < maxLen; i++) {
      if (i >= orig.length) {
        added++
      }
      else if (i >= mod.length) {
        removed++
      }
      else if (orig[i] !== mod[i]) {
        added++
        removed++
      }
    }
    return { added, removed }
  }

  const stats = getDiffStats()
  const langExtension = getLanguageExtension(language)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-background shrink-0 flex-wrap">
        <Select value={language} onValueChange={v => setLanguage(v as Language)}>
          <SelectTrigger className="w-[140px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGE_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="h-5" />

        <Button variant="ghost" size="sm" onClick={handleSwap} title="Swap original and modified">
          <ArrowLeftRight className="w-4 h-4" />
          <span className="hidden sm:inline">Swap</span>
        </Button>

        <Button variant="ghost" size="sm" onClick={handleCopyDiff} title="Copy diff">
          <Copy className="w-4 h-4" />
          <span className="hidden sm:inline">Copy Diff</span>
        </Button>

        <Button variant="ghost" size="sm" onClick={handleClear} title="Clear both sides">
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Clear</span>
        </Button>

        <Button variant="ghost" size="sm" onClick={handleShare} title="Copy share link">
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share</span>
        </Button>

        <Separator orientation="vertical" className="h-5" />

        <div className="flex items-center gap-2">
          {stats.added > 0 && (
            <Typography variant="small" className="text-green-600 dark:text-green-400 font-mono">
              +
              {stats.added}
            </Typography>
          )}
          {stats.removed > 0 && (
            <Typography variant="small" className="text-red-600 dark:text-red-400 font-mono">
              -
              {stats.removed}
            </Typography>
          )}
          {stats.added === 0 && stats.removed === 0 && (
            <Typography variant="muted" className="text-xs">No differences</Typography>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative overflow-hidden">
        <CodeMirrorMerge
          originalValue={originalText}
          modifiedValue={modifiedText}
          onOriginalChange={setOriginalText}
          onModifiedChange={setModifiedText}
          onOriginalPaste={formatContentIfJSON}
          onModifiedPaste={formatContentIfJSON}
          language={langExtension}
          onMount={handleMount}
        />

        {/* Original Drop Overlay */}
        {isOriginalDragging && (
          <div className="absolute top-0 left-0 w-1/2 h-full pointer-events-none bg-primary/20 border-2 border-primary border-dashed">
            <div className="flex items-center justify-center h-full">
              <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg">
                <div className="flex items-center gap-2">
                  <CloudUpload className="size-5" />
                  <Typography variant="small">
                    Drag to update original content
                  </Typography>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modified Drop Overlay */}
        {isModifiedDragging && (
          <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none bg-accent/20 border-2 border-accent-foreground border-dashed">
            <div className="flex items-center justify-center h-full">
              <div className="bg-accent text-accent-foreground px-4 py-2 rounded-lg shadow-lg">
                <div className="flex items-center gap-2">
                  <CloudUpload className="size-5" />
                  <Typography variant="small">
                    Drag to update modified content
                  </Typography>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
