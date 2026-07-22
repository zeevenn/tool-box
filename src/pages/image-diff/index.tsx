import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'

import { ComingSoon } from '../../components/common'
import { OverlayView, SideBySideView, SliderView } from './components'

type ComparisonMode = 'side-by-side' | 'overlay' | 'slider' | 'difference'

const COMPARISON_MODES = {
  SIDE_BY_SIDE: 'side-by-side' as const,
  OVERLAY: 'overlay' as const,
  SLIDER: 'slider' as const,
  DIFFERENCE: 'difference' as const,
} satisfies Record<string, ComparisonMode>

export function ImageDiff() {
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [modifiedImage, setModifiedImage] = useState<string | null>(null)
  const [originalImageInfo, setOriginalImageInfo] = useState<{
    name: string
    size: number
    dimensions: { width: number, height: number }
  } | null>(null)
  const [modifiedImageInfo, setModifiedImageInfo] = useState<{
    name: string
    size: number
    dimensions: { width: number, height: number }
  } | null>(null)
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>(
    COMPARISON_MODES.SIDE_BY_SIDE,
  )
  const [sliderPosition, setSliderPosition] = useState(50)
  const [overlayOpacity, setOverlayOpacity] = useState(50)
  const originalInputRef = useRef<HTMLInputElement>(null)
  const modifiedInputRef = useRef<HTMLInputElement>(null)

  const getImageInfo = (
    file: File,
    imageUrl: string,
  ): Promise<{
    name: string
    size: number
    dimensions: { width: number, height: number }
  }> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        resolve({
          name: file.name,
          size: file.size,
          dimensions: { width: img.width, height: img.height },
        })
      }
      img.src = imageUrl
    })
  }

  const handleOriginalImageSelect = async (files: FileList) => {
    const file = files[0]
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (originalImage) {
      URL.revokeObjectURL(originalImage)
    }

    const imageUrl = URL.createObjectURL(file)
    const imageInfo = await getImageInfo(file, imageUrl)
    setOriginalImage(imageUrl)
    setOriginalImageInfo(imageInfo)
  }

  const handleModifiedImageSelect = async (files: FileList) => {
    const file = files[0]
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (modifiedImage) {
      URL.revokeObjectURL(modifiedImage)
    }

    const imageUrl = URL.createObjectURL(file)
    const imageInfo = await getImageInfo(file, imageUrl)
    setModifiedImage(imageUrl)
    setModifiedImageInfo(imageInfo)
  }

  const clearImages = () => {
    if (originalImage) {
      URL.revokeObjectURL(originalImage)
    }
    if (modifiedImage) {
      URL.revokeObjectURL(modifiedImage)
    }
    setOriginalImage(null)
    setModifiedImage(null)
    setOriginalImageInfo(null)
    setModifiedImageInfo(null)
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
        return <ComingSoon title="Difference Mode" />
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
    <Card className="flex-1 flex flex-col py-0 gap-0">
      {/* Toolbar */}
      {originalImageInfo && modifiedImageInfo && (
        <>
          <CardHeader className="flex-row items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              {/* Comparison Mode Selector */}
              <div className="flex items-center gap-2">
                <Typography variant="muted">Mode:</Typography>
                <Select
                  value={comparisonMode}
                  onValueChange={value =>
                    setComparisonMode(value as ComparisonMode)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={COMPARISON_MODES.SIDE_BY_SIDE}>
                      Side by side
                    </SelectItem>
                    <SelectItem value={COMPARISON_MODES.OVERLAY}>
                      Overlay
                    </SelectItem>
                    <SelectItem value={COMPARISON_MODES.SLIDER}>
                      Slider
                    </SelectItem>
                    <SelectItem value={COMPARISON_MODES.DIFFERENCE}>
                      Difference
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator orientation="vertical" className="h-4" />

              {/* Image Info */}
              <div className="flex items-center gap-4">
                {originalImageInfo && (
                  <Typography variant="muted">
                    Original:
                    {' '}
                    {originalImageInfo.dimensions.width}
                    ×
                    {originalImageInfo.dimensions.height}
                  </Typography>
                )}
                {modifiedImageInfo && (
                  <Typography variant="muted">
                    Modified:
                    {' '}
                    {modifiedImageInfo.dimensions.width}
                    ×
                    {modifiedImageInfo.dimensions.height}
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
                    Change Original
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => modifiedInputRef.current?.click()}
                  >
                    Change Modified
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
                Clear
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
