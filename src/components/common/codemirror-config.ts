import type { LanguageSupport } from '@codemirror/language'
import type { Extension } from '@codemirror/state'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { defaultKeymap, indentWithTab } from '@codemirror/commands'
import { defaultHighlightStyle, foldGutter, foldKeymap, indentOnInput, syntaxHighlighting } from '@codemirror/language'
import { EditorState } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView, keymap, lineNumbers, placeholder as showPlaceholder } from '@codemirror/view'
import { jsonBlockCopy } from './codemirror-json-copy.ts'

// Keep large schemas precise while bounding work on unrelated inputs.
export const MERGE_DIFF_CONFIG = { scanLimit: 10000, timeout: 1000 }

interface EditorExtensionOptions {
  language?: LanguageSupport
  dark?: boolean
  readOnly?: boolean
  placeholder?: string
  ariaLabel?: string
  onCopyBlock?: (value: string) => void
  copyBlockLabel?: string
}

export function createEditorExtensions({
  language,
  dark = false,
  readOnly = false,
  placeholder,
  ariaLabel,
  onCopyBlock,
  copyBlockLabel,
}: EditorExtensionOptions = {}): Extension[] {
  const extensions: Extension[] = [
    lineNumbers(),
    foldGutter(),
    keymap.of(foldKeymap),
    indentOnInput(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    EditorView.lineWrapping,
    EditorState.allowMultipleSelections.of(true),
    EditorState.readOnly.of(readOnly),
    EditorView.editable.of(!readOnly),
  ]

  if (ariaLabel)
    extensions.push(EditorView.contentAttributes.of({ 'aria-label': ariaLabel }))
  if (language)
    extensions.push(language)
  if (onCopyBlock)
    extensions.push(jsonBlockCopy(onCopyBlock, copyBlockLabel))
  if (!readOnly) {
    extensions.push(
      closeBrackets(),
      keymap.of([...closeBracketsKeymap, ...defaultKeymap, indentWithTab]),
    )
  }
  if (placeholder)
    extensions.push(showPlaceholder(placeholder))
  if (dark)
    extensions.push(oneDark)

  return extensions
}
