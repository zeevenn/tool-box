import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Chunk } from '@codemirror/merge'
import { Text } from '@codemirror/state'
import { MERGE_DIFF_CONFIG } from './codemirror-config.ts'

test('large JSON changes leave an identical middle object unhighlighted', () => {
  const fields = Array.from({ length: 160 }, (_, i) => ({
    title: `Field ${i}`,
    type: 'string',
    description: 'A field in the configuration schema',
    default: i,
  }))
  const original = {
    before: fields,
    oralGiftConfig: {
      enabled: true,
      userGroupIds: [1, 2],
      settings: Array.from({ length: 30 }, (_, i) => ({ name: `Setting ${i}`, value: i })),
    },
    after: fields,
  }
  const modified = {
    before: fields.map((field, i) => i % 5 ? field : { ...field, maxLength: 8 }),
    oralGiftConfig: original.oralGiftConfig,
    after: fields.map((field, i) => i % 5 ? field : { ...field, title: `Updated ${i}` }),
  }
  const [a, b] = [original, modified].map(value => JSON.stringify(value, null, 2))
  const chunks = Chunk.build(Text.of(a.split('\n')), Text.of(b.split('\n')), MERGE_DIFF_CONFIG)
  assert.ok(chunks.length > 0)
  for (const [side, text] of [['A', a], ['B', b]] as const) {
    const from = text.indexOf('  "oralGiftConfig":')
    const to = text.indexOf('  "after":')
    assert.ok(chunks.every(chunk => chunk[`to${side}`] <= from || chunk[`from${side}`] >= to))
  }
})
