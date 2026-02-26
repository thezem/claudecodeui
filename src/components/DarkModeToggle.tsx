import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

type DarkModeToggleProps = {
  checked?: boolean
  onToggle?: (nextValue: boolean) => void
  ariaLabel?: string
}

function DarkModeToggle({ checked, onToggle, ariaLabel = 'Toggle dark mode' }: DarkModeToggleProps) {
  const { isDarkMode, toggleDarkMode } = useTheme()
  const isControlled = typeof checked === 'boolean' && typeof onToggle === 'function'
  const isEnabled = isControlled ? checked : isDarkMode

  const handleToggle = () => {
    if (isControlled) {
      onToggle(!isEnabled)
      return
    }

    toggleDarkMode()
  }

  return (
    <button
      onClick={handleToggle}
      className="relative inline-flex h-8 w-14 items-center rounded-full bg-secondary dark:bg-secondary/40 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:focus:ring-offset-background"
      role="switch"
      aria-checked={isEnabled}
      aria-label={ariaLabel}
    >
      <span className="sr-only">{ariaLabel}</span>
      <span
        className={`${
          isEnabled ? 'translate-x-7' : 'translate-x-1'
        } h-6 w-6 transform rounded-full bg-background shadow-lg transition-transform duration-200 flex items-center justify-center`}
      >
        {isEnabled ? <Moon className="h-3.5 w-3.5 text-muted-foreground" /> : <Sun className="h-3.5 w-3.5 text-accent" />}
      </span>
    </button>
  )
}

export default DarkModeToggle
