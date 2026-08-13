import type { ImageComparisonMode } from '@/context/tool-state-provider'
import { useEffect, useRef, useState } from 'react'

import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { useI18n } from '@/context/i18n-provider'
import { useToolState } from '@/context/tool-state-provider'

import { DifferenceView, OverlayView, SideBySideView, SliderView } from './components'

const COMPARISON_MODES = {
  SIDE_BY_SIDE: 'side-by-side' as const,
  OVERLAY: 'overlay' as const,
  SLIDER: 'slider' as const,
  DIFFERENCE: 'difference' as const,
} satisfies Record<string, ImageComparisonMode>

export function ImageDiff() {
  const { t } = useI18n()
  const [toolState, setToolState] = useToolState('imageDiff')
  const { original, modified, comparisonMode, sliderPosition, overlayOpacity } = toolState
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [modifiedImage, setModifiedImage] = useState<string | null>(null)
  const setComparisonMode = (comparisonMode: ImageComparisonMode) => setToolState(current => ({ ...current, comparisonMode }))
  const setSliderPosition = (sliderPosition: number) => setToolState(current => ({ ...current, sliderPosition }))
  const setOverlayOpacity = (overlayOpacity: number) => setToolState(current => ({ ...current, overlayOpacity }))
  const originalInputRef = useRef<HTMLInputElement>(null)
  const modifiedInputRef = useRef<HTMLInputElement>(null)
  const originalRequestRef = useRef(0)
  const modifiedRequestRef = useRef(0)
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!original) {
      setOriginalImage(null)
      return
    }
    const url = URL.createObjectURL(original.file)
    setOriginalImage(url)
    return () => URL.revokeObjectURL(url)
  }, [original])

  useEffect(() => {
    if (!modified) {
      setModifiedImage(null)
      return
    }
    const url = URL.createObjectURL(modified.file)
    setModifiedImage(url)
    return () => URL.revokeObjectURL(url)
  }, [modified])

  const getImageInfo = (
    file: File,
    imageUrl: string,
  ): Promise<{
    name: string
    size: number
    dimensions: { width: number, height: number }
  }> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        resolve({
          name: file.name,
          size: file.size,
          dimensions: { width: img.width, height: img.height },
        })
      }
      img.onerror = reject
      img.src = imageUrl
    })
  }

  const handleOriginalImageSelect = async (files: FileList) => {
    const file = files[0]
    if (!file || !file.type.startsWith('image/')) {
      toast.error(t('Please select an image file'))
      return
    }

    const imageUrl = URL.createObjectURL(file)
    const request = ++originalRequestRef.current
    try {
      const imageInfo = await getImageInfo(file, imageUrl)
      if (!mountedRef.current || request !== originalRequestRef.current)
        return
      setToolState(current => ({ ...current, original: { file, ...imageInfo } }))
    }
    catch {
      if (mountedRef.current && request === originalRequestRef.current)
        toast.error(t('Please select an image file'))
    }
    finally {
      URL.revokeObjectURL(imageUrl)
    }
  }

  const handleModifiedImageSelect = async (files: FileList) => {
    const file = files[0]
    if (!file || !file.type.startsWith('image/')) {
      toast.error(t('Please select an image file'))
      return
    }

    const imageUrl = URL.createObjectURL(file)
    const request = ++modifiedRequestRef.current
    try {
      const imageInfo = await getImageInfo(file, imageUrl)
      if (!mountedRef.current || request !== modifiedRequestRef.current)
        return
      setToolState(current => ({ ...current, modified: { file, ...imageInfo } }))
    }
    catch {
      if (mountedRef.current && request === modifiedRequestRef.current)
        toast.error(t('Please select an image file'))
    }
    finally {
      URL.revokeObjectURL(imageUrl)
    }
  }

  const clearImages = () => {
    originalRequestRef.current++
    modifiedRequestRef.current++
    setToolState(current => ({ ...current, original: null, modified: null }))
  }

  const renderCurrentView = () => {
    switch (comparisonMode) {
      case COMPARISON_MODES.SIDE_BY_SIDE:
        return (
          <SideBySideView
            originalImage={originalImage}
            modifiedImage={modifiedImage}
            onOriginalImageSelect={handleOriginalImageSelect}
            onModifiedImageSelect={handleModifiedImageSelect}
          />
        )
      case COMPARISON_MODES.OVERLAY:
        return (
          <OverlayView
            originalImage={originalImage}
            modifiedImage={modifiedImage}
            overlayOpacity={overlayOpacity}
            onOpacityChange={setOverlayOpacity}
          />
        )
      case COMPARISON_MODES.SLIDER:
        return (
          <SliderView
            originalImage={originalImage}
            modifiedImage={modifiedImage}
            sliderPosition={sliderPosition}
            onPositionChange={setSliderPosition}
          />
        )
      case COMPARISON_MODES.DIFFERENCE:
        return originalImage && modifiedImage
          ? <DifferenceView originalImage={originalImage} modifiedImage={modifiedImage} />
          : null
      default:
        return (
          <SideBySideView
            originalImage={originalImage}
            modifiedImage={modifiedImage}
            onOriginalImageSelect={handleOriginalImageSelect}
            onModifiedImageSelect={handleModifiedImageSelect}
          />
        )
    }
  }

  return (
    <Card className="flex flex-1 flex-col gap-0 rounded-none border-0 bg-transparent py-0 shadow-none">
      {/* Toolbar */}
      {original && modified && (
        <>
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Comparison Mode Selector */}
              <div className="flex items-center gap-2">
                <Typography variant="muted">{t('Mode:')}</Typography>
                <Select
                  value={comparisonMode}
                  onValueChange={value =>
                    setComparisonMode(value as ImageComparisonMode)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value={COMPARISON_MODES.SIDE_BY_SIDE}>
                        {t('Side by side')}
                      </SelectItem>
                      <SelectItem value={COMPARISON_MODES.OVERLAY}>
                        {t('Overlay')}
                      </SelectItem>
                      <SelectItem value={COMPARISON_MODES.SLIDER}>
                        {t('Slider')}
                      </SelectItem>
                      <SelectItem value={COMPARISON_MODES.DIFFERENCE}>
                        {t('Difference')}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <Separator orientation="vertical" className="h-4" />

              {/* Image Info */}
              <div className="hidden items-center gap-4 lg:flex">
                {original && (
                  <Typography variant="muted">
                    {t('Original:')}
                    {' '}
                    {original.dimensions.width}
                    ×
                    {original.dimensions.height}
                  </Typography>
                )}
                {modified && (
                  <Typography variant="muted">
                    {t('Modified:')}
                    {' '}
                    {modified.dimensions.width}
                    ×
                    {modified.dimensions.height}
                  </Typography>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {comparisonMode !== COMPARISON_MODES.SIDE_BY_SIDE && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => originalInputRef.current?.click()}
                  >
                    {t('Change Original')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => modifiedInputRef.current?.click()}
                  >
                    {t('Change Modified')}
                  </Button>
                  <input
                    ref={originalInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => e.target.files && handleOriginalImageSelect(e.target.files)}
                  />
                  <input
                    ref={modifiedInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => e.target.files && handleModifiedImageSelect(e.target.files)}
                  />
                </>
              )}
              <Button onClick={clearImages} size="sm" variant="secondary">
                {t('Clear')}
              </Button>
            </div>
          </CardHeader>
          <Separator />
        </>
      )}

      <CardContent className="flex-1 flex flex-col p-0">
        {renderCurrentView()}
      </CardContent>
    </Card>
  )
}
