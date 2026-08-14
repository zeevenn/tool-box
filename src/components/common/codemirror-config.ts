import type { LanguageSupport } from '@codemirror/language'
import type { Extension } from '@codemirror/state'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { defaultKeymap, indentWithTab } from '@codemirror/commands'
import { defaultHighlightStyle, foldGutter, foldKeymap, indentOnInput, syntaxHighlighting } from '@codemirror/language'
import { EditorState } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView, keymap, lineNumbers, placeholder as showPlaceholder } from '@codemirror/view'

interface EditorExtensionOptions {
  language?: LanguageSupport
  dark?: boolean
  readOnly?: boolean
  placeholder?: string
  ariaLabel?: string
}

export function createEditorExtensions({
  language,
  dark = false,
  readOnly = false,
  placeholder,
  ariaLabel,
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
