import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatJson } from './format.ts'

test('invalid JSON returns an error instead of throwing in every output mode', () => {
  for (const mode of ['format', 'minify', 'deserialize'] as const) {
    for (const input of ['oralGiftConfig', '{', '{"oralGiftConfig":', '', 'undefined']) {
      const result = formatJson(input, mode, 2)
      assert.equal(result.output, '')
      assert.ok(result.error)
    }
  }
})

test('valid JSON formats, minifies and deserializes after an invalid result', () => {
  assert.ok(formatJson('oralGiftConfig', 'format', 2).error)
  const input = '{"oralGiftConfig":"first\\nsecond"}'
  assert.deepEqual(formatJson(input, 'format', 4), { output: '{\n    "oralGiftConfig": "first\\nsecond"\n}', error: null })
  assert.deepEqual(formatJson(input, 'minify', 2), { output: input, error: null })
  assert.deepEqual(formatJson(input, 'deserialize', 2), { output: '{\n  "oralGiftConfig": "first\nsecond"\n}', error: null })
  for (const input of ['null', 'false', '42', '[]', '"text"'])
    assert.equal(formatJson(input, 'format', 2).error, null)
})
