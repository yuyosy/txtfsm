import { useState } from 'preact/hooks';
import { HighlightedCode } from '../components/highlighted-code';
import { parseTxtFSM } from '../parse-txtfsm';
import {
  CLI_TABLE_EXAMPLE_CODE,
  FILE_READ_EXAMPLE_CODE,
  GETTING_STARTED_CODE,
  TEXTAREA_EXAMPLE_CODE,
  TEXTAREA_EXAMPLE_HTML,
} from '../docs';
import type { HighlightLanguage } from '../highlight';
import { PRESETS } from '../presets';

interface ExampleDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly code: string;
  readonly template?: string;
  readonly input?: string;
  readonly html?: string;
  readonly result?: string;
}

const STATUS_TEMPLATE = `Value NAME (\\S+)
Value STATUS (up|down)

Start
  ^\${NAME}\\s+\${STATUS} -> Record`;
const STATUS_INPUT = `Gi0/1 up
Gi0/2 down`;
const CLI_TABLE_RESULT = JSON.stringify([{ ID: '1', STATE: 'up' }], undefined, 2);

const EXAMPLES: readonly ExampleDefinition[] = [
  {
    id: 'textarea',
    name: 'Textarea',
    description: 'Read raw TextFSM and command output directly from browser textarea values.',
    template: STATUS_TEMPLATE,
    input: STATUS_INPUT,
    code: TEXTAREA_EXAMPLE_CODE,
    html: TEXTAREA_EXAMPLE_HTML,
  },
  {
    ...PRESETS[1],
    id: 'file-read',
    name: 'File read',
    description: 'Load a .textfsm template and captured command output as UTF-8 text in Node.js.',
    code: FILE_READ_EXAMPLE_CODE,
  },
  {
    id: 'escaped-string',
    name: 'Escaped string',
    description: 'Embed a small template in JavaScript with escaped placeholders and backslashes.',
    template: STATUS_TEMPLATE,
    input: STATUS_INPUT,
    code: GETTING_STARTED_CODE,
  },
  {
    id: 'cli-table',
    name: 'CliTable',
    description:
      'Select a template from an index using platform and command attributes, then parse the command output.',
    code: CLI_TABLE_EXAMPLE_CODE,
    result: CLI_TABLE_RESULT,
  },
] as const;
const initialExample = EXAMPLES[0];
type ExamplePanel = 'code' | 'html' | 'template' | 'data' | 'result';

const PANELS: readonly { id: ExamplePanel; label: string }[] = [
  { id: 'code', label: 'JavaScript' },
  { id: 'html', label: 'HTML' },
  { id: 'template', label: 'Template' },
  { id: 'data', label: 'Data' },
  { id: 'result', label: 'Result' },
];

export function ExamplesPage() {
  const [exampleId, setExampleId] = useState<string>(initialExample.id);
  const [activePanel, setActivePanel] = useState<ExamplePanel>('code');
  const examplePreset = EXAMPLES.find(({ id }) => id === exampleId) ?? initialExample;
  const exampleResult =
    examplePreset.template !== undefined && examplePreset.input !== undefined
      ? parseTxtFSM(examplePreset.template, examplePreset.input)
      : undefined;
  const visiblePanels =
    examplePreset.id === 'cli-table'
      ? PANELS.filter(({ id }) => id === 'code' || id === 'result')
      : examplePreset.html
        ? PANELS
        : PANELS.filter(({ id }) => id !== 'html');
  const panelContent: Record<ExamplePanel, string> = {
    code: examplePreset.code,
    html: examplePreset.html ?? '',
    template: examplePreset.template ?? '',
    data: examplePreset.input ?? '',
    result:
      examplePreset.result ??
      JSON.stringify(
        exampleResult?.ok ? exampleResult.records : { error: exampleResult?.message },
        undefined,
        2,
      ),
  };
  const panelLanguage: Partial<Record<ExamplePanel, HighlightLanguage>> = {
    code: 'javascript',
    html: 'html',
    template: 'txtfsm',
    result: 'json',
  };

  return (
    <section class="page examples-page" aria-labelledby="page-title">
      <header class="page-intro">
        <p class="overline">Examples</p>
        <h1 id="page-title" tabindex={-1}>
          See the complete parse flow
        </h1>
        <p>
          Compare browser textarea values, Node.js file loading, escaped JavaScript strings, and
          index-based selection with CliTable. Select an example to inspect its code and result. The{' '}
          <code>.textfsm</code> extension used by File read follows the convention used by{' '}
          <a href="https://github.com/networktocode/ntc-templates">NTC Templates</a> and is not
          required by the parser.
        </p>
      </header>

      <div class="example-tabs" role="tablist" aria-label="Documentation examples">
        {EXAMPLES.map((preset) => (
          <button
            type="button"
            role="tab"
            aria-selected={preset.id === exampleId}
            onClick={() => {
              setExampleId(preset.id);
              setActivePanel('code');
            }}
            key={preset.id}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div class="example-summary">
        <div>
          <h2>{examplePreset.name}</h2>
          <p>{examplePreset.description}</p>
        </div>
      </div>

      <div class="example-detail">
        <div class="detail-tabs" role="tablist" aria-label="Example content">
          {visiblePanels.map((panel) => (
            <button
              type="button"
              role="tab"
              aria-selected={activePanel === panel.id}
              onClick={() => setActivePanel(panel.id)}
              key={panel.id}
            >
              {panel.label}
            </button>
          ))}
        </div>
        <div class={`code-example${activePanel === 'result' ? ' output-example' : ''}`}>
          <HighlightedCode code={panelContent[activePanel]} language={panelLanguage[activePanel]} />
        </div>
      </div>
    </section>
  );
}
