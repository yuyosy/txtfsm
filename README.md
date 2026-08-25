# TxtFSM

An independent TypeScript implementation of [TextFSM](https://github.com/google/textfsm).
TxtFSM turns semi-structured text, such as network device command output, into rows or
JavaScript objects using TextFSM templates.

[Documentation & Playground](https://yuyosy.github.io/txtfsm/)

> [!NOTE]
> This project is under development and is not affiliated with Google or the original
> TextFSM project. It is based on the Apache 2.0-licensed original project and is released
> under the same license.


## Features

- Parse TextFSM templates and input entirely in JavaScript or TypeScript
- Return records as arrays or objects keyed by the template header
- Support multiple states and the `Required`, `Filldown`, `Fillup`, `List`, and `Key` value options
- Support TextFSM rule actions including `Record`, `NoRecord`, `Clear`, `Clearall`, `Next`,
  `Continue`, and `Error`
- Select templates from a TextFSM CLI table index and merge multi-template results by key
- Ship ESM, CommonJS, and TypeScript declarations


## Requirements

- Node.js 22.12 or later


## Installation

From [npm](https://www.npmjs.com/package/txtfsm):

```bash
npm install txtfsm
```

From [JSR](https://jsr.io/@txtfsm/txtfsm):

```bash
npx jsr add @txtfsm/txtfsm
```


## Quick start

See the [documentation & playground](https://yuyosy.github.io/txtfsm/) for a live demo.


## API

### `TxtFSM`

Create a reusable parser from a template:

```ts
const fsm = new TxtFSM(template);

const rows = fsm.parseText(input);
// TextFSMRow[]; each field is a string or, for Value List, string[]

const records = fsm.parseTextToDicts(input);
// TextFSMRecord[]; Value List properties remain string[]
```

For example, `Value List VLAN` produces `{ VLAN: ['10', '11'] }` rather than a
comma-delimited string.

Both parsing methods accept `{ eof: false }` as a second argument to disable the implicit EOF
record operation.

For one-off parsing, equivalent helper functions are available:

```ts
import { parseText, parseTextToDicts } from 'txtfsm';

const rows = parseText(template, input);
const records = parseTextToDicts(template, input);
```

### `parseTemplate`

`parseTemplate(source)` validates and compiles a template, returning its value and state
definitions. Invalid templates throw `TxtFSMTemplateError`; runtime parsing failures throw
`TxtFSMError`.

### `CliTable`

`CliTable` selects a template using an index compatible with TextFSM CLI tables. Provide the
index text and a loader that returns template text by file name:

```ts
import { CliTable } from 'txtfsm';

const index = `Template, Platform, Command
show_items.textfsm, demo_os, sh[[ow]] it[[ems]]`;

const templates = new Map([
  [
    'show_items.textfsm',
    ['Value ID (\\d+)', 'Value STATE (\\w+)', '', 'Start', '  ^Item ${ID} ${STATE} -> Record'].join(
      '\n',
    ),
  ],
]);

const table = new CliTable(index, (name) => templates.get(name));
const records = table.parseCmd('Item 1 up', {
  Platform: 'demo_os',
  Command: 'show items',
});

// [{ ID: '1', STATE: 'up' }]
```

Abbreviated command patterns such as `sh[[ow]]` are supported. An index entry may also list
multiple templates separated by `:`; their records are merged using values marked with the
`Key` option. A missing matching row or template throws `CliTableError`.


## Compatibility

TxtFSM aims to provide behavior compatible with Google TextFSM 2.1.0 for the supported syntax.
Compatibility is checked against templates from
[ntc-templates](https://github.com/networktocode/ntc-templates). Because JavaScript and Python
regular expression engines differ, templates that depend on Python-specific regex behavior may
not be fully compatible. Please report reproducible differences through
[GitHub Issues](https://github.com/yuyosy/txtfsm/issues).


## Development

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full contribution workflow.


## License

Copyright 2026 yuyosy

The core library includes a TypeScript adaptation of portions of Google TextFSM:

- https://github.com/google/textfsm

Applicable portions:

Copyright 2010, 2011, 2012, 2022 Google Inc. All Rights Reserved.
Google TextFSM and this adaptation are licensed under the Apache License, Version 2.0.

For detailed attribution and a record of modifications, see the [NOTICE](./NOTICE) file.
