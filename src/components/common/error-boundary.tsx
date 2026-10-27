import type { ReactNode } from 'react'
import type { TranslationKey } from '@/i18n/messages'
import { Component } from 'react'

import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { zhCN } from '@/i18n/messages'

// The root fallback must also work when a context provider fails.
function translate(message: TranslationKey) {
  return document.documentElement.lang === 'zh-CN' ? zhCN[message] : message
}

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (!this.state.hasError)
      return this.props.children

    return (
      <Empty role="alert">
        <EmptyHeader>
          <EmptyTitle>{translate('Something went wrong')}</EmptyTitle>
          <EmptyDescription>{translate('This view could not be displayed. You can try again.')}</EmptyDescription>
        </EmptyHeader>
        <Button onClick={() => this.setState({ hasError: false })}>{translate('Try again')}</Button>
      </Empty>
    )
  }
}
