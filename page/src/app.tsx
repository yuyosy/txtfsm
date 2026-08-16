import type { ComponentType } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import externalLinkIcon from './assets/external-link.svg?no-inline';
import { ExamplesPage } from './pages/examples-page';
import { GettingStartedPage } from './pages/getting-started-page';
import { LibraryPage } from './pages/library-page';
import { PlaygroundPage } from './pages/playground-page';
import './app.css';

type PageId = 'home' | 'playground' | 'examples' | 'library';

const NAVIGATION: readonly { id: PageId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'playground', label: 'Playground' },
  { id: 'examples', label: 'Examples' },
  { id: 'library', label: 'API Reference' },
];

const PAGE_COMPONENTS: Record<PageId, ComponentType> = {
  home: GettingStartedPage,
  playground: PlaygroundPage,
  examples: ExamplesPage,
  library: LibraryPage,
};

function pageFromHash(): PageId | undefined {
  const page = window.location.hash.slice(1);
  return NAVIGATION.some(({ id }) => id === page) ? (page as PageId) : undefined;
}

export function App() {
  const [activePage, setActivePage] = useState<PageId>(() => pageFromHash() ?? 'home');
  const [hasNavigated, setHasNavigated] = useState(false);
  const PageComponent = PAGE_COMPONENTS[activePage];

  useEffect(() => {
    function syncPageWithHash(): void {
      const page = pageFromHash();
      if (!page) return;

      setActivePage(page);
      setHasNavigated(true);
    }

    window.addEventListener('hashchange', syncPageWithHash);
    return () => window.removeEventListener('hashchange', syncPageWithHash);
  }, []);

  useEffect(() => {
    if (hasNavigated) {
      document.querySelector<HTMLElement>('#page-title')?.focus();
    }
  }, [activePage, hasNavigated]);

  return (
    <>
      <a class="skip-link" href="#main-content">
        Skip to content
      </a>

      <header class="site-header">
        <a class="brand" href="#home">
          TxtFSM
        </a>
        <nav aria-label="Primary navigation">
          {NAVIGATION.map((item) => (
            <a
              href={`#${item.id}`}
              aria-current={activePage === item.id ? 'page' : undefined}
              key={item.id}
            >
              {item.label}
            </a>
          ))}
          <a
            class="github-link"
            href="https://github.com/yuyosy/txtfsm"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub <img src={externalLinkIcon} alt="" aria-hidden="true" />
          </a>
        </nav>
      </header>

      <main id="main-content">
        <PageComponent />
      </main>

      <footer>
        <div class="footer-meta">
          <span>TxtFSM</span>
          <span aria-hidden="true">·</span>
          <a href="https://github.com/yuyosy/txtfsm/blob/main/LICENSE">Apache 2.0</a>
        </div>
        <div class="footer-meta">
          <a href="https://www.npmjs.com/package/txtfsm" target="_blank" rel="noopener noreferrer">
            npm
          </a>
          <span aria-hidden="true">·</span>
          <a href="https://jsr.io/@txtfsm/txtfsm" target="_blank" rel="noopener noreferrer">
            JSR
          </a>
          <span aria-hidden="true">·</span>
          <span>
            Made by <a href="https://github.com/yuyosy">yuyosy</a>
          </span>
        </div>
      </footer>
    </>
  );
}
