import { Copy, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { useI18n } from '@/context/i18n-provider'

function formatDate(date: Date, locale: string) {
  return {
    iso: date.toISOString(),
    local: date.toLocaleString(locale),
    utc: date.toUTCString(),
    relative: getRelative(date, locale),
  }
}

function getRelative(date: Date, locale: string): string {
  const diff = Date.now() - date.getTime()
  const abs = Math.abs(diff)
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' })

  if (abs < 60_000)
    return formatter.format(-Math.round(diff / 1000), 'second')
  if (abs < 3_600_000)
    return formatter.format(-Math.round(diff / 60_000), 'minute')
  if (abs < 86_400_000)
    return formatter.format(-Math.round(diff / 3_600_000), 'hour')
  return formatter.format(-Math.round(diff / 86_400_000), 'day')
}

interface Parsed {
  iso: string
  local: string
  utc: string
  relative: string
}

export function TimestampConverter() {
  const { locale, t } = useI18n()
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
      setError(t('Cannot parse input'))
      setParsed(null)
    }
    else {
      setError(null)
      setParsed(formatDate(date, locale))
    }
  }

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value)
    toast.success(t('Copied'))
  }

  const applyNow = () => {
    parse(String(now))
  }

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4 sm:p-6">
      {/* Current timestamp */}
      <div className="flex items-center gap-3 rounded-xl border border-primary/15 bg-primary/6 p-4 sm:p-5">
        <div>
          <Typography variant="muted" className="text-xs mb-1">{t('Current Unix Timestamp (seconds)')}</Typography>
          <Typography className="font-mono text-2xl font-semibold tracking-tight sm:text-3xl">{now}</Typography>
        </div>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={applyNow}>
            <RefreshCw data-icon="inline-start" />
            {t('Use Now')}
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => copy(String(now))}>
            <Copy data-icon="inline-start" />
          </Button>
        </div>
      </div>

      {/* Input */}
      <div className="flex flex-col gap-2">
        <Typography variant="muted" className="text-xs">{t('Enter a timestamp (Unix seconds/ms) or date string')}</Typography>
        <input
          value={input}
          onChange={e => parse(e.target.value)}
          placeholder="e.g. 1700000000 or 2024-01-01T00:00:00Z"
          className="w-full rounded-xl border border-input bg-background/60 px-4 py-3 font-mono text-sm shadow-xs outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
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
              [t('Local'), parsed.local],
              ['UTC', parsed.utc],
              [t('Relative'), parsed.relative],
              ['Unix (s)', String(Math.floor(new Date(parsed.iso).getTime() / 1000))],
              ['Unix (ms)', String(new Date(parsed.iso).getTime())],
            ] as [string, string][]
          ).map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 px-4 py-3.5 transition-colors hover:bg-muted/35">
              <div>
                <Typography variant="muted" className="text-xs mb-0.5">{label}</Typography>
                <Typography className="font-mono text-sm">{value}</Typography>
              </div>
              <Button size="sm" variant="ghost" onClick={() => copy(value)}>
                <Copy data-icon="inline-start" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
