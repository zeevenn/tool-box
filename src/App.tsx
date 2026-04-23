import { BrowserRouter, Route, Routes } from 'react-router'
import { Toaster } from 'sonner'

import { NotFound } from './components/common'
import { Layout } from './components/layout'
import { useTheme } from './context/theme-provider'
import { useDynamicFavicon } from './hooks/use-dynamic-favicon'
import {
  Base64,
  ColorConverter,
  HashGenerator,
  ImageDiff,
  JsonFormatter,
  JwtDecoder,
  RegexTester,
  TextDiff,
  TimestampConverter,
  UrlEncode,
} from './pages'

function App() {
  useDynamicFavicon()
  const { resolvedTheme } = useTheme()

  return (
    <BrowserRouter>
      <Layout>
        <Toaster position="top-center" richColors theme={resolvedTheme} />
        <Routes>
          <Route path="/" element={<TextDiff />} />
          <Route path="/image" element={<ImageDiff />} />
          <Route path="/json" element={<JsonFormatter />} />
          <Route path="/base64" element={<Base64 />} />
          <Route path="/url-encode" element={<UrlEncode />} />
          <Route path="/hash" element={<HashGenerator />} />
          <Route path="/regex" element={<RegexTester />} />
          <Route path="/timestamp" element={<TimestampConverter />} />
          <Route path="/jwt" element={<JwtDecoder />} />
          <Route path="/color" element={<ColorConverter />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
