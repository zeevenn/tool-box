import { useEffect, useRef, useState } from 'react'

import { Loading } from '@/components/common/loading'
import { Slider } from '@/components/ui/slider'
import { Typography } from '@/components/ui/typography'
import { useI18n } from '@/context/i18n-provider'
import { useToolState } from '@/context/tool-state-provider'

interface DifferenceViewProps {
  originalImage: string
  modifiedImage: string
}

const MAX_RENDER_PIXELS = 12_000_000

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Unable to load image'))
    image.src = source
  })
}

function imagePixels(image: HTMLImageElement, width: number, height: number, scale: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context)
    throw new Error('Canvas is not supported')
  context.drawImage(
    image,
    0,
    0,
    Math.max(1, Math.round(image.naturalWidth * scale)),
    Math.max(1, Math.round(image.naturalHeight * scale)),
  )
  return context.getImageData(0, 0, width, height)
}

export function DifferenceView({ originalImage, modifiedImage }: DifferenceViewProps) {
  const { t } = useI18n()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [toolState, setToolState] = useToolState('imageDiff')
  const { differenceThreshold: threshold } = toolState
  const setThreshold = (differenceThreshold: number) => setToolState(current => ({ ...current, differenceThreshold }))
  const [changedPercentage, setChangedPercentage] = useState(0)
  const [previewReduced, setPreviewReduced] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void Promise.all([loadImage(originalImage), loadImage(modifiedImage)])
      .then(([original, modified]) => {
        if (cancelled)
          return

        const sourceWidth = Math.max(original.naturalWidth, modified.naturalWidth)
        const sourceHeight = Math.max(original.naturalHeight, modified.naturalHeight)
        const scale = Math.min(1, Math.sqrt(MAX_RENDER_PIXELS / (sourceWidth * sourceHeight)))
        const width = Math.max(1, Math.round(sourceWidth * scale))
        const height = Math.max(1, Math.round(sourceHeight * scale))
        const originalData = imagePixels(original, width, height, scale)
        const modifiedData = imagePixels(modified, width, height, scale)
        const output = new ImageData(width, height)
        let changedPixels = 0

        for (let index = 0; index < output.data.length; index += 4) {
          const redDifference = Math.abs(originalData.data[index] - modifiedData.data[index])
          const greenDifference = Math.abs(originalData.data[index + 1] - modifiedData.data[index + 1])
          const blueDifference = Math.abs(originalData.data[index + 2] - modifiedData.data[index + 2])
          const alphaDifference = Math.abs(originalData.data[index + 3] - modifiedData.data[index + 3])
          const difference = Math.max(redDifference, greenDifference, blueDifference, alphaDifference)

          if (difference > threshold) {
            changedPixels++
            output.data[index] = 255
            output.data[index + 1] = 76
            output.data[index + 2] = 54
            output.data[index + 3] = Math.max(144, difference)
          }
          else {
            const luminance = Math.round(
              originalData.data[index] * 0.2126
              + originalData.data[index + 1] * 0.7152
              + originalData.data[index + 2] * 0.0722,
            )
            output.data[index] = luminance
            output.data[index + 1] = luminance
            output.data[index + 2] = luminance
            output.data[index + 3] = 48
          }
        }

        const canvas = canvasRef.current
        const context = canvas?.getContext('2d')
        if (!canvas || !context || cancelled)
          return
        canvas.width = width
        canvas.height = height
        context.putImageData(output, 0, 0)
        setChangedPercentage(changedPixels / (width * height) * 100)
        setPreviewReduced(scale < 1)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled)
          setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [modifiedImage, originalImage, threshold])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-border/60 px-4 py-3">
        <div className="flex min-w-56 flex-1 items-center gap-3">
          <Typography variant="muted" className="shrink-0 text-xs">{t('Difference threshold')}</Typography>
          <Slider
            value={[threshold]}
            min={0}
            max={255}
            step={1}
            aria-label={t('Difference threshold')}
            onValueChange={value => setThreshold(value[0])}
          />
          <Typography className="w-7 text-right font-mono text-xs">{threshold}</Typography>
        </div>
        <Typography variant="muted" className="text-xs">
          {t('Changed pixels')}
          {': '}
          <span className="font-mono text-foreground">
            {changedPercentage.toFixed(2)}
            %
          </span>
        </Typography>
        {previewReduced && (
          <Typography variant="muted" className="text-xs">{t('Preview reduced for performance')}</Typography>
        )}
      </div>
      <div className="relative flex min-h-80 flex-1 items-center justify-center overflow-auto bg-muted/20 p-4">
        {loading && <Loading />}
        <canvas
          ref={canvasRef}
          aria-label={t('Difference preview')}
          className="max-h-full max-w-full object-contain shadow-sm"
        />
      </div>
    </div>
  )
}
