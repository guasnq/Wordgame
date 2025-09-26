// UI相关类型定义

export interface ExtensionCard {
  id: string
  name: string
  title: string
  position: 'left' | 'right'
  type: 'list' | 'keyvalue' | 'progress' | 'custom'
  data: unknown
  visible: boolean
  collapsed: boolean
  order: number
}

export interface LayoutConfig {
  desktop: {
    sidebar: 'left' | 'right' | 'both'
    mainWidth: 'narrow' | 'wide' | 'full'
  }
  mobile: {
    navigation: 'drawer' | 'tabs'
    cardDisplay: 'overlay' | 'stack'
  }
}

export interface ThemeConfig {
  name: string
  colors: {
    primary: string
    secondary: string
    background: string
    surface: string
    text: string
    accent: string
  }
  typography: {
    fontFamily: string
    fontSize: {
      small: string
      normal: string
      large: string
    }
  }
  spacing: {
    compact: boolean
    cardPadding: string
    sectionGap: string
  }
}
