import type { LanguageSupport } from '@codemirror/language'
import type { Extension } from '@codemirror/state'
import { MergeView } from '@codemirror/merge'
import { EditorView } from '@codemirror/view'
import { useEffect, useMemo, useRef } from 'react'

import { createEditorExtensions } from '@/components/common/codemirror-config'
import { useTheme } from '@/context/theme-provider'

const EMPTY_EXTENSIONS: Extension[] = []

export interface CodeMirrorMergeProps {
  originalValue: string
  modifiedValue: string
  onOriginalChange?: (value: string) => void
  onModifiedChange?: (value: string) => void
  onOriginalPaste?: (value: string) => string | void
  onModifiedPaste?: (value: string) => string | void
  originalExtensions?: Extension[]
  modifiedExtensions?: Extension[]
  language?: LanguageSupport
  originalAriaLabel?: string
  modifiedAriaLabel?: string
  className?: string
  onMount?: (view: MergeView) => void
}

export function CodeMirrorMerge({
  originalValue,
  modifiedValue,
  onOriginalChange,
  onModifiedChange,
  onOriginalPaste,
  onModifiedPaste,
  originalExtensions = EMPTY_EXTENSIONS,
  modifiedExtensions = EMPTY_EXTENSIONS,
  language,
  originalAriaLabel,
  modifiedAriaLabel,
  className,
  onMount,
}: CodeMirrorMergeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mergeViewRef = useRef<MergeView | null>(null)
  const { resolvedTheme } = useTheme()

  const callbacksRef = useRef({
    onOriginalChange,
    onModifiedChange,
    onOriginalPaste,
    onModifiedPaste,
    onMount,
  })
  callbacksRef.current = {
    onOriginalChange,
    onModifiedChange,
    onOriginalPaste,
    onModifiedPaste,
    onMount,
  }

  const valuesRef = useRef({ originalValue, modifiedValue })
  valuesRef.current = { originalValue, modifiedValue }

  const baseExtensions = useMemo((): Extension[] => {
    return createEditorExtensions({ language, dark: resolvedTheme === 'dark' })
  }, [resolvedTheme, language])

  useEffect(() => {
    if (!containerRef.current)
      return

    if (mergeViewRef.current) {
      mergeViewRef.current.destroy()
    }

    const mergeView = new MergeView({
      a: {
        doc: valuesRef.current.originalValue,
        extensions: [
          ...baseExtensions,
          ...originalExtensions,
          EditorView.contentAttributes.of({ 'aria-label': originalAriaLabel ?? 'Original text' }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              callbacksRef.current.onOriginalChange?.(update.state.doc.toString())
            }
          }),
          EditorView.domEventHandlers({
            paste: (_event, view) => {
              queueMicrotask(() => {
                const content = view.state.doc.toString()
                const transformed = callbacksRef.current.onOriginalPaste?.(content)
                if (typeof transformed === 'string' && content !== transformed) {
                  view.dispatch({
                    changes: { from: 0, to: content.length, insert: transformed },
                  })
                  callbacksRef.current.onOriginalChange?.(transformed)
                }
              })
              return false
            },
          }),
        ],
      },
      b: {
        doc: valuesRef.current.modifiedValue,
        extensions: [
          ...baseExtensions,
          ...modifiedExtensions,
          EditorView.contentAttributes.of({ 'aria-label': modifiedAriaLabel ?? 'Modified text' }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              callbacksRef.current.onModifiedChange?.(update.state.doc.toString())
            }
          }),
          EditorView.domEventHandlers({
            paste: (_event, view) => {
              queueMicrotask(() => {
                const content = view.state.doc.toString()
                const transformed = callbacksRef.current.onModifiedPaste?.(content)
                if (typeof transformed === 'string' && content !== transformed) {
                  view.dispatch({
                    changes: { from: 0, to: content.length, insert: transformed },
                  })
                  callbacksRef.current.onModifiedChange?.(transformed)
                }
              })
              return false
            },
          }),
        ],
      },
      parent: containerRef.current,
      gutter: true,
      highlightChanges: true,
    })

    mergeViewRef.current = mergeView
    callbacksRef.current.onMount?.(mergeView)

    return () => {
      mergeView.destroy()
    }
  }, [baseExtensions, modifiedAriaLabel, modifiedExtensions, originalAriaLabel, originalExtensions])

  useEffect(() => {
    if (!mergeViewRef.current)
      return

    const currentOriginal = mergeViewRef.current.a.state.doc.toString()
    if (currentOriginal !== originalValue) {
      mergeViewRef.current.a.dispatch({
        changes: { from: 0, to: currentOriginal.length, insert: originalValue },
      })
    }
  }, [originalValue])

  useEffect(() => {
    if (!mergeViewRef.current)
      return

    const currentModified = mergeViewRef.current.b.state.doc.toString()
    if (currentModified !== modifiedValue) {
      mergeViewRef.current.b.dispatch({
        changes: { from: 0, to: currentModified.length, insert: modifiedValue },
      })
    }
  }, [modifiedValue])

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 ${className ?? ''}`}
    />
  )
}

export { type MergeView }
