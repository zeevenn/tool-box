import { ArrowDownUp, Copy, Image, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { useI18n } from '@/context/i18n-provider'
import { useCopyText } from '@/hooks/use-copy-text'

export function Base64() {
  const { t } = useI18n()
  const copyText = useCopyText()
  const [text, setText] = useState('')
  const [encoded, setEncoded] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const encode = () => {
    if (!text.trim()) {
      toast.error(t('Input is empty'))
      return
    }
    try {
      setEncoded(btoa(unescape(encodeURIComponent(text))))
    }
    catch {
      toast.error(t('Failed to encode — contains invalid characters'))
    }
  }

  const decode = () => {
    if (!encoded.trim()) {
      toast.error(t('Input is empty'))
      return
    }
    try {
      setText(decodeURIComponent(escape(atob(encoded.trim()))))
    }
    catch {
      toast.error(t('Invalid Base64 input'))
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
      toast.success(t('Image loaded: {name}', { name: file.name }))
    }
    reader.readAsDataURL(file)
  }

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file?.type.startsWith('image/')) {
      toast.error(t('Please drop an image file'))
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

  const clear = () => {
    setText('')
    setEncoded('')
  }

  const topLabel = t(mode === 'encode' ? 'Plain Text' : 'Base64')
  const bottomLabel = t(mode === 'encode' ? 'Base64' : 'Plain Text')
  const topValue = mode === 'encode' ? text : encoded
  const bottomValue = mode === 'encode' ? encoded : text
  const setTopValue = mode === 'encode' ? setText : setEncoded
  const setBottomValue = mode === 'encode' ? setEncoded : setText

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border/70 bg-card/80 px-4 py-2.5">
        <Button size="sm" onClick={handleAction}>
          {t(mode === 'encode' ? 'Encode' : 'Decode')}
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setMode(m => m === 'encode' ? 'decode' : 'encode')}
          title={t('Switch mode')}
        >
          <ArrowDownUp data-icon="inline-start" />
          {t(mode === 'encode' ? 'Switch to Decode' : 'Switch to Encode')}
        </Button>

        <Separator orientation="vertical" className="hidden !h-5 sm:block" />

        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          title={t('Load image as Base64')}
        >
          <Image data-icon="inline-start" />
          {t('Image → Base64')}
        </Button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />

        <Button size="sm" variant="ghost" onClick={clear}>
          <Trash2 data-icon="inline-start" />
          {t('Clear')}
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
            <Button size="icon-xs" variant="ghost" onClick={() => copyText(topValue)}>
              <Copy data-icon="inline-start" />
            </Button>
          </div>
          <textarea
            value={topValue}
            onChange={e => setTopValue(e.target.value)}
            placeholder={t('Enter {label}...', { label: topLabel.toLowerCase() })}
            spellCheck={false}
            className="flex-1 resize-none bg-card p-4 font-mono text-sm leading-6 focus:outline-none"
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-border/70 bg-muted/35 px-4 py-2">
            <Typography variant="muted" className="text-[11px] font-semibold uppercase tracking-[0.12em]">{bottomLabel}</Typography>
            <Button size="icon-xs" variant="ghost" onClick={() => copyText(bottomValue)}>
              <Copy data-icon="inline-start" />
            </Button>
          </div>
          <textarea
            value={bottomValue}
            onChange={e => setBottomValue(e.target.value)}
            placeholder={t('{label} will appear here...', { label: bottomLabel })}
            spellCheck={false}
            className="flex-1 resize-none bg-card p-4 font-mono text-sm leading-6 focus:outline-none"
          />
        </div>
      </div>
    </div>
  )
}
