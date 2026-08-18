import type { LucideIcon } from 'lucide-react'
import type { TranslationKey } from '@/i18n/messages'
import {
  Binary,
  Braces,
  Clock3,
  FileKey2,
  Fingerprint,
  ImageIcon,
  Link2,
  NotebookPen,
  Palette,
  Regex,
  TextSelect,
} from 'lucide-react'

export type NavGroup = 'Workspace' | 'Compare' | 'Transform' | 'Inspect'

export interface NavItem {
  label: TranslationKey
  path: string
  shortLabel?: string
  description: TranslationKey
  group: NavGroup
  icon: LucideIcon
}

export const navigationItems: NavItem[] = [
  {
    label: 'Scratchpad',
    path: '/scratchpad',
    description: 'Write and keep quick notes locally in your browser.',
    group: 'Workspace',
    icon: NotebookPen,
  },
  {
    label: 'Text Diff',
    shortLabel: 'Text',
    path: '/',
    description: 'Compare two text or code versions side by side.',
    group: 'Compare',
    icon: TextSelect,
  },
  {
    label: 'Image Diff',
    shortLabel: 'Image',
    path: '/image',
    description: 'Inspect visual changes with multiple comparison modes.',
    group: 'Compare',
    icon: ImageIcon,
  },
  {
    label: 'JSON Formatter',
    shortLabel: 'JSON',
    path: '/json',
    description: 'Format, minify, and validate JSON instantly.',
    group: 'Transform',
    icon: Braces,
  },
  {
    label: 'Base64',
    path: '/base64',
    description: 'Encode text and images or decode Base64 data.',
    group: 'Transform',
    icon: Binary,
  },
  {
    label: 'URL Encode',
    shortLabel: 'URL',
    path: '/url-encode',
    description: 'Encode and decode URL-safe strings in real time.',
    group: 'Transform',
    icon: Link2,
  },
  {
    label: 'Hash Generator',
    shortLabel: 'Hash',
    path: '/hash',
    description: 'Generate common cryptographic hashes locally.',
    group: 'Transform',
    icon: Fingerprint,
  },
  {
    label: 'Regex Tester',
    shortLabel: 'Regex',
    path: '/regex',
    description: 'Test regular expressions and inspect every match.',
    group: 'Inspect',
    icon: Regex,
  },
  {
    label: 'Timestamp',
    shortLabel: 'Time',
    path: '/timestamp',
    description: 'Convert Unix timestamps and readable dates.',
    group: 'Inspect',
    icon: Clock3,
  },
  {
    label: 'JWT Decoder',
    shortLabel: 'JWT',
    path: '/jwt',
    description: 'Inspect JWT headers, payloads, and expiration.',
    group: 'Inspect',
    icon: FileKey2,
  },
  {
    label: 'Color Converter',
    shortLabel: 'Color',
    path: '/color',
    description: 'Convert HEX, RGB, and HSL color values.',
    group: 'Inspect',
    icon: Palette,
  },
]

export const navigationGroups: NavGroup[] = ['Workspace', 'Compare', 'Transform', 'Inspect']

export function getNavigationItem(pathname: string) {
  return navigationItems.find(item => item.path === pathname)
}
