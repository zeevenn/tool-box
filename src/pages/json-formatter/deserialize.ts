export interface JsonStringField {
  path: string
  value: string
}

export function deserializeJson(value: unknown, indentSize: number): string {
  if (typeof value === 'string')
    return value

  // Decode complete JSON string tokens exactly once. Replacing escape sequences
  // globally would corrupt literal backslashes (for example, a literal \\n).
  return JSON.stringify(value, null, indentSize).replace(/"(?:[^"\\]|\\.)*"/g, (token) => {
    return `"${JSON.parse(token)}"`
  })
}

export function getJsonStringFields(value: unknown): JsonStringField[] {
  const fields: JsonStringField[] = []

  function visit(current: unknown, path: string) {
    if (typeof current === 'string') {
      fields.push({ path, value: current })
    }
    else if (Array.isArray(current)) {
      current.forEach((item, index) => visit(item, `${path}[${index}]`))
    }
    else if (current !== null && typeof current === 'object') {
      Object.entries(current).forEach(([key, item]) => {
        const segment = /^[a-z_$][\w$]*$/i.test(key) ? `.${key}` : `[${JSON.stringify(key)}]`
        visit(item, `${path}${segment}`)
      })
    }
  }

  visit(value, '$')
  return fields
}
