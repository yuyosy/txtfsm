/*
 * SPDX-License-Identifier: Apache-2.0
 * Derived from TextFSM source code:
 * Copyright 2010, 2011, 2012, 2022 Google Inc. All Rights Reserved.
 *
 * Modified and translated to TypeScript for TxtFSM.
 */

import { TxtFSMTemplateError } from './errors.js';

export type ValueOption = 'Required' | 'Filldown' | 'Fillup' | 'List' | 'Key';

export interface ValueDefinition {
  readonly name: string;
  readonly pattern: string;
  readonly options: ValueOption[];
}

export interface RuleDefinition {
  readonly rawPattern: string;
  readonly compiled: RegExp;
  readonly lineOp: string;
  readonly recordOp: string;
  readonly newState?: string;
  readonly errorMessage?: string;
}

export interface StateDefinition {
  readonly name: string;
  readonly rules: RuleDefinition[];
}

export interface TemplateDefinition {
  readonly values: ValueDefinition[];
  readonly states: Map<string, StateDefinition>;
  readonly startState: StateDefinition;
}

const VALUE_LINE =
  /^Value\s+(?<options>(?:[A-Za-z]+(?:,[A-Za-z]+)*\s+)*)?(?<name>[A-Za-z_][\w]*)\s+(?<pattern>.+)$/;
const STATE_LINE = /^(?<name>\w+)$/;
const RULE_LINE = /^\s*(?<pattern>\^.*?)(?:\s+->\s*(?<ops>.+))?$/;

const VALUE_OPTIONS = new Set<ValueOption>(['Required', 'Filldown', 'Fillup', 'List', 'Key']);

