import { ArrowDownUp, Copy, Image, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'

export function Base64() {
  const [text, setText] = useState('')
  const [encoded, setEncoded] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const encode = () => {
    if (!text.trim()) {
      toast.error('Input is empty')
      return
    }
    try {
      setEncoded(btoa(unescape(encodeURIComponent(text))))
    }
    catch {
      toast.error('Failed to encode — contains invalid characters')
    }
  }

  const decode = () => {
    if (!encoded.trim()) {
      toast.error('Input is empty')
      return
    }
    try {
      setText(decodeURIComponent(escape(atob(encoded.trim()))))
    }
    catch {
      toast.error('Invalid Base64 input')
    }
  }

  const handleAction = () => {
    if (mode === 'encode') {
      encode()
    }
    else {
      decode()
    }
  }

  const readImageFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setEncoded(dataUrl)
      setText('')
      setMode('decode')
      toast.success(`Image loaded: ${file.name}`)
    }
    reader.readAsDataURL(file)
  }

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file?.type.startsWith('image/')) {
      toast.error('Please drop an image file')
      return
    }
    readImageFile(file)
  }

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file)
      return
    readImageFile(file)
  }

  const copy = async (value: string) => {
    if (!value) {
      toast.error('Nothing to copy')
      return
    }
    await navigator.clipboard.writeText(value)
    toast.success('Copied to clipboard')
  }

  const clear = () => {
    setText('')
    setEncoded('')
  }

  const topLabel = mode === 'encode' ? 'Plain Text' : 'Base64'
  const bottomLabel = mode === 'encode' ? 'Base64' : 'Plain Text'
  const topValue = mode === 'encode' ? text : encoded
  const bottomValue = mode === 'encode' ? encoded : text
  const setTopValue = mode === 'encode' ? setText : setEncoded
  const setBottomValue = mode === 'encode' ? setEncoded : setText

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border/70 bg-card/80 px-4 py-2.5">
        <Button size="sm" onClick={handleAction}>
          {mode === 'encode' ? 'Encode' : 'Decode'}
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setMode(m => m === 'encode' ? 'decode' : 'encode')}
          title="Switch mode"
        >
          <ArrowDownUp data-icon="inline-start" />
          {mode === 'encode' ? 'Switch to Decode' : 'Switch to Encode'}
        </Button>

        <Separator orientation="vertical" className="hidden !h-5 sm:block" />

        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          title="Load image as Base64"
        >
          <Image data-icon="inline-start" />
          Image → Base64
        </Button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />

        <Button size="sm" variant="ghost" onClick={clear}>
          <Trash2 data-icon="inline-start" />
          Clear
        </Button>
      </div>

      {/* Panels */}
      <div
        className="flex-1 flex flex-col overflow-hidden"
        onDragOver={e => e.preventDefault()}
        onDrop={handleImageDrop}
      >
        <div className="flex min-h-0 flex-1 flex-col border-b border-border/70">
          <div className="flex items-center justify-between border-b border-border/70 bg-muted/35 px-4 py-2">
            <Typography variant="muted" className="text-[11px] font-semibold uppercase tracking-[0.12em]">{topLabel}</Typography>
            <Button size="icon-xs" variant="ghost" onClick={() => copy(topValue)}>
              <Copy data-icon="inline-start" />
            </Button>
          </div>
          <textarea
            value={topValue}
            onChange={e => setTopValue(e.target.value)}
            placeholder={`Enter ${topLabel.toLowerCase()}...`}
            spellCheck={false}
            className="flex-1 resize-none bg-card p-4 font-mono text-sm leading-6 focus:outline-none"
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-border/70 bg-muted/35 px-4 py-2">
            <Typography variant="muted" className="text-[11px] font-semibold uppercase tracking-[0.12em]">{bottomLabel}</Typography>
            <Button size="icon-xs" variant="ghost" onClick={() => copy(bottomValue)}>
              <Copy data-icon="inline-start" />
            </Button>
          </div>
          <textarea
            value={bottomValue}
            onChange={e => setBottomValue(e.target.value)}
            placeholder={`${bottomLabel} will appear here...`}
            spellCheck={false}
            className="flex-1 resize-none bg-card p-4 font-mono text-sm leading-6 focus:outline-none"
          />
        </div>
      </div>
    </div>
  )
}
