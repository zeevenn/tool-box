import { Slider } from '@/components/ui/slider'
import { useI18n } from '@/context/i18n-provider'

import { useImageContainerSize } from '../../../hooks/use-image-container-size'

interface SliderViewProps {
  originalImage: string | null
  modifiedImage: string | null
  sliderPosition: number
  onPositionChange: (position: number) => void
}

export function SliderView({
  originalImage,
  modifiedImage,
  sliderPosition,
  onPositionChange,
}: SliderViewProps) {
  const { t } = useI18n()
  const { containerSize, containerRef } = useImageContainerSize(
    originalImage,
    modifiedImage,
  )

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-center gap-2 py-4 px-8">
        <Slider
          value={[sliderPosition]}
          onValueChange={value => onPositionChange(value[0])}
          min={0}
          max={100}
          step={1}
          className="w-64"
        />
      </div>
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center relative bg-muted overflow-hidden"
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
              className="absolute inset-0"
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
            {/* Modified Image Container - positioned from right */}
            <div
              className="absolute right-0 top-0 bottom-0 overflow-hidden border-l border-destructive"
              style={{
                width: `${100 - sliderPosition}%`,
              }}
            >
              <div
                className="absolute right-0 top-0 bottom-0"
                style={{
                  width: `${containerSize.width}px`,
                  height: `${containerSize.height}px`,
                }}
              >
                <img
                  src={modifiedImage}
                  alt={t('Modified')}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
