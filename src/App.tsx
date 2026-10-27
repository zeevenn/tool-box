import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router'
import { Toaster } from 'sonner'

import { Loading, NotFound } from './components/common'
import { ErrorBoundary } from './components/common/error-boundary'
import { Layout } from './components/layout'
import { useTheme } from './context/theme-provider'
import { useDynamicFavicon } from './hooks/use-dynamic-favicon'

const TextDiff = lazy(() => import('./pages/text-diff').then(module => ({ default: module.TextDiff })))
const ImageDiff = lazy(() => import('./pages/image-diff').then(module => ({ default: module.ImageDiff })))
const JsonFormatter = lazy(() => import('./pages/json-formatter').then(module => ({ default: module.JsonFormatter })))
const Base64 = lazy(() => import('./pages/base64').then(module => ({ default: module.Base64 })))
const UrlEncode = lazy(() => import('./pages/url-encode').then(module => ({ default: module.UrlEncode })))
const HashGenerator = lazy(() => import('./pages/hash').then(module => ({ default: module.HashGenerator })))
const RegexTester = lazy(() => import('./pages/regex-tester').then(module => ({ default: module.RegexTester })))
const TimestampConverter = lazy(() => import('./pages/timestamp').then(module => ({ default: module.TimestampConverter })))
const JwtDecoder = lazy(() => import('./pages/jwt-decoder').then(module => ({ default: module.JwtDecoder })))
const ColorConverter = lazy(() => import('./pages/color-converter').then(module => ({ default: module.ColorConverter })))
const QrCodeGenerator = lazy(() => import('./pages/qr-code').then(module => ({ default: module.QrCodeGenerator })))
const Scratchpad = lazy(() => import('./pages/scratchpad').then(module => ({ default: module.Scratchpad })))

function App() {
  useDynamicFavicon()
  const { resolvedTheme } = useTheme()

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Toaster position="top-center" richColors theme={resolvedTheme} />
      <Layout>
        <ToolRoutes />
      </Layout>
    </BrowserRouter>
  )
}

function ToolRoutes() {
  const { pathname } = useLocation()
  return (
    <ErrorBoundary key={pathname}>
      <Suspense fallback={<div className="flex flex-1 items-center justify-center"><Loading /></div>}>
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
          <Route path="/qr-code" element={<QrCodeGenerator />} />
          <Route path="/scratchpad" element={<Scratchpad />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

export default App
