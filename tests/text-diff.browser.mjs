// Run against pnpm dev: node --test tests/text-diff.browser.mjs (requires Playwright and Chrome).
import assert from 'node:assert/strict'
import process from 'node:process'
import { test } from 'node:test'

test('diff editing preserves focus and scroll; navigation follows differences on both sides', async () => {
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright')
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const url = process.env.TEXT_DIFF_URL ?? 'http://127.0.0.1:5173/tool-box/'
  const lines = Array.from({ length: 250 }, (_, i) => `line ${i}`)

  async function loadDraft(language, original = lines.join('\n'), modified = original) {
    await page.goto(url)
    await page.evaluate(({ original, modified, language }) => {
      localStorage.setItem('tool-box-language', 'en')
      localStorage.setItem('tool-box-text-diff-draft-v1', JSON.stringify({ original, modified, language }))
    }, { original, modified, language })
    await page.reload()
    await page.locator('.cm-content').nth(1).waitFor()
  }

  function selectedLine() {
    return page.evaluate(() => window.getSelection()?.anchorNode?.parentElement?.closest('.cm-line')?.textContent)
  }

  try {
    for (const language of ['plain', 'json', 'javascript', 'typescript']) {
      await loadDraft(language)
      for (const side of ['Original text', 'Modified text']) {
        const editor = page.getByRole('textbox', { name: side, exact: true })
        await editor.click()
        await page.keyboard.press('ControlOrMeta+End')
        await page.waitForTimeout(150)
        const element = await editor.elementHandle()
        const before = await page.locator('.cm-mergeView').evaluate(el => el.scrollTop)
        assert.ok(before > 1000)
        await page.keyboard.type('xyz', { delay: 40 })
        await page.waitForTimeout(150)
        assert.ok(await element.evaluate(el => el.isConnected && el === document.activeElement), `${language}: ${side} was recreated or lost focus`)
        assert.ok(Math.abs(await page.locator('.cm-mergeView').evaluate(el => el.scrollTop) - before) < 50, `${language}: ${side} jumped`)
        assert.ok((await editor.textContent()).endsWith('xyz'))
      }
    }

    const modified = lines.map((line, i) => [40, 120, 200].includes(i) ? `changed ${i}` : line).join('\n')
    await loadDraft('json', lines.join('\n'), modified)
    const next = page.getByRole('button', { name: 'Next difference', exact: true })
    const previous = page.getByRole('button', { name: 'Previous difference', exact: true })
    for (const side of ['Modified text', 'Original text']) {
      await page.getByRole('textbox', { name: side, exact: true }).click()
      await page.keyboard.press('ControlOrMeta+Home')
      for (const [index, line] of [40, 120, 200, 40].entries()) {
        if (index === 2) {
          await next.focus()
          await page.keyboard.press('Enter')
        }
        else {
          await next.click()
        }
        await page.waitForTimeout(100)
        assert.equal(await selectedLine(), `${side === 'Original text' ? 'line' : 'changed'} ${line}`)
        assert.ok(await page.locator('.cm-mergeView').evaluate(el => el.scrollTop) > 0)
      }
      for (const [index, line] of [200, 120, 40, 200].entries()) {
        if (index === 2) {
          await previous.focus()
          await page.keyboard.press('Enter')
        }
        else {
          await previous.click()
        }
        await page.waitForTimeout(100)
        assert.equal(await selectedLine(), `${side === 'Original text' ? 'line' : 'changed'} ${line}`)
        assert.ok(await page.locator('.cm-mergeView').evaluate(el => el.scrollTop) > 0)
      }
      await next.click()
      assert.equal(await selectedLine(), `${side === 'Original text' ? 'line' : 'changed'} 40`)
    }

    await loadDraft('plain', lines.join('\n'), `${lines.join('\n')}\nadded at end`)
    await next.click()
    await page.waitForTimeout(150)
    assert.match(await selectedLine(), /^(?:line 249|added at end)$/)
    assert.ok(await page.locator('.cm-mergeView').evaluate(el => el.scrollTop) > 4000)
    await loadDraft('plain', `${lines.join('\n')}\ndeleted at end`, lines.join('\n'))
    await page.getByRole('textbox', { name: 'Original text', exact: true }).click()
    await page.keyboard.press('ControlOrMeta+Home')
    await next.click()
    await page.waitForTimeout(150)
    assert.match(await selectedLine(), /^(?:line 249|deleted at end)$/)
    assert.ok(await page.locator('.cm-mergeView').evaluate(el => el.scrollTop) > 4000)

    const singleChange = lines.map((line, i) => i === 40 ? 'only change' : line).join('\n')
    await loadDraft('plain', lines.join('\n'), singleChange)
    await next.click()
    await page.locator('.cm-mergeView').evaluate(el => el.scrollTop = el.scrollHeight)
    await next.click()
    await page.waitForTimeout(150)
    assert.equal(await selectedLine(), 'only change')
    assert.ok(await page.locator('.cm-mergeView').evaluate(el => el.scrollTop) < 1500)
    await page.locator('.cm-mergeView').evaluate(el => el.scrollTop = el.scrollHeight)
    await previous.click()
    await page.waitForTimeout(150)
    assert.equal(await selectedLine(), 'only change')
    assert.ok(await page.locator('.cm-mergeView').evaluate(el => el.scrollTop) < 1500)

    await page.setViewportSize({ width: 390, height: 844 })
    await page.screenshot({ path: '/tmp/tool-box-diff-mobile.png' })
    assert.ok(await next.isVisible())
    assert.ok(await previous.isVisible())
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await page.evaluate(() => {
      localStorage.setItem('tool-box-language', 'zh-CN')
      localStorage.setItem('tool-ui-theme', 'dark')
    })
    await page.reload()
    await page.getByRole('button', { name: '下一个差异', exact: true }).waitFor()
    await page.getByRole('button', { name: '上一个差异', exact: true }).waitFor()
    await page.screenshot({ path: '/tmp/tool-box-diff-mobile-dark-zh.png' })
    await loadDraft('plain')
    assert.ok(await next.isDisabled(), 'Identical documents must disable navigation')
    assert.ok(await previous.isDisabled(), 'Identical documents must disable backward navigation')
    await loadDraft('plain', '', '')
    assert.ok(await next.isDisabled(), 'Empty documents must disable navigation')
    assert.ok(await previous.isDisabled(), 'Empty documents must disable backward navigation')
  }
  finally {
    await browser.close()
  }
})
