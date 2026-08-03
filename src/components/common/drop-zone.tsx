import type { ReactNode } from 'react'
import type { FileValidation, ValidationResult } from '../../utils'

import { Upload } from 'lucide-react'
import { createContext, use, useCallback, useMemo, useRef } from 'react'
import { useI18n } from '../../context/i18n-provider'
import { useDragAndDrop } from '../../hooks/use-drag-and-drop'
import { validateFiles } from '../../utils'
import { Typography } from '../ui/typography'
import { DragIndicator, DragOverlay } from './drag-overlay'

interface DragState {
  isDragging: boolean
  validationResult: ValidationResult
}

interface DropZoneContextValue {
  dragState: DragState
  onFileSelect: (files: FileList) => void
}

const DropZoneContext = createContext<DropZoneContextValue | null>(null)

function useDropZone() {
  const context = use(DropZoneContext)
  if (!context) {
    throw new Error('useDropZone must be used within a DropZone component')
  }
  return context
}

interface DropZoneProps {
  children: ReactNode
  onFilesSelect: (
    files: FileList,
    validation: ValidationResult,
    dropPosition?: { x: number, y: number },
  ) => void
  validation?: FileValidation
  disabled?: boolean
  className?: string
}

export function DropZone({
  children,
  onFilesSelect,
  validation,
  disabled = false,
  className = '',
}: DropZoneProps) {
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const { isDragging } = useDragAndDrop(dropZoneRef, {
    onFilesDrop: (files: FileList) => {
      if (disabled)
        return

      const validationResult = validateFiles(files, validation)
      onFilesSelect(files, validationResult)
    },
    onDragEnter: () => {},
    onDragOver: () => {},
    onDragLeave: () => {},
  })

  const handleFileSelect = useCallback(
    (files: FileList) => {
      if (disabled)
        return

      const validationResult = validateFiles(files, validation)
      onFilesSelect(files, validationResult)
    },
    [disabled, validation, onFilesSelect],
  )

  const dragState: DragState = useMemo(
    () => ({
      isDragging,
      validationResult: { isValid: true, errors: [] },
    }),
    [isDragging],
  )

  const contextValue: DropZoneContextValue = useMemo(
    () => ({
      dragState,
      onFileSelect: handleFileSelect,
    }),
    [dragState, handleFileSelect],
  )

  return (
    <DropZoneContext value={contextValue}>
      <div ref={dropZoneRef} className={`relative flex ${className}`}>
        {children}
      </div>
    </DropZoneContext>
  )
}

interface DropZoneContentProps {
  children: ReactNode
  className?: string
}

function DropZoneContent({ children, className = '' }: DropZoneContentProps) {
  return <div className={`relative ${className}`}>{children}</div>
}

interface DropZoneOverlayProps {
  children?: ReactNode
  className?: string
}

function DropZoneOverlay({ children, className }: DropZoneOverlayProps) {
  const { dragState } = useDropZone()

  return (
    <DragOverlay
      isDragging={dragState.isDragging}
      position="full"
      className={className}
    >
      {children}
    </DragOverlay>
  )
}

interface DropZoneInputProps {
  accept?: string
  multiple?: boolean
  className?: string
  children: ReactNode
}

function DropZoneInput({
  accept,
  multiple = false,
  className = '',
  children,
}: DropZoneInputProps) {
  const { onFileSelect } = useDropZone()
  const inputId = `file-input-${Math.random().toString(36).substring(2, 9)}`

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      onFileSelect(files)
    }
    event.target.value = ''
  }

  return (
    <>
      <label
        htmlFor={inputId}
        className={`absolute inset-0 cursor-pointer flex items-center justify-center ${className}`}
      >
        {children}
      </label>
      <input
        id={inputId}
        type="file"
        className="sr-only"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
      />
    </>
  )
}

interface DropZoneMessageProps {
  icon?: ReactNode
  title?: string
  description?: string
  className?: string
}

function DropZoneMessage({
  icon,
  title = 'Drop files here',
  description = 'or click to select',
  className = '',
}: DropZoneMessageProps) {
  const { t } = useI18n()
  const defaultIcon = (
    <span className="mx-auto mb-4 grid size-12 place-items-center rounded-xl border border-border bg-card text-primary shadow-sm">
      <Upload className="size-[18px]" />
    </span>
  )

  return (
    <div className={`px-6 text-center ${className}`}>
      {icon || defaultIcon}
      <div>
        <Typography variant="small" className="text-foreground">
          {t(title)}
        </Typography>
        <Typography variant="muted" className="mt-1 text-xs">
          {t(description)}
        </Typography>
      </div>
    </div>
  )
}

function DropZoneDragIndicator({
  children,
  className = 'bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg',
}: {
  children: ReactNode
  className?: string
}) {
  return <DragIndicator className={className}>{children}</DragIndicator>
}

DropZone.Content = DropZoneContent
DropZone.Overlay = DropZoneOverlay
DropZone.Input = DropZoneInput
DropZone.Message = DropZoneMessage
DropZone.DragIndicator = DropZoneDragIndicator

export {
  type DragState,
  DropZoneContext,
  type FileValidation,
  type ValidationResult,
}
