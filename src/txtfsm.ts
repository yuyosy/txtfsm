/*
 * SPDX-License-Identifier: Apache-2.0
 * Derived from TextFSM source code:
 * Copyright 2010, 2011, 2012, 2022 Google Inc. All Rights Reserved.
 *
 * Modified and translated to TypeScript for TxtFSM.
 */

import { SkipRecord, TxtFSMError, TxtFSMTemplateError } from './errors.js';
import type {
  RuleDefinition,
  TemplateDefinition,
  ValueDefinition,
  ValueOption,
} from './template.js';
import { parseTemplate } from './template.js';

export interface ParseOptions {
  readonly eof?: boolean;
}

export type TextFSMValue = string | string[];
export type TextFSMRow = TextFSMValue[];
export type TextFSMRecord = Record<string, TextFSMValue>;

function hasValue(value: TextFSMValue): boolean {
  return Array.isArray(value) ? value.length > 0 : value.trim().length > 0;
}

export class TxtFSM {
  private readonly definition: TemplateDefinition;
  private readonly valueNames: readonly string[];
  private readonly valueIndexes: Map<string, number>;
  private readonly valueLookup: Map<string, ValueDefinition>;
  private recordBuffer: Record<string, string | string[] | undefined>;
  private filldownValues: Record<string, string>;
  private fillupValues: Record<string, string>;
  private pendingFillupAssignments: Map<string, string>;
  private fillupPendingRowIndexes: Map<string, Set<number>>;
  private explicitClears: Set<string>;
  readonly header: readonly string[];

  constructor(templateSource: string) {
    if (!templateSource.trim()) {
      throw new TxtFSMTemplateError('Template source is empty');
    }
    this.definition = parseTemplate(templateSource);
    this.valueNames = this.definition.values.map((value) => value.name);
    this.valueIndexes = new Map(this.valueNames.map((name, index) => [name, index]));
    this.valueLookup = new Map(this.definition.values.map((value) => [value.name, value]));
    this.recordBuffer = {};
    this.filldownValues = {};
    this.fillupValues = {};
    this.pendingFillupAssignments = new Map();
    this.fillupPendingRowIndexes = new Map();
    this.explicitClears = new Set();
    this.header = this.valueNames;
  }

  parseText(text: string, options: ParseOptions = {}): TextFSMRow[] {
    const { eof = true } = options;
    const rows: TextFSMRow[] = [];
    const lines = this.splitLines(text);
    let currentStateName = this.definition.startState.name;
    let terminate = false;

    this.initializeRuntime();

    for (const line of lines) {
      if (terminate) {
        break;
      }

      const state = this.definition.states.get(currentStateName);
      if (!state) {
        throw new TxtFSMTemplateError(`State ${currentStateName} is not defined in template`);
      }

      for (const rule of state.rules) {
        rule.compiled.lastIndex = 0;
        const match = rule.compiled.exec(line);
        if (!match) {
          continue;
        }

        const groups = match.groups ?? {};
        for (const valueName of this.valueNames) {
          if (!Object.hasOwn(groups, valueName)) {
            continue;
          }
          const captured = groups[valueName] as string | undefined;
          this.assignCapture(valueName, captured);
        }

        try {
          this.handleRecordOperation(rule.recordOp, rows);
        } catch (error) {
          if (error instanceof SkipRecord) {
            this.clearRecordBuffer({ keepFilldown: true });
          } else {
            throw error;
          }
        }

        this.applyFillupUpdates(rows);

        const advanceLine = this.handleLineOperation(rule, line);

        if (advanceLine) {
          const transition = this.resolveStateTransition(rule.newState);
          if (transition) {
            currentStateName = transition.state;
            if (transition.terminate) {
              terminate = true;
            }
          }
          break;
        }
      }
    }

    const hasExplicitEofState = this.definition.states.has('EOF');
    const allowImplicitEofRecord = eof && !hasExplicitEofState && currentStateName !== 'End';

    if (!allowImplicitEofRecord) {
      this.applyFillupUpdates(rows);
      return rows;
    }

    this.applyFillupUpdates(rows);

    if (this.hasPendingRecord()) {
      try {
        const row = this.buildRow();
        if (row.some(hasValue)) {
          rows.push(row);
          this.registerFillupPendingRows(rows, rows.length - 1);
        }
      } catch (error) {
        if (!(error instanceof SkipRecord)) {
          throw error;
        }
      } finally {
        this.clearRecordBuffer({ keepFilldown: true });
      }
    }

    return rows;
  }

