import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { DiffLanguage } from '@/pages/text-diff/use-diff-session'

import { createContext, use, useCallback, useMemo, useState } from 'react'

export type Base64Mode = 'encode' | 'decode'
export type RegexFlag = 'g' | 'i' | 'm' | 's'
export type ImageComparisonMode = 'side-by-side' | 'overlay' | 'slider' | 'difference'

export interface ImageSelection {
  file: File
  name: string
  size: number
  dimensions: { width: number, height: number }
}

export interface ToolState {
  textDiff: {
    original: string
    modified: string
    language: DiffLanguage
  }
  imageDiff: {
    original: ImageSelection | null
    modified: ImageSelection | null
    comparisonMode: ImageComparisonMode
    sliderPosition: number
    overlayOpacity: number
    differenceThreshold: number
  }
  jsonFormatter: {
    input: string
    output: string
    error: string | null
    indentSize: number
  }
  base64: {
    text: string
    encoded: string
    mode: Base64Mode
  }
  urlEncode: {
    decoded: string
    encoded: string
  }
  hash: {
    input: string
  }
  regex: {
    pattern: string
    flags: Set<RegexFlag>
    testText: string
  }
  timestamp: {
    input: string
  }
  jwt: {
    input: string
  }
  color: {
    hex: string
    rgb: string
    hsl: string
    previewColor: string
  }
}

const INITIAL_TOOL_STATE: ToolState = {
  textDiff: {
    original: 'function hello() {\n  console.log("Hello World");\n}',
    modified: 'function hello() {\n  console.log("Hello, World!");\n  return "Hello";\n}',
    language: 'plain',
  },
  imageDiff: {
    original: null,
    modified: null,
    comparisonMode: 'side-by-side',
    sliderPosition: 50,
    overlayOpacity: 50,
    differenceThreshold: 24,
  },
  jsonFormatter: { input: '', output: '', error: null, indentSize: 2 },
  base64: { text: '', encoded: '', mode: 'encode' },
  urlEncode: { decoded: '', encoded: '' },
  hash: { input: '' },
  regex: { pattern: '', flags: new Set<RegexFlag>(['g']), testText: '' },
  timestamp: { input: '' },
  jwt: { input: '' },
  color: {
    hex: '#3b82f6',
    rgb: '59, 130, 246',
    hsl: '217, 91%, 60%',
    previewColor: '#3b82f6',
  },
}

interface ToolStateContextValue {
  state: ToolState
  setState: Dispatch<SetStateAction<ToolState>>
}

const ToolStateContext = createContext<ToolStateContextValue | null>(null)

export function ToolStateProvider({ children }: { children: ReactNode }) {
  // Tool drafts intentionally live only for the lifetime of this app instance.
  // Sensitive inputs such as JWTs must not be written to browser storage here.
  const [state, setState] = useState<ToolState>(INITIAL_TOOL_STATE)
  const value = useMemo(() => ({ state, setState }), [state])

  return <ToolStateContext value={value}>{children}</ToolStateContext>
}

export function useToolState<K extends keyof ToolState>(key: K) {
  const context = use(ToolStateContext)
  if (!context)
    throw new Error('useToolState must be used within ToolStateProvider')

  const { state, setState } = context
  const setToolState: Dispatch<SetStateAction<ToolState[K]>> = useCallback((action) => {
    setState((current) => {
      const next = typeof action === 'function'
        ? (action as (previous: ToolState[K]) => ToolState[K])(current[key])
        : action
      return Object.is(next, current[key]) ? current : { ...current, [key]: next }
    })
  }, [key, setState])

  return [state[key], setToolState] as const
}
