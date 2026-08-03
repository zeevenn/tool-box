import type { LanguageSupport } from '@codemirror/language'
import type { EditorView as EditorViewType } from '@codemirror/view'
import { EditorView } from '@codemirror/view'
import { useEffect, useMemo, useRef } from 'react'

import { createEditorExtensions } from '@/components/common/codemirror-config'
import { useTheme } from '@/context/theme-provider'

export interface CodeMirrorEditorProps {
  value: string
  onChange?: (value: string) => void
  language?: LanguageSupport
  readOnly?: boolean
  placeholder?: string
  ariaLabel?: string
  className?: string
  onMount?: (view: EditorViewType) => void
}

export function CodeMirrorEditor({
  value,
  onChange,
  language,
  readOnly = false,
  placeholder,
  ariaLabel,
  className,
  onMount,
}: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorViewRef = useRef<EditorViewType | null>(null)
  const valueRef = useRef(value)
  const callbacksRef = useRef({ onChange, onMount })
  const { resolvedTheme } = useTheme()

  valueRef.current = value
  callbacksRef.current = { onChange, onMount }

  const baseExtensions = useMemo(() => {
    return createEditorExtensions({
      language,
      dark: resolvedTheme === 'dark',
      readOnly,
      placeholder,
      ariaLabel: ariaLabel ?? 'Code editor',
    })
  }, [ariaLabel, language, placeholder, readOnly, resolvedTheme])

  useEffect(() => {
    if (!containerRef.current)
      return

    const view = new EditorView({
      doc: valueRef.current,
      extensions: [
        ...baseExtensions,
        EditorView.updateListener.of((update) => {
          if (update.docChanged)
            callbacksRef.current.onChange?.(update.state.doc.toString())
        }),
      ],
      parent: containerRef.current,
    })

    editorViewRef.current = view
    callbacksRef.current.onMount?.(view)

    return () => {
      view.destroy()
      editorViewRef.current = null
    }
  }, [baseExtensions])

  useEffect(() => {
    const view = editorViewRef.current
    if (!view)
      return

    const currentValue = view.state.doc.toString()
    if (currentValue !== value) {
      view.dispatch({
        changes: { from: 0, to: currentValue.length, insert: value },
      })
    }
  }, [value])

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 [&_.cm-editor]:h-full [&_.cm-scroller]:overflow-auto ${className ?? ''}`}
    />
  )
}
