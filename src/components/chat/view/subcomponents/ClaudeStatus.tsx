import { useEffect, useState } from 'react'
import { cn } from '../../../../lib/utils'

type ClaudeStatusProps = {
  status: {
    text?: string
    tokens?: number
    can_interrupt?: boolean
  } | null
  onAbort?: () => void
  isLoading: boolean
  provider?: string
}

const ACTION_WORDS = ['Thinking', 'Processing', 'Analyzing', 'Working', 'Computing', 'Reasoning']
const SPINNER_CHARS = ['*', '+', 'x', '.']

export default function ClaudeStatus({ status, onAbort, isLoading, provider: _provider = 'claude' }: ClaudeStatusProps) {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [animationPhase, setAnimationPhase] = useState(0)
  const [fakeTokens, setFakeTokens] = useState(0)

  useEffect(() => {
    if (!isLoading) {
      setElapsedTime(0)
      setFakeTokens(0)
      return
    }

    const startTime = Date.now()
    const tokenRate = 30 + Math.random() * 20

    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setElapsedTime(elapsed)
      setFakeTokens(Math.floor(elapsed * tokenRate))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [isLoading])

  useEffect(() => {
    if (!isLoading) {
      return
    }

    const timer = window.setInterval(() => {
      setAnimationPhase(previous => (previous + 1) % SPINNER_CHARS.length)
    }, 500)

    return () => window.clearInterval(timer)
  }, [isLoading])

  if (!isLoading) {
    return null
  }

  const actionIndex = Math.floor(elapsedTime / 3) % ACTION_WORDS.length
  const statusText = status?.text || ACTION_WORDS[actionIndex]
  const tokens = status?.tokens || fakeTokens
  const canInterrupt = status?.can_interrupt !== false
  const currentSpinner = SPINNER_CHARS[animationPhase]

  return (
    <div className="w-full mb-lg sm:mb-2xl animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between max-w-4xl mx-auto bg-hearth-card text-hearth-text rounded-md shadow-warm px-md py-base sm:px-lg sm:py-md border border-hearth-border">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-md sm:gap-lg">
            <span
              className={cn(
                'text-base sm:text-xl transition-all duration-500 flex-shrink-0',
                animationPhase % 2 === 0 ? 'text-hearth-accent scale-110' : 'text-hearth-accent',
              )}
            >
              {currentSpinner}
            </span>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-base sm:gap-md">
                <span className="font-medium text-xs sm:text-sm truncate">{statusText}...</span>
                <span className="text-hearth-muted text-xs sm:text-sm flex-shrink-0">({elapsedTime}s)</span>
                {tokens > 0 && (
                  <>
                    <span className="text-hearth-muted hidden sm:inline">|</span>
                    <span className="text-hearth-text text-xs sm:text-sm hidden sm:inline flex-shrink-0">
                      tokens {tokens.toLocaleString()}
                    </span>
                  </>
                )}
                <span className="text-hearth-muted hidden sm:inline">|</span>
                <span className="text-hearth-muted text-xs sm:text-sm hidden sm:inline">esc to stop</span>
              </div>
            </div>
          </div>
        </div>

        {canInterrupt && onAbort && (
          <button
            onClick={onAbort}
            className="ml-md sm:ml-lg text-xs bg-hearth-accent-deep hover:bg-hearth-accent active:bg-hearth-text text-white px-md py-base sm:px-lg sm:py-md rounded-xs transition-colors flex items-center gap-base sm:gap-md flex-shrink-0 font-medium"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="hidden sm:inline">Stop</span>
          </button>
        )}
      </div>
    </div>
  )
}
