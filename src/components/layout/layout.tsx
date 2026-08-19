import type { ReactNode } from 'react'
import { useLocation } from 'react-router'

import { getNavigationItem } from '@/config/navigation'
import { useI18n } from '@/context/i18n-provider'
import { cn } from '@/lib/utils'

import { Header } from './header'

interface LayoutProps {
  children: ReactNode
  className?: string
}

export function Layout({ children, className }: LayoutProps) {
  const location = useLocation()
  const current = getNavigationItem(location.pathname)
  const Icon = current?.icon
  const { t } = useI18n()

  return (
    <div className={cn('flex h-dvh min-h-[640px] flex-col overflow-hidden bg-background lg:flex-row', className)}>
      <Header />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4 lg:p-5 xl:p-6">
          {current
            ? (
                <div className="mx-auto flex min-h-0 min-w-0 w-full max-w-[1680px] flex-1 flex-col gap-4">
                  <section className="flex shrink-0 items-center gap-3 px-1 py-1 sm:gap-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-primary/15 bg-primary/10 text-primary sm:size-11">
                      {Icon && <Icon className="size-[18px]" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h1 className="truncate text-lg font-semibold tracking-[-0.025em] sm:text-xl">{t(current.label)}</h1>
                      <p className="truncate text-xs text-muted-foreground sm:text-sm">{t(current.description)}</p>
                    </div>
                  </section>

                  <section className="tool-workspace flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-[0_18px_55px_-32px_oklch(0.2_0.05_265_/_0.35)]">
                    {children}
                  </section>
                </div>
              )
            : children}
        </main>
      </div>
    </div>
  )
}
