import type { LanguageSupport } from '@codemirror/language'
import type { EditorView as EditorViewType } from '@codemirror/view'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { indentWithTab } from '@codemirror/commands'
import { defaultHighlightStyle, foldGutter, indentOnInput, syntaxHighlighting } from '@codemirror/language'
import { EditorState } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView, keymap, lineNumbers, placeholder as showPlaceholder } from '@codemirror/view'
import { useEffect, useMemo, useRef } from 'react'

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
    const extensions = [
      lineNumbers(),
      foldGutter(),
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      EditorView.lineWrapping,
      EditorState.allowMultipleSelections.of(true),
      EditorState.readOnly.of(readOnly),
      EditorView.editable.of(!readOnly),
      EditorView.contentAttributes.of({ 'aria-label': ariaLabel ?? 'Code editor' }),
    ]

    if (language)
      extensions.push(language)
    if (!readOnly) {
      extensions.push(
        closeBrackets(),
        keymap.of([...closeBracketsKeymap, indentWithTab]),
      )
    }
    if (placeholder)
      extensions.push(showPlaceholder(placeholder))
    if (resolvedTheme === 'dark')
      extensions.push(oneDark)

    return extensions
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
