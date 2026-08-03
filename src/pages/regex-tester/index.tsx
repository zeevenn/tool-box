import { Copy, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'

const FLAG_OPTIONS = ['g', 'i', 'm', 's'] as const
type Flag = typeof FLAG_OPTIONS[number]

interface Match {
  index: number
  length: number
  value: string
  groups: Record<string, string>
}

export function RegexTester() {
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState<Set<Flag>>(() => new Set(['g'] as Flag[]))
  const [testText, setTestText] = useState('')

  const toggleFlag = (flag: Flag) => {
    setFlags((prev) => {
      const next = new Set(prev)
      if (next.has(flag))
        next.delete(flag)
      else
        next.add(flag)
      return next
    })
  }

  const { regex, error, matches } = useMemo(() => {
    if (!pattern) {
      return { regex: null, error: null, matches: [] }
    }
    try {
      const flagStr = [...flags].join('')
      const re = new RegExp(pattern, flagStr)
      const found: Match[] = []

      if (flags.has('g')) {
        let m: RegExpExecArray | null
        // eslint-disable-next-line no-cond-assign
        while ((m = re.exec(testText)) !== null) {
          found.push({
            index: m.index,
            length: m[0].length,
            value: m[0],
            groups: m.groups ?? {},
          })
          if (m[0].length === 0)
            re.lastIndex++
        }
      }
      else {
        const m = re.exec(testText)
        if (m) {
          found.push({
            index: m.index,
            length: m[0].length,
            value: m[0],
            groups: m.groups ?? {},
          })
        }
      }
      return { regex: re, error: null, matches: found }
    }
    catch (e) {
      return { regex: null, error: (e as Error).message, matches: [] }
    }
  }, [pattern, flags, testText])

  void regex

  const renderHighlighted = () => {
    if (!testText)
      return null
    if (!pattern || matches.length === 0) {
      return <span>{testText}</span>
    }

    const parts: React.ReactNode[] = []
    let cursor = 0
    for (const m of matches) {
      if (m.index > cursor) {
        parts.push(<span key={`t-${cursor}`}>{testText.slice(cursor, m.index)}</span>)
      }
      parts.push(
        <mark key={`m-${m.index}`} className="rounded-sm bg-primary/20 px-0.5 text-foreground">
          {testText.slice(m.index, m.index + m.length)}
        </mark>,
      )
      cursor = m.index + m.length
    }
    if (cursor < testText.length) {
      parts.push(<span key="t-end">{testText.slice(cursor)}</span>)
    }
    return parts
  }

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value)
    toast.success('Copied')
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Regex input */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border/70 bg-card/80 px-4 py-2.5">
        <Typography variant="muted" className="text-xs font-mono">/</Typography>
        <input
          value={pattern}
          onChange={e => setPattern(e.target.value)}
          placeholder="pattern"
          spellCheck={false}
          className="min-w-[140px] flex-1 bg-transparent px-1 font-mono text-sm outline-none"
        />
        <Typography variant="muted" className="text-xs font-mono">/</Typography>

        <Separator orientation="vertical" className="hidden !h-5 sm:block" />

        <div className="flex items-center gap-1">
          {FLAG_OPTIONS.map(flag => (
            <Button
              key={flag}
              size="xs"
              variant={flags.has(flag) ? 'secondary' : 'ghost'}
              className="size-7 p-0 font-mono text-xs"
              onClick={() => toggleFlag(flag)}
            >
              {flag}
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="hidden !h-5 sm:block" />

        <div className="flex items-center gap-2">
          {error
            ? <Typography variant="small" className="text-destructive">{error}</Typography>
            : pattern
              ? (
                  <Typography variant="small" className={matches.length > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
                    {matches.length}
                    {' '}
                    match
                    {matches.length !== 1 ? 'es' : ''}
                  </Typography>
                )
              : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* Test text */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-border/70 bg-muted/35 px-4 py-2">
            <Typography variant="muted" className="text-[11px] font-semibold uppercase tracking-[0.12em]">Test text</Typography>
            <Button size="icon-xs" variant="ghost" onClick={() => setTestText('')}>
              <Trash2 data-icon="inline-start" />
            </Button>
          </div>
          <div className="relative flex-1">
            <textarea
              value={testText}
              onChange={e => setTestText(e.target.value)}
              placeholder="Enter text to test..."
              spellCheck={false}
              className="absolute inset-0 resize-none bg-transparent p-4 font-mono text-sm leading-6 text-transparent caret-foreground outline-none"
            />
            <pre className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words p-4 font-mono text-sm leading-6">
              {renderHighlighted()}
            </pre>
          </div>
        </div>

        {/* Match list */}
        {matches.length > 0 && (
          <>
            <Separator orientation="vertical" className="hidden md:block" />
            <div className="flex max-h-48 w-full flex-col overflow-hidden border-t border-border/70 md:max-h-none md:w-72 md:border-t-0">
              <div className="border-b border-border/70 bg-muted/35 px-4 py-2">
                <Typography variant="muted" className="text-[11px] font-semibold uppercase tracking-[0.12em]">Matches</Typography>
              </div>
              <div className="flex-1 overflow-y-auto">
                {matches.map((m, i) => (
                  <div key={`${m.index}-${m.value}`} className="border-b border-border/70 px-4 py-3 last:border-0 hover:bg-muted/25">
                    <div className="flex items-center justify-between">
                      <Typography variant="muted" className="text-xs">
                        #
                        {i + 1}
                        {' '}
                        @
                        {m.index}
                      </Typography>
                      <Button size="icon-xs" variant="ghost" onClick={() => copy(m.value)}>
                        <Copy data-icon="inline-start" />
                      </Button>
                    </div>
                    <Typography className="font-mono text-sm truncate">{m.value}</Typography>
                    {Object.entries(m.groups).map(([k, v]) => (
                      <Typography key={k} variant="muted" className="text-xs font-mono">
                        {k}
                        :
                        {' '}
                        {v}
                      </Typography>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
