import { Slider } from '@/components/ui/slider'
import { useI18n } from '@/context/i18n-provider'

import { useImageContainerSize } from '../../../hooks/use-image-container-size'

interface OverlayViewProps {
  originalImage: string | null
  modifiedImage: string | null
  overlayOpacity: number
  onOpacityChange: (opacity: number) => void
}

export function OverlayView({
  originalImage,
  modifiedImage,
  overlayOpacity,
  onOpacityChange,
}: OverlayViewProps) {
  const { t } = useI18n()
  const { containerSize, containerRef } = useImageContainerSize(
    originalImage,
    modifiedImage,
  )

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-center gap-2 py-4 px-8">
        <Slider
          value={[overlayOpacity]}
          onValueChange={value => onOpacityChange(value[0])}
          min={0}
          max={100}
          step={1}
          className="w-64"
        />
      </div>
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center relative bg-muted"
      >
        {originalImage && modifiedImage && containerSize && (
          <div
            className="relative"
            style={{
              width: `${containerSize.width}px`,
              height: `${containerSize.height}px`,
            }}
          >
            {/* Original Image Container */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                width: `${containerSize.width}px`,
                height: `${containerSize.height}px`,
              }}
            >
              <img
                src={originalImage}
                alt={t('Original')}
                className="w-full h-full"
              />
            </div>
            {/* Modified Image Container */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                width: `${containerSize.width}px`,
                height: `${containerSize.height}px`,
                opacity: 1 - overlayOpacity / 100,
              }}
            >
              <img
                src={modifiedImage}
                alt={t('Modified')}
                className="w-full h-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
