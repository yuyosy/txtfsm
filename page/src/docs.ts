export const TEXTAREA_EXAMPLE_CODE = `import { TxtFSM } from 'txtfsm'

const template = document.querySelector('#template').value
const data = document.querySelector('#input').value

const parser = new TxtFSM(template)
const records = parser.parseTextToDicts(data)

console.table(records)`;

export const TEXTAREA_EXAMPLE_HTML = `<!-- Values are shown in the Template and Data tabs. -->
<label for="template">TextFSM template</label>
<textarea id="template"></textarea>

<label for="input">Command output</label>
<textarea id="input"></textarea>`;

export const FILE_READ_EXAMPLE_CODE = `import { readFile } from 'node:fs/promises'
import { TxtFSM } from 'txtfsm'

const template = await readFile(new URL('./template.textfsm', import.meta.url), 'utf8')
const data = await readFile(new URL('./output.txt', import.meta.url), 'utf8')

const parser = new TxtFSM(template)
const records = parser.parseTextToDicts(data)

console.table(records)`;

export const TEMPLATE_ERROR_HANDLING_CODE = `import { TxtFSM, TxtFSMTemplateError } from 'txtfsm'

// Template and data can come from a file or network request in Node.js,
// or from an HTML textarea's value in the browser.

try {
  const parser = new TxtFSM(template)
  const records = parser.parseTextToDicts(data)
  console.table(records)
} catch (error) {
  if (error instanceof TxtFSMTemplateError) {
    console.error(error.code, error.message)
  }
}`;

export const TXT_FSM_ERROR_HANDLING_CODE = `import { TxtFSM, TxtFSMError } from 'txtfsm'

// The template and data values could come from a file, a network request, Node.js,
// or read an HTML textarea's value in the browser.

try {
  const parser = new TxtFSM(template)
  const records = parser.parseTextToDicts(data)
  console.table(records)
} catch (error) {
  if (error instanceof TxtFSMError) {
    console.error(error.code, error.message)
  }
}`;

export const GETTING_STARTED_CODE = [
  "import { parseTextToDicts } from 'txtfsm'",
  '',
  'const template = `Value NAME (\\\\S+)',
  'Value STATUS (up|down)',
  '',
  'Start',
  '  ^\\${NAME}\\\\s+\\${STATUS} -> Record`',
  '',
  'const input = `Gi0/1 up',
  'Gi0/2 down`',
  '',
  'const records = parseTextToDicts(template, input)',
  'console.log(records)',
].join('\n');

export interface ApiEntry {
  readonly name: string;
  readonly signature: string;
  readonly description: string;
}

export const API_MEMBERS: readonly ApiEntry[] = [
  {
    name: 'TxtFSM',
    signature: 'new TxtFSM(template)',
    description:
      'Creates a reusable parser. Use parseText for rows, parseTextToDicts for objects, and header to inspect the output columns.',
  },
  {
    name: 'parseText',
    signature: 'parseText(template, input)',
    description:
      'Parses once and returns string[][] data. Column order follows the Value declarations in the template.',
  },
  {
    name: 'parseTextToDicts',
    signature: 'parseTextToDicts(template, input)',
    description:
      'Parses once and returns an array of objects keyed by the template Value names. This is the shortest path for most applications.',
  },
  {
    name: 'CliTable',
    signature: 'new CliTable(index, loadTemplate)',
    description:
      'Selects one or more templates from a TextFSM index and parses command output using platform and command attributes.',
  },
];

export const ERROR_TYPES: readonly ApiEntry[] = [
  {
    name: 'TxtFSMError',
    signature: 'error instanceof TxtFSMError',
    description:
      'Base parser error with a machine-readable code. TxtFSMTemplateError and UsageError extend this class.',
  },
  {
    name: 'TxtFSMTemplateError',
    signature: "error.code === 'TEMPLATE'",
    description: 'Thrown when a template declaration, rule, state, or transition is invalid.',
  },
  {
    name: 'UsageError',
    signature: "error.code === 'USAGE'",
    description: 'Represents invalid API usage and carries the stable USAGE error code.',
  },
  {
    name: 'CliTableError',
    signature: 'error instanceof CliTableError',
    description: 'Thrown when an index is invalid or no matching template can be loaded.',
  },
];
