import { useRef } from 'preact/hooks'
import type { HighlightLanguage } from '../highlight'
import { HighlightedCode } from './highlighted-code'

interface HighlightedTextareaProps {
  readonly id: string
  readonly value: string
  readonly language: HighlightLanguage
  readonly onInput: (value: string) => void
}

export function HighlightedTextarea({ id, value, language, onInput }: HighlightedTextareaProps) {
  const highlightLayer = useRef<HTMLDivElement>(null)

  return (
    <div class="highlight-editor">
      <div class="highlight-editor-code" aria-hidden="true" ref={highlightLayer}>
        <HighlightedCode code={value} language={language} />
      </div>
      <textarea
        id={id}
        value={value}
        onInput={(event) => onInput(event.currentTarget.value)}
        onScroll={(event) => {
          if (!highlightLayer.current) return
          highlightLayer.current.scrollTop = event.currentTarget.scrollTop
          highlightLayer.current.scrollLeft = event.currentTarget.scrollLeft
        }}
        spellcheck={false}
      />
    </div>
  )
}
