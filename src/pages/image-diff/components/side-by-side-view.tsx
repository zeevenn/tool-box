import { DropZone } from '@/components/common/drop-zone'
import { Card } from '@/components/ui/card'
import { useI18n } from '@/context/i18n-provider'

interface SideBySideViewProps {
  originalImage: string | null
  modifiedImage: string | null
  onOriginalImageSelect: (files: FileList) => void
  onModifiedImageSelect: (files: FileList) => void
}

export function SideBySideView({
  originalImage,
  modifiedImage,
  onOriginalImageSelect,
  onModifiedImageSelect,
}: SideBySideViewProps) {
  const { t } = useI18n()

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 md:flex-row">
      {/* Original Image */}
      <DropZone
        onFilesSelect={(files: FileList) => onOriginalImageSelect(files)}
        validation={{ accept: ['image/*'], maxCount: 1 }}
        className="flex-1"
      >
        <DropZone.Content
          className={`flex-1 flex items-center justify-center rounded-xl bg-muted/25 transition-colors ${!originalImage ? 'border border-dashed border-border hover:border-primary/45 hover:bg-primary/5' : ''
          }`}
        >
          {originalImage
            ? (
                <Card className="overflow-hidden border-0 bg-transparent p-2 shadow-none">
                  <img
                    src={originalImage}
                    alt={t('Original')}
                    className="max-w-full max-h-full object-contain"
                  />
                </Card>
              )
            : (
                <DropZone.Input accept="image/*">
                  <DropZone.Message
                    title="Drop image here"
                    description="jpg, png, webp, gif, etc."
                  />
                </DropZone.Input>
              )}
        </DropZone.Content>
        <DropZone.Overlay className="rounded-lg" />
      </DropZone>

      {/* Modified Image */}
      <DropZone
        onFilesSelect={(files: FileList) => onModifiedImageSelect(files)}
        validation={{ accept: ['image/*'], maxCount: 1 }}
        className="flex-1"
      >
        <DropZone.Content
          className={`flex-1 flex items-center justify-center rounded-xl bg-muted/25 transition-colors ${!modifiedImage ? 'border border-dashed border-border hover:border-primary/45 hover:bg-primary/5' : ''
          }`}
        >
          {modifiedImage
            ? (
                <Card className="overflow-hidden border-0 bg-transparent p-2 shadow-none">
                  <img
                    src={modifiedImage}
                    alt={t('Modified')}
                    className="max-w-full max-h-full object-contain"
                  />
                </Card>
              )
            : (
                <DropZone.Input accept="image/*">
                  <DropZone.Message
                    title="Drop image here"
                    description="jpg, png, webp, gif, etc."
                  />
                </DropZone.Input>
              )}
        </DropZone.Content>
        <DropZone.Overlay className="rounded-lg" />
      </DropZone>
    </div>
  )
}
