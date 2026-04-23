import { Copy, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'

function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  return decodeURIComponent(
    atob(padded)
      .split('')
      .map(c => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
      .join(''),
  )
}

function parseJwt(token: string): { header: object, payload: object, signature: string } | null {
  const parts = token.trim().split('.')
  if (parts.length !== 3)
    return null
  try {
    return {
      header: JSON.parse(base64UrlDecode(parts[0])),
      payload: JSON.parse(base64UrlDecode(parts[1])),
      signature: parts[2],
    }
  }
  catch {
    return null
  }
}

function formatJson(obj: object): string {
  return JSON.stringify(obj, null, 2)
}

function getExpiry(payload: object): { expired: boolean, label: string } | null {
  const exp = (payload as Record<string, unknown>).exp
  if (typeof exp !== 'number')
    return null
  const date = new Date(exp * 1000)
  const expired = date.getTime() < Date.now()
  return {
    expired,
    label: date.toLocaleString(),
  }
}

interface SectionProps {
  title: string
  content: string
  badge?: React.ReactNode
}

function Section({ title, content, badge }: SectionProps) {
  const copy = async () => {
    await navigator.clipboard.writeText(content)
    toast.success(`${title} copied`)
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Typography variant="muted" className="text-xs font-semibold uppercase tracking-wider">{title}</Typography>
          {badge}
        </div>
        <Button size="sm" variant="ghost" className="h-6 px-2" onClick={copy}>
          <Copy className="w-3 h-3" />
        </Button>
      </div>
      <pre className="p-3 rounded-lg border border-border bg-muted/30 font-mono text-sm overflow-x-auto whitespace-pre-wrap break-all">
        {content}
      </pre>
    </div>
  )
}

export function JwtDecoder() {
  const [input, setInput] = useState('')

  const decoded = input.trim() ? parseJwt(input.trim()) : null
  const isValid = decoded !== null
  const expiry = decoded ? getExpiry(decoded.payload) : null

  const copy = async () => {
    await navigator.clipboard.writeText(input)
    toast.success('Token copied')
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4 gap-4">
      {/* Input */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Typography variant="muted" className="text-xs">JWT Token</Typography>
          <div className="flex gap-2">
            {input && (
              <Typography variant="small" className={isValid ? 'text-green-600 dark:text-green-400' : 'text-destructive'}>
                {isValid ? 'Valid structure' : 'Invalid JWT'}
              </Typography>
            )}
            <Button size="sm" variant="ghost" className="h-6" onClick={copy}>
              <Copy className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" className="h-6" onClick={() => setInput('')}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Paste your JWT here..."
          rows={4}
          spellCheck={false}
          className="resize-none border border-border rounded-md p-3 font-mono text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring break-all"
        />
        <Typography variant="muted" className="text-xs">Decoded client-side only — signature is not verified.</Typography>
      </div>

      {/* Decoded sections */}
      {decoded && (
        <div className="flex flex-col gap-4 overflow-y-auto">
          <Section title="Header" content={formatJson(decoded.header)} />
          <Section
            title="Payload"
            content={formatJson(decoded.payload)}
            badge={
              expiry
                ? (
                    <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${expiry.expired ? 'bg-destructive/10 text-destructive' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                      {expiry.expired ? 'Expired' : 'Valid'}
                      {' '}
                      exp:
                      {' '}
                      {expiry.label}
                    </span>
                  )
                : null
            }
          />
          <Section title="Signature" content={decoded.signature} />
        </div>
      )}
    </div>
  )
}
