import {
  API_CLASSES,
  API_FUNCTIONS,
  API_TYPES,
  ERROR_TYPES,
  type ApiEntry,
} from '../docs';

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

      <section class="api-section" aria-labelledby="classes-title">
        <h2 class="api-section-title" id="classes-title">Classes</h2>
        <ApiList entries={API_CLASSES} />
      </section>

      <section class="api-section" aria-labelledby="functions-title">
        <h2 class="api-section-title" id="functions-title">Functions</h2>
        <ApiList entries={API_FUNCTIONS} />
      </section>

      <section class="api-section" aria-labelledby="types-title">
        <h2 class="api-section-title" id="types-title">Types</h2>
        <ApiList entries={API_TYPES} />
      </section>

      <section class="api-section" aria-labelledby="error-types-title">
        <h2 class="api-section-title" id="error-types-title">Error types</h2>
        <ApiList entries={ERROR_TYPES} />
      </section>
    </section>
  );
}