const LINE_RECORD_ACTION =
  /^(?<lineOp>Continue|Next|Error)(?:\.(?<recordOp>Clear|Clearall|Record|NoRecord))?(?:\s+(?<newState>(?:"[^"]*"|'[^']*'|\w+)))?\s*$/;
const RECORD_ONLY_ACTION =
  /^(?<recordOp>Clear|Clearall|Record|NoRecord)(?:\s+(?<newState>(?:"[^"]*"|'[^']*'|\w+)))?\s*$/;
const NEW_STATE_ONLY_ACTION = /^(?<newState>(?:"[^"]*"|'[^']*'|\w+))\s*$/;

function requireGroup(
  groups: NonNullable<RegExpMatchArray['groups']>,
  name: string,
  context: string,
): string {
  const value = groups[name];
  if (value === undefined) {
    throw new TxtFSMTemplateError(`Missing ${name} capture in ${context}`);
  }
  return value;
}

function stripInlineComment(line: string): string {
  let inCharClass = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '[') {
      inCharClass = true;
      continue;
    }
    if (char === ']') {
      inCharClass = false;
      continue;
    }
    if (char === '#' && !inCharClass) {
      const prev = index > 0 ? line[index - 1] : '';
      const next = index + 1 < line.length ? line[index + 1] : '';
      const prevIsWhitespace = prev?.trim().length === 0;
      const nextIsWhitespaceOrEnd = next?.trim().length === 0;
      if (prevIsWhitespace && nextIsWhitespaceOrEnd) {
        return line.slice(0, index).trimEnd();
      }
    }
  }

  return line.trimEnd();
}

function parseValueLine(line: string): ValueDefinition {
  const sanitized = stripInlineComment(line);
  const match = sanitized.match(VALUE_LINE);
  if (!match?.groups) {
    throw new TxtFSMTemplateError(`Invalid Value declaration: ${line}`);
  }

  const groups = match.groups;
  const optionsSegment = groups['options']?.trim() ?? '';
  const optionTokens = optionsSegment
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter(Boolean);
  for (const token of optionTokens) {
    if (!VALUE_OPTIONS.has(token as ValueOption)) {
      throw new TxtFSMTemplateError(
        `Unsupported Value option ${token} in declaration ${sanitized}`,
      );
    }
  }
  const options = optionTokens as ValueOption[];
  const name = requireGroup(groups, 'name', `Value declaration ${sanitized}`);
  const pattern = requireGroup(groups, 'pattern', `Value declaration ${sanitized}`).trim();

  return { name, pattern, options };
}

function substituteValues(rawPattern: string, values: Map<string, ValueDefinition>): string {
  return rawPattern.replace(/\$\{(?<name>[A-Za-z_][\w]*)}/g, (_m, valueName: string) => {
    const value = values.get(valueName);
    if (!value) {
      throw new TxtFSMTemplateError(
        `Unknown Value reference ${valueName} in pattern ${rawPattern}`,
      );
    }
    return `(?<${value.name}>${value.pattern})`;
  });
}

function normalizeRepeatedOptionalValueCaptures(pattern: string): string {
  return pattern.replace(/(\(\$\{[A-Za-z_]\w*}\?\\s\))\+/g, '$1+?');
}

function normalizePythonQuantifiers(pattern: string): string {
  return pattern.replace(/\{,(\d+)}/g, '{0,$1}');
}

function normalizeLookaroundQuantifiers(pattern: string): string {
  return pattern.replace(/(\(\?<(?:=|!)[\s\S]+?\))([+*]+)/g, '$1');
}

function compilePattern(pattern: string, rawPattern: string): RegExp {
  const normalized = normalizePythonQuantifiers(pattern);
  try {
    return new RegExp(normalized);
  } catch (error) {
    const lookaroundNormalized = normalizeLookaroundQuantifiers(normalized);
    if (lookaroundNormalized !== normalized) {
      try {
        return new RegExp(lookaroundNormalized);
      } catch (normalizedError) {
        throw new TxtFSMTemplateError(
          `Failed to compile pattern ${rawPattern}: ${(normalizedError as Error).message}`,
        );
      }
    }
    throw new TxtFSMTemplateError(
      `Failed to compile pattern ${rawPattern}: ${(error as Error).message}`,
    );
  }
}

function parseRuleLine(line: string, values: Map<string, ValueDefinition>): RuleDefinition {
  const sanitized = stripInlineComment(line);
  const match = sanitized.match(RULE_LINE);
  if (!match?.groups) {
    throw new TxtFSMTemplateError(`Invalid rule syntax: ${line}`);
  }

  const groups = match.groups;
  const rawPattern = requireGroup(groups, 'pattern', `rule ${sanitized}`).trim();
  const ops = groups['ops']?.trim() ?? '';
  const parsedOps = parseOperations(ops, rawPattern);
  const lineOp = parsedOps.lineOp ?? 'Next';
  const recordOp = parsedOps.recordOp ?? 'NoRecord';
  const newState = parsedOps.newState;
  const errorMessage = parsedOps.errorMessage;

  const normalizedRawPattern = normalizeRepeatedOptionalValueCaptures(rawPattern);
  const substituted = substituteValues(normalizedRawPattern, values);
  const compiled = compilePattern(substituted, rawPattern);

  return {
    rawPattern,
    compiled,
    lineOp,
    recordOp,
    ...(newState === undefined ? {} : { newState }),
    ...(errorMessage === undefined ? {} : { errorMessage }),
  };
}

function parseOperations(
  rawOps: string,
  rawPattern: string,
): {
  readonly lineOp?: string;
  readonly recordOp?: string;
  readonly newState?: string;
  readonly errorMessage?: string;
} {
  const trimmed = rawOps.trim();
  if (!trimmed) {
    return {};
  }

  const lineRecordMatch = trimmed.match(LINE_RECORD_ACTION);
  if (lineRecordMatch?.groups) {
    return finalizeOperations(
      lineRecordMatch.groups['lineOp'],
      lineRecordMatch.groups['recordOp'],
      lineRecordMatch.groups['newState'],
      rawPattern,
    );
  }

  const recordOnlyMatch = trimmed.match(RECORD_ONLY_ACTION);
  if (recordOnlyMatch?.groups) {
    return finalizeOperations(
      undefined,
      recordOnlyMatch.groups['recordOp'],
      recordOnlyMatch.groups['newState'],
      rawPattern,
    );
  }

  const newStateOnlyMatch = trimmed.match(NEW_STATE_ONLY_ACTION);
  if (newStateOnlyMatch?.groups) {
    return finalizeOperations(
      undefined,
      undefined,
      newStateOnlyMatch.groups['newState'],
      rawPattern,
    );
  }

  throw new TxtFSMTemplateError(`Badly formatted rule '${trimmed}' for pattern ${rawPattern}`);
}

function finalizeOperations(
  lineOp: string | undefined,
  recordOp: string | undefined,
  rawNewState: string | undefined,
  rawPattern: string,
): {
  readonly lineOp?: string;
  readonly recordOp?: string;
  readonly newState?: string;
  readonly errorMessage?: string;
} {
  let newState: string | undefined;
  let errorMessage: string | undefined;

  if (rawNewState !== undefined) {
    const trimmed = rawNewState.trim();
    if (lineOp === 'Error') {
      errorMessage = stripQuotes(trimmed);
    } else {
      if (isQuoted(trimmed)) {
        throw new TxtFSMTemplateError(
          `Alphanumeric characters only in state names for pattern ${rawPattern}`,
        );
      }
      if (!isStateName(trimmed)) {
        throw new TxtFSMTemplateError(`Invalid state name ${trimmed} in pattern ${rawPattern}`);
      }
      newState = trimmed;
    }
  }

  if (lineOp === 'Continue' && newState) {
    throw new TxtFSMTemplateError(
      `Action 'Continue' cannot specify new state ${newState} in pattern ${rawPattern}`,
    );
  }

  return {
    ...(lineOp === undefined ? {} : { lineOp }),
    ...(recordOp === undefined ? {} : { recordOp }),
    ...(newState === undefined ? {} : { newState }),
    ...(errorMessage === undefined ? {} : { errorMessage }),
  };
}

function isQuoted(value: string): boolean {
  if (value.length < 2) {
    return false;
  }
  const first = value[0];
  const last = value[value.length - 1];
  return (first === '"' && last === '"') || (first === "'" && last === "'");
}

function stripQuotes(value: string): string {
  if (isQuoted(value)) {
    return value.slice(1, -1);
  }
  return value;
}

function isStateName(value: string): boolean {
  return /^\w+$/.test(value);
}

export function parseTemplate(source: string): TemplateDefinition {
  const lines = source.split(/\r?\n/);
  const values: ValueDefinition[] = [];
  const valueMap: Map<string, ValueDefinition> = new Map();
  const states: Map<string, StateDefinition> = new Map();

  let index = 0;

  const advance = () => {
    index += 1;
  };

  const currentLine = () => lines[index];

  while (index < lines.length) {
    const raw = currentLine();
    if (raw === undefined) break;
    const trimmed = raw.trim();
    if (trimmed.length === 0 || trimmed.startsWith('#')) {
      advance();
      continue;
    }
    if (trimmed.startsWith('Value')) {
      const value = parseValueLine(trimmed);
      values.push(value);
      valueMap.set(value.name, value);
      advance();
      continue;
    }
    break;
  }

  let startState: StateDefinition | undefined;

  while (index < lines.length) {
    let raw = currentLine();
    if (raw === undefined) break;
    raw = raw.trimEnd();
    if (raw.trim().length === 0 || raw.trim().startsWith('#')) {
      advance();
      continue;
    }

    const stateLine = raw.trim();
    const match = stateLine.match(STATE_LINE);
    if (!match?.groups) {
      throw new TxtFSMTemplateError(`Expected state declaration but got: ${raw}`);
    }

    const stateName = requireGroup(match.groups, 'name', `state declaration ${stateLine}`);
    advance();

    const rules: RuleDefinition[] = [];
    while (index < lines.length) {
      const peek = currentLine();
      if (peek === undefined) break;
      const trimmedPeek = peek.trim();
      if (trimmedPeek.length === 0 || trimmedPeek.startsWith('#')) {
        advance();
        continue;
      }
      if (!/^[\t ]/.test(peek)) {
        break;
      }
      const rule = parseRuleLine(peek, valueMap);
      rules.push(rule);
      advance();
    }

    const state: StateDefinition = { name: stateName, rules };
    states.set(stateName, state);
    if (!startState && stateName === 'Start') {
      startState = state;
    }
  }

  if (!startState) {
    throw new TxtFSMTemplateError('Template is missing Start state.');
  }

  return { values, states, startState };
}
