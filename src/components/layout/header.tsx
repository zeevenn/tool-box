import { SiGithub } from '@icons-pack/react-simple-icons'
import { Languages, Menu, Monitor, Moon, PanelLeftClose, PanelLeftOpen, Sparkles, Sun } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router'

import { navigationGroups, navigationItems } from '@/config/navigation'
import { useI18n } from '@/context/i18n-provider'
import { useTheme } from '@/context/theme-provider'
import { cn } from '@/lib/utils'

import { Logo } from '../common/logo'
import { Button } from '../ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet'

interface HeaderProps {
  className?: string
}

type ThemeCycle = 'light' | 'dark' | 'system'
const THEME_CYCLE: ThemeCycle[] = ['light', 'dark', 'system']
const THEME_ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} satisfies Record<ThemeCycle, typeof Sun>

function Brand({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n()

  return (
    <Link
      to="/"
      className={cn(
        'flex items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        compact ? 'justify-center' : 'gap-3',
      )}
      title={compact ? 'Tool Box' : undefined}
    >
      <span className="grid size-10 place-items-center rounded-lg border border-border/70 bg-card shadow-sm">
        <Logo className="size-6" />
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className="block text-[15px] font-semibold tracking-[-0.02em]">Tool Box</span>
          <span className="block text-xs text-muted-foreground">{t('Utility workspace')}</span>
        </span>
      )}
    </Link>
  )
}

function Navigation({ mobile = false, compact = false }: { mobile?: boolean, compact?: boolean }) {
  const location = useLocation()
  const { t } = useI18n()

  return (
    <nav className={cn('flex flex-col', compact ? 'gap-4' : 'gap-6')} aria-label={t('Tools')}>
      {navigationGroups.map(group => (
        <div key={group} className="flex flex-col gap-1">
          {!compact && (
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
              {t(group)}
            </p>
          )}
          {navigationItems.filter(item => item.group === group).map((item) => {
            const Icon = item.icon
            const active = location.pathname === item.path
            const link = (
              <Link
                to={item.path}
                className={cn(
                  'group flex h-10 items-center rounded-lg text-sm font-medium transition-all duration-200',
                  compact ? 'justify-center px-0' : 'gap-3 px-3',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
                title={compact ? t(item.label) : undefined}
              >
                <Icon className={cn('size-4 transition-transform group-hover:scale-105', !active && 'text-muted-foreground')} />
                {!compact && <span className="truncate">{t(item.label)}</span>}
                {active && !compact && <span className="ml-auto size-1.5 rounded-full bg-primary-foreground/80" />}
              </Link>
            )

            return mobile
              ? <SheetClose key={item.path} asChild>{link}</SheetClose>
              : <div key={item.path}>{link}</div>
          })}
        </div>
      ))}
    </nav>
  )
}

export function Header({ className }: HeaderProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('tool-sidebar-collapsed') === 'true',
  )
  const { theme, setTheme } = useTheme()
  const { language, t, toggleLanguage } = useI18n()
  const currentTheme = theme as ThemeCycle
  const ThemeIcon = THEME_ICONS[currentTheme] ?? Monitor

  const cycleTheme = () => {
    const current = THEME_CYCLE.indexOf(currentTheme)
    setTheme(THEME_CYCLE[(current + 1) % THEME_CYCLE.length])
  }

  const toggleSidebar = () => {
    setSidebarCollapsed((collapsed) => {
      const next = !collapsed
      localStorage.setItem('tool-sidebar-collapsed', String(next))
      return next
    })
  }

  return (
    <>
      <aside
        className={cn(
          'hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar/90 py-4 backdrop-blur-xl lg:flex',
          sidebarCollapsed ? 'w-[72px] px-2' : 'w-[248px] px-3',
          className,
        )}
      >
        <div className="px-2 pb-7">
          <Brand compact={sidebarCollapsed} />
        </div>

        <div className={cn('sidebar-scroll min-h-0 flex-1 overflow-y-auto', !sidebarCollapsed && 'px-1')}>
          <Navigation compact={sidebarCollapsed} />
        </div>

        <div className={cn('mt-4 flex flex-col border-t border-sidebar-border pt-4', sidebarCollapsed ? 'items-center gap-1' : 'gap-3 px-1')}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 rounded-lg bg-accent/60 px-3 py-2.5">
              <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium">{t('Private by default')}</p>
                <p className="text-[11px] text-muted-foreground">{t('Processed in your browser')}</p>
              </div>
            </div>
          )}

          <div className={cn('flex items-center gap-1', sidebarCollapsed ? 'flex-col' : 'justify-between')}>
            <Button
              variant="ghost"
              size={sidebarCollapsed ? 'icon-sm' : 'sm'}
              className={cn('cursor-pointer [&_svg]:!size-4', sidebarCollapsed ? 'justify-center' : 'justify-start')}
              onClick={cycleTheme}
              title={t('Theme: {theme}', { theme: t(theme) })}
            >
              <ThemeIcon data-icon="inline-start" />
              {!sidebarCollapsed && <span>{t(theme)}</span>}
            </Button>
            <div className={cn('flex items-center gap-1', sidebarCollapsed && 'flex-col')}>
              <Button
                variant="ghost"
                size="icon-sm"
                className="cursor-pointer [&_svg]:!size-4"
                onClick={toggleLanguage}
                aria-label={t('Change language')}
                title={`${t('Change language')}: ${language === 'en' ? t('English') : t('Simplified Chinese')}`}
              >
                <Languages data-icon="inline-start" />
              </Button>
              <Button variant="ghost" size="icon-sm" className="cursor-pointer [&_svg]:!size-4" asChild>
                <a href="https://github.com/zeevenn/tool-box" target="_blank" rel="noopener noreferrer" title={t('View on GitHub')}>
                  <SiGithub data-icon="inline-start" />
                  <span className="sr-only">GitHub</span>
                </a>
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="cursor-pointer [&_svg]:!size-4"
                onClick={toggleSidebar}
                aria-label={t(sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar')}
                aria-expanded={!sidebarCollapsed}
                title={t(sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar')}
              >
                {sidebarCollapsed
                  ? <PanelLeftOpen data-icon="inline-start" />
                  : <PanelLeftClose data-icon="inline-start" />}
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/70 bg-background/85 px-4 backdrop-blur-xl lg:hidden">
        <Brand />
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" className="cursor-pointer [&_svg]:!size-4" onClick={cycleTheme} title={t('Theme: {theme}', { theme: t(theme) })}>
            <ThemeIcon data-icon="inline-start" />
            <span className="sr-only">{t('Cycle theme')}</span>
          </Button>
          <Button variant="ghost" size="icon-sm" className="cursor-pointer [&_svg]:!size-4" onClick={toggleLanguage} title={t('Change language')}>
            <Languages data-icon="inline-start" />
            <span className="sr-only">{t('Change language')}</span>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon-sm" aria-label={t('Open navigation')}>
                <Menu data-icon="inline-start" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] gap-0 p-0" closeLabel={t('Close')}>
              <SheetHeader className="border-b border-border p-5 text-left">
                <SheetTitle>Tool Box</SheetTitle>
                <SheetDescription>{t('Choose a utility to open.')}</SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <Navigation mobile />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    </>
  )
}
