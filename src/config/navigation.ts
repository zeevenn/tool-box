export interface NavItem {
  label: string
  path: string
  shortLabel?: string // 用于移动端显示的短标签
}

export const navigationItems: NavItem[] = [
  {
    label: 'Text Diff',
    shortLabel: 'Text',
    path: '/',
  },
  {
    label: 'Image Diff',
    shortLabel: 'Image',
    path: '/image',
  },
  {
    label: 'JSON',
    path: '/json',
  },
  {
    label: 'Base64',
    path: '/base64',
  },
  {
    label: 'URL Encode',
    shortLabel: 'URL',
    path: '/url-encode',
  },
  {
    label: 'Hash',
    path: '/hash',
  },
  {
    label: 'Regex',
    path: '/regex',
  },
  {
    label: 'Timestamp',
    shortLabel: 'Time',
    path: '/timestamp',
  },
  {
    label: 'JWT',
    path: '/jwt',
  },
  {
    label: 'Color',
    path: '/color',
  },
]
