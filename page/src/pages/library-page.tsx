import { HighlightedCode } from '../components/highlighted-code';
import { API_MEMBERS, ERROR_TYPES, TXT_FSM_ERROR_HANDLING_CODE, type ApiEntry } from '../docs';

function ApiList({ entries }: { readonly entries: readonly ApiEntry[] }) {
  return (
    <div class="api-list">
      {entries.map((item) => (
        <article class="api-item" key={item.name}>
          <div>
            <h3>{item.name}</h3>
            <code>{item.signature}</code>
          </div>
          <p>{item.description}</p>
        </article>
      ))}
    </div>
  );
}

export function LibraryPage() {
  return (
    <section class="page library-page" aria-labelledby="page-title">
      <header class="page-intro">
        <p class="overline">API Reference</p>
        <h1 id="page-title" tabindex={-1}>
          Common entry points
        </h1>
        <p>
          The package exports the parser, one-off helpers, CliTable integration, and typed errors
          from its root module.
        </p>
      </header>

      <section class="api-section" aria-labelledby="members-title">
        <h2 class="api-section-title" id="members-title">Functions and classes</h2>
        <ApiList entries={API_MEMBERS} />
      </section>

      <section class="api-section" aria-labelledby="error-types-title">
        <h2 class="api-section-title" id="error-types-title">Error types</h2>
        <ApiList entries={ERROR_TYPES} />

        <div class="api-error-handling" aria-labelledby="error-handling-title">
          <div class="prose">
            <h3 id="error-handling-title">Error handling</h3>
            <p>
              Catch the exported error classes when an application needs to distinguish invalid
              templates from other failures. Each <code>TxtFSMError</code> includes a stable{' '}
              <code>code</code> value.
            </p>
          </div>
          <div class="code-example api-code-example">
            <div class="code-label">error-handling.ts</div>
            <HighlightedCode code={TXT_FSM_ERROR_HANDLING_CODE} language="javascript" />
          </div>
        </div>
      </section>
    </section>
  );
}
