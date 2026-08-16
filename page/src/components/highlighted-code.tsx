import { useEffect, useState } from 'preact/hooks'
import type { HighlightLanguage } from '../highlight'

interface HighlightedCodeProps {
  readonly code: string
  readonly language?: HighlightLanguage
}

export function HighlightedCode({ code, language }: HighlightedCodeProps) {
  const [html, setHtml] = useState<string>()

  useEffect(() => {
    let active = true
    setHtml(undefined)

    if (language) {
      void import('../highlight')
        .then(({ highlightCode }) => highlightCode(code, language))
        .then((result) => {
          if (active) setHtml(result)
        })
        .catch(() => {
          if (active) setHtml(undefined)
        })
    }

    return () => {
      active = false
    }
  }, [code, language])

  if (!html) {
    return <pre><code>{code}</code></pre>
  }

  return <div class="highlighted-code" dangerouslySetInnerHTML={{ __html: html }} />
}
