/*
 * SPDX-License-Identifier: Apache-2.0
 * Derived from TextFSM source code:
 * Copyright 2010, 2011, 2012, 2022 Google Inc. All Rights Reserved.
 *
 * Modified and translated to TypeScript for TxtFSM.
 */

import { TxtFSM } from './txtfsm.js';

export type TemplateLoader = (name: string) => string | undefined;
export type CliAttributes = Readonly<Record<string, string>>;

interface IndexRow {
  readonly [column: string]: string;
}

export class CliTableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CliTableError';
  }
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (char === ',' && !quoted) {
      cells.push(cell.trim());
      cell = '';
      continue;
    }
    cell += char;
  }

  cells.push(cell.trim());
  return cells;
}

function parseIndex(source: string): IndexRow[] {
  const lines = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
  const headerLine = lines.shift();
  if (!headerLine) {
    throw new CliTableError('Index does not contain a header');
  }

  const headers = parseCsvLine(headerLine);
  if (!headers.includes('Template')) {
    throw new CliTableError('Index does not contain a Template column');
  }

  return lines.map((line) => {
    const cells = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? '';
    });
    return row;
  });
}

function expandCompletion(source: string): string {
  return source.replace(/\[\[([^\]]+)]]/g, (_match, word: string) => {
    let nested = word.at(-1) ?? '';
    for (let index = word.length - 2; index >= 0; index -= 1) {
      nested = `${word[index]}(?:${nested})?`;
    }
    return `(?:${nested})?`;
  });
}

function rowMatches(row: IndexRow, attributes: CliAttributes): boolean {
  for (const [column, value] of Object.entries(attributes)) {
    const source = row[column];
    if (!source) {
      return false;
    }
    try {
      if (!new RegExp(`^(?:${expandCompletion(source)})`).test(value)) {
        return false;
      }
    } catch (error) {
      throw new CliTableError(
        `Invalid ${column} expression ${source}: ${(error as Error).message}`,
      );
    }
  }
  return true;
}

function keyForRow(row: Record<string, string>, keys: readonly string[], rowIndex: number): string {
  if (keys.length === 0) {
    return String(rowIndex);
  }
  return keys.map((key) => row[key] ?? '').join('\u0000');
}

export class CliTable {
  private readonly rows: readonly IndexRow[];
  private readonly templateLoader: TemplateLoader;

  constructor(indexSource: string, templateLoader: TemplateLoader) {
    this.rows = parseIndex(indexSource);
    this.templateLoader = templateLoader;
  }

  parseCmd(input: string, attributes: CliAttributes): Array<Record<string, string>> {
    const selected = this.rows.find((row) => rowMatches(row, attributes));
    if (!selected) {
      throw new CliTableError(`No template found for attributes: ${JSON.stringify(attributes)}`);
    }

    const templateNames = (selected['Template'] ?? '')
      .split(':')
      .map((name) => name.trim())
      .filter(Boolean);
    if (templateNames.length === 0) {
      throw new CliTableError('Matched index row does not name a template');
    }

    const machines = templateNames.map((name) => {
      const source = this.templateLoader(name);
      if (source === undefined) {
        throw new CliTableError(`Template not found: ${name}`);
      }
      return new TxtFSM(source);
    });

    const primary = machines[0];
    if (!primary) {
      return [];
    }

    const keys = primary.getValuesByAttribute('Key');
    const result = primary.parseTextToDicts(input);
    const resultByKey = new Map(result.map((row, index) => [keyForRow(row, keys, index), row]));

    for (const machine of machines.slice(1)) {
      const secondaryRows = machine.parseTextToDicts(input);
      const secondaryHeaders = machine.header.filter(
        (header) => !keys.includes(header) && !primary.header.includes(header),
      );
      for (const row of result) {
        for (const header of secondaryHeaders) {
          if (!Object.hasOwn(row, header)) {
            row[header] = '';
          }
        }
      }

      const mergedKeys = new Set<string>();
      secondaryRows.forEach((secondaryRow, index) => {
        const rowKey = keyForRow(secondaryRow, keys, index);
        if (mergedKeys.has(rowKey)) {
          return;
        }
        const target = resultByKey.get(rowKey);
        if (!target) {
          return;
        }
        for (const header of secondaryHeaders) {
          target[header] = secondaryRow[header] ?? '';
        }
        mergedKeys.add(rowKey);
      });
    }

    return result;
  }
}
