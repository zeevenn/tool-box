import { json } from '@codemirror/lang-json'
import { Copy, Minimize2, RefreshCw, WrapText } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'

export function JsonFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [indentSize, setIndentSize] = useState(2)

  void json // ensure import is used (for future CodeMirror integration)

  const format = () => {
    if (!input.trim()) {
      setError('Input is empty')
      setOutput('')
      return
    }
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed, null, indentSize))
      setError(null)
    }
    catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }

  const minify = () => {
    if (!input.trim()) {
      setError('Input is empty')
      setOutput('')
      return
    }
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed))
      setError(null)
    }
    catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }

  const validate = () => {
    if (!input.trim()) {
      toast.error('Input is empty')
      return
    }
    try {
      JSON.parse(input)
      toast.success('Valid JSON')
      setError(null)
    }
    catch (e) {
      const msg = (e as Error).message
      setError(msg)
      toast.error(`Invalid JSON: ${msg}`)
    }
  }

  const copy = async () => {
    const text = output || input
    if (!text) {
      toast.error('Nothing to copy')
      return
    }
    await navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-background shrink-0 flex-wrap">
        <Button size="sm" onClick={format}>
          <WrapText className="w-4 h-4" />
          Format
        </Button>
        <Button size="sm" variant="outline" onClick={minify}>
          <Minimize2 className="w-4 h-4" />
          Minify
        </Button>
        <Button size="sm" variant="outline" onClick={validate}>
          <RefreshCw className="w-4 h-4" />
          Validate
        </Button>
        <Button size="sm" variant="outline" onClick={copy}>
          <Copy className="w-4 h-4" />
          Copy
        </Button>

        <Separator orientation="vertical" className="h-5" />

        <div className="flex items-center gap-2">
          <Typography variant="muted" className="text-xs">Indent:</Typography>
          {[2, 4].map(n => (
            <Button
              key={n}
              size="sm"
              variant={indentSize === n ? 'secondary' : 'ghost'}
              className="w-8 h-8 p-0"
              onClick={() => setIndentSize(n)}
            >
              {n}
            </Button>
          ))}
        </div>
      </div>

      {/* Editors */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col border-r border-border">
          <div className="px-3 py-1.5 border-b border-border bg-muted/40">
            <Typography variant="muted" className="text-xs">Input</Typography>
          </div>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Paste JSON here..."
            spellCheck={false}
            className="flex-1 resize-none p-3 font-mono text-sm bg-background focus:outline-none"
          />
        </div>

        <div className="flex-1 flex flex-col">
          <div className="px-3 py-1.5 border-b border-border bg-muted/40">
            <Typography variant="muted" className="text-xs">Output</Typography>
          </div>
          {error
            ? (
                <div className="flex-1 p-3">
                  <Typography variant="small" className="text-destructive font-mono">{error}</Typography>
                </div>
              )
            : (
                <textarea
                  value={output}
                  readOnly
                  placeholder="Formatted JSON will appear here..."
                  spellCheck={false}
                  className="flex-1 resize-none p-3 font-mono text-sm bg-background focus:outline-none"
                />
              )}
        </div>
      </div>
    </div>
  )
}
