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
        <mark key={`m-${m.index}`} className="bg-yellow-200 dark:bg-yellow-800 rounded-sm px-0.5">
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
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-background shrink-0 flex-wrap">
        <Typography variant="muted" className="text-xs font-mono">/</Typography>
        <input
          value={pattern}
          onChange={e => setPattern(e.target.value)}
          placeholder="pattern"
          spellCheck={false}
          className="flex-1 min-w-0 font-mono text-sm bg-background focus:outline-none px-1"
        />
        <Typography variant="muted" className="text-xs font-mono">/</Typography>

        <Separator orientation="vertical" className="h-5" />

        <div className="flex items-center gap-1">
          {FLAG_OPTIONS.map(flag => (
            <Button
              key={flag}
              size="sm"
              variant={flags.has(flag) ? 'secondary' : 'ghost'}
              className="w-7 h-7 p-0 font-mono text-xs"
              onClick={() => toggleFlag(flag)}
            >
              {flag}
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-5" />

        <div className="flex items-center gap-2">
          {error
            ? <Typography variant="small" className="text-destructive">{error}</Typography>
            : pattern
              ? (
                  <Typography variant="small" className={matches.length > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                    {matches.length}
                    {' '}
                    match
                    {matches.length !== 1 ? 'es' : ''}
                  </Typography>
                )
              : null}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Test text */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/40">
            <Typography variant="muted" className="text-xs">Test Text</Typography>
            <Button size="sm" variant="ghost" className="h-6" onClick={() => setTestText('')}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          <div className="relative flex-1">
            <textarea
              value={testText}
              onChange={e => setTestText(e.target.value)}
              placeholder="Enter text to test..."
              spellCheck={false}
              className="absolute inset-0 resize-none p-3 font-mono text-sm bg-transparent focus:outline-none text-transparent caret-foreground"
            />
            <pre className="absolute inset-0 p-3 font-mono text-sm whitespace-pre-wrap break-words pointer-events-none overflow-hidden">
              {renderHighlighted()}
            </pre>
          </div>
        </div>

        {/* Match list */}
        {matches.length > 0 && (
          <>
            <Separator orientation="vertical" />
            <div className="w-64 flex flex-col overflow-hidden">
              <div className="px-3 py-1.5 border-b border-border bg-muted/40">
                <Typography variant="muted" className="text-xs">Matches</Typography>
              </div>
              <div className="flex-1 overflow-y-auto">
                {matches.map((m, i) => (
                  <div key={`${m.index}-${m.value}`} className="px-3 py-2 border-b border-border last:border-0">
                    <div className="flex items-center justify-between">
                      <Typography variant="muted" className="text-xs">
                        #
                        {i + 1}
                        {' '}
                        @
                        {m.index}
                      </Typography>
                      <Button size="sm" variant="ghost" className="h-5 px-1" onClick={() => copy(m.value)}>
                        <Copy className="w-3 h-3" />
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
