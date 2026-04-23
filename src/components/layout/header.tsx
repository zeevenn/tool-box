import { SiGithub } from '@icons-pack/react-simple-icons'
import { Menu, Moon, Sun, SunMoon, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router'

import { navigationItems } from '@/config/navigation'
import { useTheme } from '@/context/theme-provider'
import { cn } from '@/lib/utils'

import { Logo } from '../common/logo'
import { Button } from '../ui/button'
import { Typography } from '../ui/typography'

interface HeaderProps {
  className?: string
}

type ThemeCycle = 'light' | 'dark' | 'system'
const THEME_CYCLE: ThemeCycle[] = ['light', 'dark', 'system']
const THEME_ICONS: Record<ThemeCycle, React.ReactNode> = {
  light: <Sun className="w-4 h-4" />,
  dark: <Moon className="w-4 h-4" />,
  system: <SunMoon className="w-4 h-4" />,
}

export function Header({ className = '' }: HeaderProps) {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const isActive = (path: string) => location.pathname === path

  const cycleTheme = () => {
    const current = THEME_CYCLE.indexOf(theme as ThemeCycle)
    setTheme(THEME_CYCLE[(current + 1) % THEME_CYCLE.length])
  }

  const handleLinkClick = () => {
    setMobileMenuOpen(false)
  }

  return (
    <>
      <header
        className={`bg-background border-b border-border shadow-sm relative z-50 ${className}`}
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4 md:space-x-6">
              {/* Logo */}
              <Link to="/" className="flex-shrink-0 flex items-center space-x-2 sm:space-x-3">
                <Logo className="w-8 h-8 sm:w-10 sm:h-10" />
                <Typography variant="h4" className="text-foreground text-base sm:text-xl">
                  Tool Box
                </Typography>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex space-x-1">
                {navigationItems.map((item) => {
                  return (
                    <Button
                      key={item.path}
                      variant={isActive(item.path) ? 'secondary' : 'ghost'}
                      size="sm"
                      asChild
                    >
                      <Link to={item.path} className="gap-2">
                        {item.label}
                      </Link>
                    </Button>
                  )
                })}
              </nav>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={cycleTheme} title={`Theme: ${theme}`}>
                {THEME_ICONS[theme as ThemeCycle] ?? <SunMoon className="w-4 h-4" />}
              </Button>

              <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                <a
                  href="https://github.com/zeevenn/tool-box"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View on GitHub"
                >
                  <SiGithub />
                  <span className="hidden sm:inline">GitHub</span>
                </a>
              </Button>

              {/* Mobile GitHub Link (icon only) */}
              <Button variant="ghost" size="sm" asChild className="sm:hidden">
                <a
                  href="https://github.com/zeevenn/tool-box"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View on GitHub"
                >
                  <SiGithub className="w-4 h-4" />
                </a>
              </Button>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen
                  ? (
                      <X className="w-5 h-5" />
                    )
                  : (
                      <Menu className="w-5 h-5" />
                    )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <div
          className={cn(
            'absolute left-0 right-0 md:hidden overflow-hidden bg-background border-b border-border shadow-lg',
            'transition-all duration-200 ease-out',
            mobileMenuOpen
              ? 'max-h-96 opacity-100 translate-y-0'
              : 'max-h-0 opacity-0 -translate-y-2 border-b-0',
          )}
        >
          <nav className={cn(
            'px-4 py-2 space-y-1 transition-opacity duration-150',
            mobileMenuOpen ? 'opacity-100 delay-75' : 'opacity-0',
          )}
          >
            {navigationItems.map((item) => {
              return (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? 'secondary' : 'ghost'}
                  size="lg"
                  asChild
                  className="w-full justify-center h-12"
                >
                  <Link to={item.path} onClick={handleLinkClick}>
                    {item.label}
                  </Link>
                </Button>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-200',
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={() => setMobileMenuOpen(false)}
      />
    </>
  )
}