  private splitLines(text: string): string[] {
    const result: string[] = [];
    let index = 0;
    while (index < text.length) {
      let lineEnd = index;
      while (lineEnd < text.length) {
        const char = text.charCodeAt(lineEnd);
        if (char === 10 /* \n */ || char === 13 /* \r */) {
          break;
        }
        lineEnd += 1;
      }

      result.push(text.slice(index, lineEnd));

      if (lineEnd >= text.length) {
        break;
      }

      const separator = text.charCodeAt(lineEnd);
      lineEnd += 1;
      if (
        separator === 13 /* \r */ &&
        lineEnd < text.length &&
        text.charCodeAt(lineEnd) === 10 /* \n */
      ) {
        lineEnd += 1;
      }
      index = lineEnd;
    }

    if (text.length === 0 || /[\n\r]$/.test(text)) {
      return result;
    }

    if (result.length === 0) {
      result.push(text);
    }

    return result;
  }

  parseTextToDicts(text: string, options: ParseOptions = {}): TextFSMRecord[] {
    const rows = this.parseText(text, options);
    return rows.map((row) => {
      const entry: TextFSMRecord = {};
      this.header.forEach((name, idx) => {
        entry[name] = row[idx] ?? '';
      });
      return entry;
    });
  }

  toString(): string {
    const lines: string[] = [];
    for (const value of this.definition.values) {
      const options = value.options.length > 0 ? `${value.options.join(' ')} ` : '';
      lines.push(`Value ${options}${value.name} ${value.pattern}`);
    }

    for (const state of this.definition.states.values()) {
      lines.push(state.name);
      for (const rule of state.rules) {
        lines.push(
          `  ${rule.rawPattern} -> ${rule.recordOp}${rule.newState ? ` ${rule.newState}` : ''}`.trimEnd(),
        );
      }
    }

    return lines.join('\n');
  }

  getValuesByAttribute(attribute: ValueOption): readonly string[] {
    return this.definition.values
      .filter((value) => value.options.includes(attribute))
      .map((value) => value.name);
  }

  private initializeRuntime(): void {
    this.recordBuffer = {};
    this.filldownValues = {};
    this.fillupValues = {};
    this.pendingFillupAssignments.clear();
    this.fillupPendingRowIndexes.clear();
    this.explicitClears.clear();
    for (const value of this.definition.values) {
      this.recordBuffer[value.name] = value.options.includes('List') ? [] : undefined;
      this.filldownValues[value.name] = '';
      this.fillupValues[value.name] = '';
    }
  }

  private assignCapture(valueName: string, captured: string | undefined): void {
    const definition = this.valueLookup.get(valueName);
    if (!definition) {
      return;
    }

    if (captured === undefined) {
      if (definition.options.includes('List')) {
        const placeholder = 'None';
        const current = this.recordBuffer[valueName];
        if (Array.isArray(current)) {
          current.push(placeholder);
        } else if (current === undefined) {
          this.recordBuffer[valueName] = [placeholder];
        } else {
          this.recordBuffer[valueName] = [current, placeholder];
        }
      } else {
        this.recordBuffer[valueName] = undefined;
      }

      if (definition.options.includes('Filldown')) {
        this.filldownValues[valueName] = '';
      }

      if (definition.options.includes('Fillup')) {
        this.fillupValues[valueName] = '';
        this.pendingFillupAssignments.delete(valueName);
      }

      return;
    }

    const isExplicitClear = captured === '';

    if (definition.options.includes('List')) {
      const current = this.recordBuffer[valueName];
      if (Array.isArray(current)) {
        current.push(captured);
      } else if (current === undefined) {
        this.recordBuffer[valueName] = [captured];
      } else {
        this.recordBuffer[valueName] = [current, captured];
      }
    } else {
      this.recordBuffer[valueName] = captured;
      if (!isExplicitClear) {
        this.explicitClears.delete(valueName);
      }
    }

    if (isExplicitClear && !definition.options.includes('List')) {
      this.applyExplicitClear(valueName, definition);
      return;
    }

    if (definition.options.includes('Filldown')) {
      this.filldownValues[valueName] = captured;
    }

    if (definition.options.includes('Fillup')) {
      this.fillupValues[valueName] = captured;
      this.pendingFillupAssignments.set(valueName, captured);
    }
  }

