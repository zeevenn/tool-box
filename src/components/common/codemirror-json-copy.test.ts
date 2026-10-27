import assert from 'node:assert/strict'
import { test } from 'node:test'
import { json } from '@codemirror/lang-json'
import { codeFolding, foldEffect } from '@codemirror/language'
import { EditorState } from '@codemirror/state'
import { jsonBlocksInRange } from './codemirror-json-copy.ts'

const doc = '{\n  "oralGiftConfig": {\n    "enabled": true,\n    "items": [1, {"escaped": "} \\\" ["}]\n  },\n  "empty": {}\n}'

function copyLine(state: EditorState, line: number) {
  const { from, to } = state.doc.line(line)
  const block = jsonBlocksInRange(state, from, to)[0]
  return block ? state.doc.sliceString(block.from, block.to) : null
}

test('copies complete JSON properties including the name without the trailing comma', () => {
  const state = EditorState.create({ doc, extensions: [json()] })
  assert.equal(copyLine(state, 1), doc)
  assert.deepEqual(JSON.parse(`{${copyLine(state, 2)}}`).oralGiftConfig, JSON.parse(doc).oralGiftConfig)
  assert.deepEqual(JSON.parse(`{${copyLine(state, 4)}}`).items, JSON.parse(doc).oralGiftConfig.items)
  assert.equal(copyLine(state, 6), '"empty": {}')
  assert.equal(copyLine(state, 3), null)
  assert.equal(copyLine(state, 5), null)
})

test('folding and edits preserve the current complete block', () => {
  let state = EditorState.create({ doc, extensions: [json(), codeFolding()] })
  const fromBrace = doc.indexOf('{', 1)
  const toBrace = doc.indexOf('\n  },') + 3
  state = state.update({ effects: foldEffect.of({ from: fromBrace + 1, to: toBrace }) }).state
  assert.deepEqual(JSON.parse(`{${copyLine(state, 2)}}`).oralGiftConfig, JSON.parse(doc).oralGiftConfig)
  const from = state.doc.toString().indexOf('true')
  state = state.update({ changes: { from, to: from + 4, insert: 'false' } }).state
  assert.equal(JSON.parse(`{${copyLine(state, 2)}}`).oralGiftConfig.enabled, false)
})

test('does not offer blocks for plain text, strings, or unclosed containers', () => {
  assert.equal(copyLine(EditorState.create({ doc }), 1), null)
  for (const value of ['"{hello}"', '{"unclosed": [1, 2', '[1, 2']) {
    const state = EditorState.create({ doc: value, extensions: [json()] })
    assert.equal(copyLine(state, 1), null)
  }
})

test('compact JSON and array elements each have their own copy range', () => {
  const doc = '{"nested":{"items":[{},[]]}}'
  const state = EditorState.create({ doc, extensions: [json()] })
  const blocks = jsonBlocksInRange(state, 0, doc.length)
  assert.deepEqual(blocks.map(block => state.doc.sliceString(block.from, block.to)), [
    doc,
    '"nested":{"items":[{},[]]}',
    '"items":[{},[]]',
    '{}',
    '[]',
  ])
})
