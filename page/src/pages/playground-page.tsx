import { useState } from 'preact/hooks';
import { HighlightedCode } from '../components/highlighted-code';
import { HighlightedTextarea } from '../components/highlighted-textarea';
import { ResultTable } from '../components/result-table';
import { parseTxtFSM } from '../parse-txtfsm';
import { PRESETS, type Preset } from '../presets';

const initialPreset = PRESETS[0];

export function PlaygroundPage() {
  const [selectedId, setSelectedId] = useState<string>(initialPreset.id);
  const [template, setTemplate] = useState<string>(initialPreset.template);
  const [input, setInput] = useState<string>(initialPreset.input);
  const [result, setResult] = useState(() =>
    parseTxtFSM(initialPreset.template, initialPreset.input),
  );
  const selectedPreset = PRESETS.find(({ id }) => id === selectedId) ?? initialPreset;
  const isEdited = template !== selectedPreset.template || input !== selectedPreset.input;
  const resultJson = JSON.stringify(
    result.ok ? result.records : { error: result.message },
    undefined,
    2,
  );

  function loadPreset(preset: Preset): void {
    setSelectedId(preset.id);
    setTemplate(preset.template);
    setInput(preset.input);
    setResult(parseTxtFSM(preset.template, preset.input));
  }

  function execute(): void {
    setResult(parseTxtFSM(template, input));
  }

  return (
    <section class="page playground-page" aria-labelledby="page-title">
      <header class="page-intro">
        <p class="overline">Playground</p>
        <h1 id="page-title" tabindex={-1}>
          Parse command output
        </h1>
        <p>
          Select a preset or edit the TextFSM template and input directly. Everything runs locally
          in your browser.
        </p>
      </header>

      <div class="section-heading">
        <div>
          <h2>Run parser</h2>
          <p>Preset selection replaces both editors and parses immediately.</p>
        </div>
      </div>

      <div class="preset-tabs" role="tablist" aria-label="Example presets">
        {PRESETS.map((preset) => (
          <button
            type="button"
            role="tab"
            class="preset-tab"
            aria-selected={preset.id === selectedId}
            onClick={() => loadPreset(preset)}
            key={preset.id}
          >
            <strong>{preset.name}</strong>
            <span>{preset.command}</span>
          </button>
        ))}
      </div>
      <p class="preset-description">{selectedPreset.description}</p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          execute();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            execute();
          }
        }}
      >
        <div class="editor-grid">
          <section class="panel editor-panel">
            <div class="panel-heading">
              <label for="template">Template</label>
              <span>template.textfsm</span>
            </div>
            <HighlightedTextarea
              id="template"
              value={template}
              language="txtfsm"
              onInput={setTemplate}
            />
          </section>
          <section class="panel editor-panel">
            <div class="panel-heading">
              <label for="input">Input</label>
              <span>{selectedPreset.command}</span>
            </div>
            <textarea
              id="input"
              value={input}
              onInput={(event) => setInput(event.currentTarget.value)}
              spellcheck={false}
            />
          </section>
        </div>
        <div class="action-bar">
          <p>
            <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Enter</kbd>
          </p>
          <div class="actions">
            <p
              class={result.ok ? 'status success' : 'status error'}
              role="status"
              aria-live="polite"
            >
              {result.ok
                ? `${result.rows.length} ${result.rows.length === 1 ? 'record' : 'records'}`
                : 'Parser stopped'}
            </p>
            <button
              class="button secondary"
              type="button"
              onClick={() => loadPreset(selectedPreset)}
              disabled={!isEdited}
            >
              Reset
            </button>
            <button class="button primary" type="submit">
              Run parser
            </button>
          </div>
        </div>
      </form>

      <section class="results" aria-labelledby="results-title">
        <h2 id="results-title">Result</h2>
        <div class="result-grid">
          <div>
            <p class="result-label">Table</p>
            <div class="table-wrap">
              <ResultTable result={result} />
            </div>
          </div>
          <div>
            <p class="result-label">JSON</p>
            <div class="playground-json" tabindex={0}>
              <HighlightedCode code={resultJson} language="json" />
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
