import { Copy } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'

// Conversion utilities
function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '')
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean
  if (!/^[0-9a-f]{6}$/i.test(full))
    return null
  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ]
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === rn)
      h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
    else if (max === gn)
      h = ((bn - rn) / d + 2) / 6
    else
      h = ((rn - gn) / d + 4) / 6
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sn = s / 100
  const ln = l / 100
  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = ln - c / 2
  let r = 0
  let g = 0
  let b = 0
  if (h < 60) { r = c; g = x } // eslint-disable-line style/max-statements-per-line
  else if (h < 120) { r = x; g = c } // eslint-disable-line style/max-statements-per-line
  else if (h < 180) { g = c; b = x } // eslint-disable-line style/max-statements-per-line
  else if (h < 240) { g = x; b = c } // eslint-disable-line style/max-statements-per-line
  else if (h < 300) { r = x; b = c } // eslint-disable-line style/max-statements-per-line
  else { r = c; b = x } // eslint-disable-line style/max-statements-per-line
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

function parseRgbInput(value: string): [number, number, number] | null {
  const m = value.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/)
  if (!m)
    return null
  const [r, g, b] = [Number(m[1]), Number(m[2]), Number(m[3])]
  if ([r, g, b].some(v => v < 0 || v > 255))
    return null
  return [r, g, b]
}

function parseHslInput(value: string): [number, number, number] | null {
  const m = value.match(/(\d+)[,\s]+(\d+)%?[,\s]+(\d+)%?/)
  if (!m)
    return null
  const [h, s, l] = [Number(m[1]), Number(m[2]), Number(m[3])]
  if (h < 0 || h > 360 || s < 0 || s > 100 || l < 0 || l > 100)
    return null
  return [h, s, l]
}

export function ColorConverter() {
  const [hex, setHex] = useState('#3b82f6')
  const [rgb, setRgb] = useState('59, 130, 246')
  const [hsl, setHsl] = useState('217, 91%, 60%')
  const [previewColor, setPreviewColor] = useState('#3b82f6')
  const pickerRef = useRef<HTMLInputElement>(null)

  const updateFromHex = (value: string) => {
    setHex(value)
    const parsed = hexToRgb(value)
    if (parsed) {
      const [r, g, b] = parsed
      const [h, s, l] = rgbToHsl(r, g, b)
      setRgb(`${r}, ${g}, ${b}`)
      setHsl(`${h}, ${s}%, ${l}%`)
      setPreviewColor(value)
    }
  }

  const updateFromRgb = (value: string) => {
    setRgb(value)
    const parsed = parseRgbInput(value)
    if (parsed) {
      const [r, g, b] = parsed
      const h = rgbToHex(r, g, b)
      const [hn, s, l] = rgbToHsl(r, g, b)
      setHex(h)
      setHsl(`${hn}, ${s}%, ${l}%`)
      setPreviewColor(h)
    }
  }

  const updateFromHsl = (value: string) => {
    setHsl(value)
    const parsed = parseHslInput(value)
    if (parsed) {
      const [h, s, l] = parsed
      const [r, g, b] = hslToRgb(h, s, l)
      const hx = rgbToHex(r, g, b)
      setHex(hx)
      setRgb(`${r}, ${g}, ${b}`)
      setPreviewColor(hx)
    }
  }

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFromHex(e.target.value)
  }

  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value)
    toast.success(`${label} copied`)
  }

  const fields = [
    { label: 'HEX', value: hex, onChange: updateFromHex, placeholder: '#3b82f6', mono: true },
    { label: 'RGB', value: rgb, onChange: updateFromRgb, placeholder: '59, 130, 246', mono: true },
    { label: 'HSL', value: hsl, onChange: updateFromHsl, placeholder: '217, 91%, 60%', mono: true },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4 gap-6">
      {/* Color Preview + Picker */}
      <div className="flex items-center gap-4">
        <div
          className="w-20 h-20 rounded-xl border border-border shadow-inner cursor-pointer shrink-0"
          style={{ backgroundColor: previewColor }}
          onClick={() => pickerRef.current?.click()}
          title="Click to open color picker"
        />
        <input
          ref={pickerRef}
          type="color"
          value={previewColor.length === 7 ? previewColor : '#000000'}
          onChange={handlePickerChange}
          className="sr-only"
        />
        <div className="flex flex-col gap-1">
          <Typography className="font-mono text-lg font-semibold">{hex.toUpperCase()}</Typography>
          <Typography variant="muted" className="text-sm">
            rgb(
            {rgb}
            )
          </Typography>
          <Typography variant="muted" className="text-sm">
            hsl(
            {hsl}
            )
          </Typography>
        </div>
        <Button size="sm" variant="outline" className="ml-auto" onClick={() => pickerRef.current?.click()}>
          Pick Color
        </Button>
      </div>

      {/* Input fields */}
      <div className="flex flex-col gap-3">
        {fields.map(({ label, value, onChange, placeholder }) => (
          <div key={label} className="flex items-center gap-3">
            <Typography variant="muted" className="text-xs w-10 shrink-0">{label}</Typography>
            <input
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder={placeholder}
              spellCheck={false}
              className="flex-1 border border-border rounded-md px-3 py-2 font-mono text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button size="sm" variant="ghost" className="shrink-0" onClick={() => copy(value, label)}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Swatches for common colors */}
      <div className="flex flex-col gap-2">
        <Typography variant="muted" className="text-xs">Common Colors</Typography>
        <div className="flex flex-wrap gap-2">
          {[
            '#ef4444',
            '#f97316',
            '#eab308',
            '#22c55e',
            '#3b82f6',
            '#8b5cf6',
            '#ec4899',
            '#ffffff',
            '#000000',
            '#6b7280',
            '#1e293b',
            '#f8fafc',
          ].map(color => (
            <button
              key={color}
              className="w-8 h-8 rounded-md border border-border hover:scale-110 transition-transform shadow-sm"
              style={{ backgroundColor: color }}
              onClick={() => updateFromHex(color)}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
