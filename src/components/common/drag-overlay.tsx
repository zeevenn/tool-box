import type { ReactNode } from 'react'

import { CloudUpload } from 'lucide-react'

interface DragOverlayProps {
  isDragging: boolean
  position?: 'left' | 'right' | 'full'
  className?: string
  children?: ReactNode
}

export function DragOverlay({
  isDragging,
  position = 'full',
  className = '',
  children,
}: DragOverlayProps) {
  if (!isDragging)
    return null

  const positionClasses = {
    left: 'absolute top-0 left-0 w-1/2 h-full',
    right: 'absolute top-0 right-0 w-1/2 h-full',
    full: 'absolute inset-0',
  }

  const overlayClassName = `
    ${positionClasses[position]}
    pointer-events-none transition-all duration-200 z-50
    bg-primary/20 border-2 border-primary border-dashed
    ${className}
  `.trim()

  return (
    <div className={overlayClassName}>
      {children && (
        <div className="flex items-center justify-center h-full">
          {children}
        </div>
      )}
    </div>
  )
}

interface DragIndicatorProps {
  children: ReactNode
  className?: string
}

export function DragIndicator({
  children,
  className = 'bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg',
}: DragIndicatorProps) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <CloudUpload className="size-[18px]" />
        {children}
      </div>
    </div>
  )
}
