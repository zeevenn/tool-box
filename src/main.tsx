import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'

import { I18nProvider } from './context/i18n-provider'
import { ThemeProvider } from './context/theme-provider'
import { ToolStateProvider } from './context/tool-state-provider'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <ThemeProvider>
        <ToolStateProvider>
          <App />
        </ToolStateProvider>
      </ThemeProvider>
    </I18nProvider>
  </StrictMode>,
)