  private applyExplicitClear(valueName: string, definition: ValueDefinition): void {
    if (!definition.options.includes('List')) {
      this.recordBuffer[valueName] = '';
    }

    this.explicitClears.add(valueName);

    if (definition.options.includes('Filldown')) {
      this.filldownValues[valueName] = '';
    }

    if (definition.options.includes('Fillup')) {
      this.fillupValues[valueName] = '';
      this.pendingFillupAssignments.delete(valueName);
      this.fillupPendingRowIndexes.delete(valueName);
    }
  }

  private buildRow(): TextFSMRow {
    const result: TextFSMRow = new Array<TextFSMValue>(this.valueNames.length).fill('');
    const filldownUpdates: Record<string, string> = {};
    const fillupUpdates: Record<string, string> = {};

    this.definition.values.forEach((value, index) => {
      const raw = this.recordBuffer[value.name];
      const hasExplicitClear = this.explicitClears.has(value.name);
      let resolved: TextFSMValue;

      if (Array.isArray(raw)) {
        resolved = [...raw];
      } else if (typeof raw === 'string') {
        resolved = raw;
      } else {
        resolved = value.options.includes('List') ? [] : '';
      }

      if (
        !hasValue(resolved) &&
        !value.options.includes('List') &&
        value.options.includes('Filldown') &&
        !hasExplicitClear
      ) {
        resolved = this.filldownValues[value.name] ?? '';
      }

      if (!hasValue(resolved) && value.options.includes('Required')) {
        throw new SkipRecord(`Required value ${value.name} missing`);
      }

      result[index] = resolved;

      if (value.options.includes('Filldown')) {
        if (hasExplicitClear) {
          this.filldownValues[value.name] = '';
        } else if (typeof resolved === 'string' && resolved) {
          filldownUpdates[value.name] = resolved;
        }
      }

      if (value.options.includes('Fillup')) {
        if (hasExplicitClear) {
          this.fillupValues[value.name] = '';
        } else if (typeof resolved === 'string' && resolved) {
          fillupUpdates[value.name] = resolved;
        }
      }
    });

    for (const [valueName, resolved] of Object.entries(filldownUpdates)) {
      this.filldownValues[valueName] = resolved;
    }

    for (const [valueName, resolved] of Object.entries(fillupUpdates)) {
      this.fillupValues[valueName] = resolved;
    }

    return result;
  }

  private clearRecordBuffer({
    keepFilldown = true,
  }: {
    keepFilldown?: boolean;
  } = {}): void {
    for (const value of this.definition.values) {
      this.explicitClears.delete(value.name);

      if (value.options.includes('List')) {
        if (!(keepFilldown && value.options.includes('Filldown'))) {
          this.recordBuffer[value.name] = [];
        }
        continue;
      }

      if (keepFilldown && value.options.includes('Filldown')) {
        const fallback = this.filldownValues[value.name];
        if (fallback !== undefined) {
          this.recordBuffer[value.name] = fallback;
        } else {
          delete this.recordBuffer[value.name];
        }
        continue;
      }

      delete this.recordBuffer[value.name];
    }

    if (keepFilldown) {
      for (const value of this.definition.values) {
        if (!value.options.includes('Filldown')) {
          this.filldownValues[value.name] = '';
        }
        if (!value.options.includes('Fillup')) {
          this.fillupValues[value.name] = '';
        }
      }
      return;
    }

    for (const valueName of this.valueNames) {
      this.filldownValues[valueName] = '';
      this.fillupValues[valueName] = '';
      this.explicitClears.delete(valueName);
    }
  }

  private handleRecordOperation(operation: string, rows: TextFSMRow[]): void {
    const normalized = operation.toLowerCase();

    switch (normalized) {
      case 'record': {
        const row = this.buildRow();
        rows.push(row);
        const rowIndex = rows.length - 1;
        this.registerFillupPendingRows(rows, rowIndex);
        this.clearRecordBuffer({ keepFilldown: true });
        return;
      }
      case 'clear': {
        this.clearRecordBuffer({ keepFilldown: true });
        return;
      }
      case 'clearall': {
        this.clearRecordBuffer({ keepFilldown: false });
        return;
      }
      case 'norecord': {
        return;
      }
      default: {
        throw new TxtFSMTemplateError(`Unsupported record operation ${operation}`);
      }
    }
  }

