import { SiGithub } from '@icons-pack/react-simple-icons'
import { Menu, Monitor, Moon, Sparkles, Sun } from 'lucide-react'
import { Link, useLocation } from 'react-router'

import { navigationGroups, navigationItems } from '@/config/navigation'
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

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <span className="grid size-10 place-items-center rounded-lg border border-border/70 bg-card shadow-sm">
        <Logo className="size-6" />
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold tracking-[-0.02em]">Tool Box</span>
        <span className="block text-xs text-muted-foreground">Utility workspace</span>
      </span>
    </Link>
  )
}

function Navigation({ mobile = false }: { mobile?: boolean }) {
  const location = useLocation()

  return (
    <nav className="flex flex-col gap-6" aria-label="Tools">
      {navigationGroups.map(group => (
        <div key={group} className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
            {group}
          </p>
          {navigationItems.filter(item => item.group === group).map((item) => {
            const Icon = item.icon
            const active = location.pathname === item.path
            const link = (
              <Link
                to={item.path}
                className={cn(
                  'group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <Icon className={cn('size-4 transition-transform group-hover:scale-105', !active && 'text-muted-foreground')} />
                <span className="truncate">{item.label}</span>
                {active && <span className="ml-auto size-1.5 rounded-full bg-primary-foreground/80" />}
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
  const { theme, setTheme } = useTheme()
  const currentTheme = theme as ThemeCycle
  const ThemeIcon = THEME_ICONS[currentTheme] ?? Monitor

  const cycleTheme = () => {
    const current = THEME_CYCLE.indexOf(currentTheme)
    setTheme(THEME_CYCLE[(current + 1) % THEME_CYCLE.length])
  }

  return (
    <>
      <aside className={cn('hidden h-screen w-[248px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar/90 px-3 py-4 backdrop-blur-xl lg:flex', className)}>
        <div className="px-2 pb-7">
          <Brand />
        </div>

        <div className="sidebar-scroll min-h-0 flex-1 overflow-y-auto px-1">
          <Navigation />
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-sidebar-border px-1 pt-4">
          <div className="flex items-center gap-2 rounded-lg bg-accent/60 px-3 py-2.5">
            <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium">Private by default</p>
              <p className="text-[11px] text-muted-foreground">Processed in your browser</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-1">
            <Button variant="ghost" size="sm" className="cursor-pointer justify-start [&_svg]:!size-4" onClick={cycleTheme} title={`Theme: ${theme}`}>
              <ThemeIcon data-icon="inline-start" />
              <span className="capitalize">{theme}</span>
            </Button>
            <Button variant="ghost" size="icon-sm" className="cursor-pointer [&_svg]:!size-4" asChild>
              <a href="https://github.com/zeevenn/tool-box" target="_blank" rel="noopener noreferrer" title="View on GitHub">
                <SiGithub data-icon="inline-start" />
                <span className="sr-only">GitHub</span>
              </a>
            </Button>
          </div>
        </div>
      </aside>

      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/70 bg-background/85 px-4 backdrop-blur-xl lg:hidden">
        <Brand />
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" className="cursor-pointer [&_svg]:!size-4" onClick={cycleTheme} title={`Theme: ${theme}`}>
            <ThemeIcon data-icon="inline-start" />
            <span className="sr-only">Cycle theme</span>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon-sm" aria-label="Open navigation">
                <Menu data-icon="inline-start" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] gap-0 p-0">
              <SheetHeader className="border-b border-border p-5 text-left">
                <SheetTitle>Tool Box</SheetTitle>
                <SheetDescription>Choose a utility to open.</SheetDescription>
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
