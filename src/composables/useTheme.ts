import { ref, watch, onMounted } from 'vue'

export type Theme = 'dark' | 'light'

const theme = ref<Theme>('dark')

export const useTheme = () => {
  const toggleTheme = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme
  }

  watch(theme, (newTheme) => {
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('drivescore-theme', newTheme)
  })

  onMounted(() => {
    const storedTheme = localStorage.getItem('drivescore-theme') as Theme | null
    if (storedTheme) {
      theme.value = storedTheme
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      theme.value = prefersDark ? 'dark' : 'light'
    }
    document.documentElement.setAttribute('data-theme', theme.value)
  })

  return {
    theme,
    toggleTheme,
    setTheme
  }
}
