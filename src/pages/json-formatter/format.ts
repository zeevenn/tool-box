import { deserializeJson } from './deserialize.ts'

export function formatJson(input: string, mode: 'format' | 'minify' | 'deserialize', indentSize: number) {
  try {
    const parsed: unknown = JSON.parse(input)
    const output = mode === 'deserialize'
      ? deserializeJson(parsed, indentSize)
      : JSON.stringify(parsed, null, mode === 'minify' ? undefined : indentSize)
    return { output, error: null }
  }
  catch (e) {
    return { output: '', error: (e as Error).message }
  }
}
