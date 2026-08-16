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

export const API_CLASSES: readonly ApiEntry[] = [
  {
    name: 'TxtFSM',
    signature: 'new TxtFSM(template: string): TxtFSM',
    description:
      'Validates and compiles a template into a reusable parser. The readonly header property lists output columns in template declaration order.',
  },
  {
    name: 'TxtFSM.parseText',
    signature: 'parser.parseText(input: string, options?: ParseOptions): string[][]',
    description:
      'Returns rows in the same column order as parser.header. Pass { eof: false } to disable the implicit EOF record operation.',
  },
  {
    name: 'TxtFSM.parseTextToDicts',
    signature:
      'parser.parseTextToDicts(input: string, options?: ParseOptions): Array<Record<string, string>>',
    description:
      'Returns records keyed by the template Value names. Pass { eof: false } to disable the implicit EOF record operation.',
  },
  {
    name: 'CliTable',
    signature: 'new CliTable(index: string, loadTemplate: TemplateLoader): CliTable',
    description:
      'Creates a selector from a TextFSM CLI table index and a loader that returns template text by file name.',
  },
  {
    name: 'CliTable.parseCmd',
    signature:
      'table.parseCmd(input: string, attributes: CliAttributes): Array<Record<string, string>>',
    description:
      'Selects templates using attributes such as Platform and Command. It supports abbreviated patterns such as sh[[ow]] and merges colon-separated templates using Value fields marked Key.',
  },
];

export const API_FUNCTIONS: readonly ApiEntry[] = [
  {
    name: 'parseText',
    signature: 'parseText(template: string, input: string): string[][]',
    description:
      'Creates a parser for one-off use and returns rows. Column order follows the Value declarations in the template.',
  },
  {
    name: 'parseTextToDicts',
    signature:
      'parseTextToDicts(template: string, input: string): Array<Record<string, string>>',
    description:
      'Creates a parser for one-off use and returns records keyed by the template Value names. This is the shortest path for most applications.',
  },
  {
    name: 'parseTemplate',
    signature: 'parseTemplate(source: string): TemplateDefinition',
    description:
      'Validates and compiles a template, returning its Value definitions, state map, and Start state. Invalid templates throw TxtFSMTemplateError.',
  },
];

export const API_TYPES: readonly ApiEntry[] = [
  {
    name: 'ParseOptions',
    signature: 'interface ParseOptions { readonly eof?: boolean }',
    description:
      'Controls parser behavior. eof defaults to true; set it to false to skip the implicit EOF record operation.',
  },
  {
    name: 'TemplateDefinition',
    signature: '{ values: ValueDefinition[]; states: Map<string, StateDefinition>; startState: StateDefinition }',
    description:
      'The validated template structure returned by parseTemplate, including compiled rules in each state.',
  },
  {
    name: 'TemplateLoader',
    signature: '(name: string) => string | undefined',
    description:
      'Loads template text for a file name selected from a CliTable index. Return undefined when a template cannot be found.',
  },
  {
    name: 'CliAttributes',
    signature: 'Readonly<Record<string, string>>',
    description:
      'Values matched against columns in a CliTable index, commonly Platform and Command.',
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
