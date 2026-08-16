import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import { txtfsmLanguage } from './txtfsm-language';

export type HighlightLanguage = 'html' | 'javascript' | 'json' | 'txtfsm';

const highlighterPromise = createHighlighterCore({
  themes: [import('@shikijs/themes/github-dark')],
  langs: [
    import('@shikijs/langs/html'),
    import('@shikijs/langs/javascript'),
    import('@shikijs/langs/json'),
    txtfsmLanguage,
  ],
  engine: createJavaScriptRegexEngine(),
});

export async function highlightCode(code: string, language: HighlightLanguage): Promise<string> {
  const highlighter = await highlighterPromise;
  return highlighter.codeToHtml(code, {
    lang: language,
    theme: 'github-dark',
  });
}
