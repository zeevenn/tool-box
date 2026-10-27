import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DIFF_DRAFT_STORAGE_KEY, readDiffDraft } from './diff-draft.ts'

test('restores only a valid current diff, including cleared inputs', (t) => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  let saved: string | null = null
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem(key: string) {
        assert.equal(key, DIFF_DRAFT_STORAGE_KEY)
        return saved
      },
    },
  })
  t.after(() => {
    if (previous)
      Object.defineProperty(globalThis, 'localStorage', previous)
    else
      Reflect.deleteProperty(globalThis, 'localStorage')
  })

  for (const language of ['plain', 'javascript', 'typescript', 'json']) {
    for (const original of ['中文\noriginal', '']) {
      const draft = { original, modified: '', language }
      saved = JSON.stringify({ ...draft, unrelated: 'discard me' })
      assert.deepEqual(readDiffDraft(), draft)
    }
  }

  for (const invalid of [null, '{broken', 'null', '[]', '{}', 'true', '{"original":1,"modified":"","language":"json"}', '{"original":"","modified":false,"language":"json"}', '{"original":"","modified":"","language":"html"}']) {
    saved = invalid
    assert.equal(readDiffDraft(), undefined)
  }

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() { throw new Error('Storage unavailable') },
  })
  assert.equal(readDiffDraft(), undefined)
})
