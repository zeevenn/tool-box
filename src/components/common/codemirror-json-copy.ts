import type { EditorState } from '@codemirror/state'
import type { DecorationSet, ViewUpdate } from '@codemirror/view'
import { jsonLanguage } from '@codemirror/lang-json'
import { syntaxTree } from '@codemirror/language'
import { Decoration, EditorView, ViewPlugin, WidgetType } from '@codemirror/view'

export function jsonBlocksInRange(state: EditorState, from: number, to: number) {
  const blocks: { from: number, to: number, at: number }[] = []
  if (!jsonLanguage.isActiveAt(state, from))
    return blocks

  syntaxTree(state).iterate({
    from,
    to,
    enter(node) {
      const closing = node.name === 'Object' ? '}' : node.name === 'Array' ? ']' : null
      const at = node.from + 1
      if (closing && at >= from && at <= to && node.node.lastChild?.name === closing) {
        const target = node.node.parent?.name === 'Property' ? node.node.parent : node.node
        blocks.push({ from: target.from, to: target.to, at })
      }
    },
  })
  return blocks
}

export function jsonBlockCopy(copy: (value: string) => void, label = 'Copy JSON') {
  class CopyWidget extends WidgetType {
    from: number
    to: number

    constructor(from: number, to: number) {
      super()
      this.from = from
      this.to = to
    }

    eq(other: CopyWidget) {
      return this.from === other.from && this.to === other.to
    }

    toDOM(view: EditorView) {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'cm-json-copy-button'
      button.title = label
      button.setAttribute('aria-label', label)
      button.textContent = '⧉'
      button.addEventListener('mousedown', event => event.stopPropagation())
      button.addEventListener('click', (event) => {
        event.stopPropagation()
        copy(view.state.doc.sliceString(this.from, this.to))
      })
      return button
    }
  }

  function decorations(view: EditorView) {
    const widgets = []
    for (const range of view.visibleRanges) {
      for (const block of jsonBlocksInRange(view.state, range.from, range.to)) {
        widgets.push(Decoration.widget({ widget: new CopyWidget(block.from, block.to), side: -1 }).range(block.at))
      }
    }
    return Decoration.set(widgets)
  }

  return [
    ViewPlugin.fromClass(class {
      decorations: DecorationSet

      constructor(view: EditorView) {
        this.decorations = decorations(view)
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged || syntaxTree(update.startState) !== syntaxTree(update.state))
          this.decorations = decorations(update.view)
      }
    }, { decorations: plugin => plugin.decorations }),
    EditorView.baseTheme({
      '.cm-json-copy-button': {
        cursor: 'pointer',
        color: 'inherit',
        font: 'inherit',
        lineHeight: 'inherit',
        background: 'transparent',
        border: 'none',
        padding: '0 3px',
        opacity: '0.6',
      },
      '.cm-json-copy-button:hover, .cm-json-copy-button:focus-visible': { opacity: '1', color: 'var(--primary)' },
    }),
  ]
}
