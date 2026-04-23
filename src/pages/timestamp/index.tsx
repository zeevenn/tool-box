import { Copy, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'

function formatDate(date: Date) {
  return {
    iso: date.toISOString(),
    local: date.toLocaleString(),
    utc: date.toUTCString(),
    relative: getRelative(date),
  }
}

function getRelative(date: Date): string {
  const diff = Date.now() - date.getTime()
  const abs = Math.abs(diff)
  const sign = diff < 0 ? 'in ' : ''
  const suffix = diff < 0 ? '' : ' ago'

  if (abs < 1000)
    return 'just now'
  if (abs < 60_000)
    return `${sign}${Math.floor(abs / 1000)}s${suffix}`
  if (abs < 3_600_000)
    return `${sign}${Math.floor(abs / 60_000)}m${suffix}`
  if (abs < 86_400_000)
    return `${sign}${Math.floor(abs / 3_600_000)}h${suffix}`
  return `${sign}${Math.floor(abs / 86_400_000)}d${suffix}`
}

interface Parsed {
  iso: string
  local: string
  utc: string
  relative: string
}

export function TimestampConverter() {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))
  const [input, setInput] = useState('')
  const [parsed, setParsed] = useState<Parsed | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000)
    return () => clearInterval(id)
  }, [])

  const parse = (value: string) => {
    setInput(value)
    if (!value.trim()) {
      setParsed(null)
      setError(null)
      return
    }
    const num = Number(value.trim())
    let date: Date
    if (!Number.isNaN(num)) {
      // auto-detect seconds vs milliseconds
      date = num > 1e12 ? new Date(num) : new Date(num * 1000)
    }
    else {
      date = new Date(value.trim())
    }

    if (Number.isNaN(date.getTime())) {
      setError('Cannot parse input')
      setParsed(null)
    }
    else {
      setError(null)
      setParsed(formatDate(date))
    }
  }

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value)
    toast.success('Copied')
  }

  const applyNow = () => {
    parse(String(now))
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4 gap-4">
      {/* Current timestamp */}
      <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-muted/30">
        <div>
          <Typography variant="muted" className="text-xs mb-1">Current Unix Timestamp (seconds)</Typography>
          <Typography className="font-mono text-2xl font-semibold">{now}</Typography>
        </div>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={applyNow}>
            <RefreshCw className="w-4 h-4" />
            Use Now
          </Button>
          <Button size="sm" variant="ghost" onClick={() => copy(String(now))}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Input */}
      <div className="flex flex-col gap-2">
        <Typography variant="muted" className="text-xs">Enter a timestamp (Unix seconds/ms) or date string</Typography>
        <input
          value={input}
          onChange={e => parse(e.target.value)}
          placeholder="e.g. 1700000000 or 2024-01-01T00:00:00Z"
          className="w-full border border-border rounded-md px-3 py-2 font-mono text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {error && <Typography variant="small" className="text-destructive">{error}</Typography>}
      </div>

      {/* Results */}
      {parsed && (
        <div className="flex flex-col gap-2">
          <Separator />
          {(
            [
              ['ISO 8601', parsed.iso],
              ['Local', parsed.local],
              ['UTC', parsed.utc],
              ['Relative', parsed.relative],
              ['Unix (s)', String(Math.floor(new Date(parsed.iso).getTime() / 1000))],
              ['Unix (ms)', String(new Date(parsed.iso).getTime())],
            ] as [string, string][]
          ).map(([label, value]) => (
            <div key={label} className="flex items-center justify-between px-4 py-3 rounded-lg border border-border">
              <div>
                <Typography variant="muted" className="text-xs mb-0.5">{label}</Typography>
                <Typography className="font-mono text-sm">{value}</Typography>
              </div>
              <Button size="sm" variant="ghost" onClick={() => copy(value)}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