  private handleLineOperation(rule: RuleDefinition, line: string): boolean {
    switch (rule.lineOp) {
      case 'Continue':
        return false;
      case 'Error': {
        const message = rule.errorMessage ?? 'State Error raised';
        throw new TxtFSMError(
          `Error: ${message}. Rule pattern: ${rule.rawPattern}. Input line: ${line}`,
        );
      }
      default:
        return true;
    }
  }

  private applyFillupUpdates(rows: TextFSMRow[]): void {
    if (this.pendingFillupAssignments.size === 0) {
      return;
    }

    for (const [valueName, replacement] of this.pendingFillupAssignments) {
      const columnIndex = this.valueIndexes.get(valueName);
      if (columnIndex === undefined) {
        continue;
      }

      if (replacement) {
        const targets = this.fillupPendingRowIndexes.get(valueName);
        if (targets?.size) {
          for (const rowIndex of targets) {
            const row = rows[rowIndex];
            if (!row) {
              continue;
            }
            row[columnIndex] = replacement;
          }
          targets.clear();
          this.fillupPendingRowIndexes.delete(valueName);
        }
      }

      const definition = this.valueLookup.get(valueName);
      if (definition?.options.includes('List')) {
        this.recordBuffer[valueName] = [];
      } else if (!this.recordBufferHasMeaningfulData(valueName)) {
        delete this.recordBuffer[valueName];
      }
    }

    this.pendingFillupAssignments.clear();
  }

  private recordBufferHasMeaningfulData(excludeValue?: string): boolean {
    for (const value of this.definition.values) {
      if (value.name === excludeValue) {
        continue;
      }

      const raw = this.recordBuffer[value.name];

      if (Array.isArray(raw)) {
        if (raw.length > 0) {
          return true;
        }
        continue;
      }

      if (raw !== undefined && raw !== '') {
        return true;
      }
    }

    return false;
  }

  private registerFillupPendingRows(rows: TextFSMRow[], rowIndex: number): void {
    const row = rows[rowIndex];
    if (!row) {
      return;
    }

    for (const value of this.definition.values) {
      if (!value.options.includes('Fillup')) {
        continue;
      }

      const columnIndex = this.valueIndexes.get(value.name);
      if (columnIndex === undefined) {
        continue;
      }

      if (hasValue(row[columnIndex] ?? '')) {
        const pending = this.fillupPendingRowIndexes.get(value.name);
        pending?.delete(rowIndex);
        continue;
      }

      let pending = this.fillupPendingRowIndexes.get(value.name);
      if (!pending) {
        pending = new Set();
        this.fillupPendingRowIndexes.set(value.name, pending);
      }

      pending.add(rowIndex);
    }
  }

  private hasPendingRecord(): boolean {
    let hasFillupValue = false;
    let hasNonFillupValue = false;

    for (const value of this.definition.values) {
      const raw = this.recordBuffer[value.name];
      if (Array.isArray(raw)) {
        if (raw.length > 0) {
          if (value.options.includes('Fillup')) {
            hasFillupValue = true;
          } else {
            hasNonFillupValue = true;
          }
        }
        continue;
      }
      if (raw !== undefined) {
        if (raw !== '') {
          if (value.options.includes('Fillup')) {
            hasFillupValue = true;
          } else {
            hasNonFillupValue = true;
          }
        }
      }
    }
    if (hasNonFillupValue) {
      return true;
    }

    if (hasFillupValue) {
      return false;
    }

    return false;
  }

  private resolveStateTransition(
    newState: string | undefined,
  ): { state: string; terminate: boolean } | undefined {
    if (!newState) {
      return undefined;
    }

    if (newState === 'End' || newState === 'EOF') {
      return { state: newState, terminate: true };
    }

    if (newState === 'Start') {
      return {
        state: this.definition.startState.name,
        terminate: false,
      };
    }

    if (!this.definition.states.has(newState)) {
      throw new TxtFSMTemplateError(`Rule transitions to unknown state ${newState}`);
    }

    return { state: newState, terminate: false };
  }
}

export function parseText(template: string, input: string): TextFSMRow[] {
  const machine = new TxtFSM(template);
  return machine.parseText(input);
}

export function parseTextToDicts(template: string, input: string): TextFSMRecord[] {
  const machine = new TxtFSM(template);
  return machine.parseTextToDicts(input);
}
