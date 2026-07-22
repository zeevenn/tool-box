import { Copy, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'

export function UrlEncode() {
  const [decoded, setDecoded] = useState('')
  const [encoded, setEncoded] = useState('')

  const handleDecodedChange = (value: string) => {
    setDecoded(value)
    try {
      setEncoded(encodeURIComponent(value))
    }
    catch {
      setEncoded('')
    }
  }

  const handleEncodedChange = (value: string) => {
    setEncoded(value)
    try {
      setDecoded(decodeURIComponent(value))
    }
    catch {
      setDecoded('')
    }
  }

  const copy = async (value: string, label: string) => {
    if (!value) {
      toast.error('Nothing to copy')
      return
    }
    await navigator.clipboard.writeText(value)
    toast.success(`${label} copied to clipboard`)
  }

  const clear = () => {
    setDecoded('')
    setEncoded('')
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-background shrink-0">
        <Button size="sm" variant="ghost" onClick={clear}>
          <Trash2 className="w-4 h-4" />
          Clear
        </Button>
        <Typography variant="muted" className="text-xs ml-auto">Converts in real-time</Typography>
      </div>

      {/* Panels */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col border-r border-border">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/40">
            <Typography variant="muted" className="text-xs">Decoded (Plain URL)</Typography>
            <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => copy(decoded, 'Decoded')}>
              <Copy className="w-3 h-3" />
            </Button>
          </div>
          <textarea
            value={decoded}
            onChange={e => handleDecodedChange(e.target.value)}
            placeholder="https://example.com/path?q=hello world&lang=中文"
            spellCheck={false}
            className="flex-1 resize-none p-3 font-mono text-sm bg-background focus:outline-none"
          />
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/40">
            <Typography variant="muted" className="text-xs">Encoded</Typography>
            <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => copy(encoded, 'Encoded')}>
              <Copy className="w-3 h-3" />
            </Button>
          </div>
          <textarea
            value={encoded}
            onChange={e => handleEncodedChange(e.target.value)}
            placeholder="https%3A%2F%2Fexample.com%2Fpath%3Fq%3Dhello%20world%26lang%3D%E4%B8%AD%E6%96%87"
            spellCheck={false}
            className="flex-1 resize-none p-3 font-mono text-sm bg-background focus:outline-none"
          />
        </div>
      </div>
    </div>
  )
}
