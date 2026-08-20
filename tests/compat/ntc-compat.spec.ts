import { existsSync, promises as fs, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';
import { CliTable } from '../../src/index';
import type { TextFSMRecord, TextFSMValue } from '../../src/index';

interface CompatibilityCase {
  readonly id: string;
  readonly platform: string;
  readonly command: string;
  readonly rawPath: string;
  readonly expectedPath: string;
}

interface FixtureDiscoveryOptions {
  readonly limit?: number;
  readonly filter?: RegExp;
  readonly platform?: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');
const defaultNtcRoot = selectDefaultRoot([path.resolve(repoRoot, 'external/ntc-templates')]);
const ntcRoot = process.env.NTC_TEMPLATES_ROOT
  ? path.resolve(repoRoot, process.env.NTC_TEMPLATES_ROOT)
  : defaultNtcRoot;

function selectDefaultRoot(candidates: string[]): string {
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return candidates[0];
}

const fixturesPromise = collectNtcFixtures(ntcRoot, {
  limit: parseLimit(process.env.NTC_COMPAT_LIMIT),
  filter: createFilter(process.env.NTC_COMPAT_FILTER),
  platform: process.env.NTC_COMPAT_PLATFORM,
});

function parseLimit(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return undefined;
  }
  return parsed;
}

function createFilter(pattern: string | undefined): RegExp | undefined {
  if (!pattern) {
    return undefined;
  }
  try {
    return new RegExp(pattern, 'i');
  } catch {
    return undefined;
  }
}

async function pathExists(candidate: string): Promise<boolean> {
  try {
    await fs.access(candidate);
    return true;
  } catch {
    return false;
  }
}

async function collectNtcFixtures(
  root: string,
  options: FixtureDiscoveryOptions,
): Promise<CompatibilityCase[]> {
  const testsDir = path.join(root, 'tests');
  const templatesDir = path.join(root, 'ntc_templates', 'templates');

  if (!(await pathExists(testsDir)) || !(await pathExists(templatesDir))) {
    return [];
  }

  const { limit, filter, platform } = options;
  const result: CompatibilityCase[] = [];
  const platformDirs = await fs.readdir(testsDir, { withFileTypes: true });

  for (const platformDir of platformDirs) {
    if (!platformDir.isDirectory()) {
      continue;
    }
    const platformName = platformDir.name;
    if (platform && platformName !== platform) {
      continue;
    }

    const platformPath = path.join(testsDir, platformName);
    const commandDirs = await fs.readdir(platformPath, { withFileTypes: true });

    for (const commandDir of commandDirs) {
      if (!commandDir.isDirectory()) {
        continue;
      }
      const commandPath = path.join(platformPath, commandDir.name);
      const entries = await fs.readdir(commandPath, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith('.raw')) {
          continue;
        }

        const baseName = entry.name.slice(0, -4);
        if (filter && !filter.test(baseName)) {
          continue;
        }

        const expectedYamlPath = await resolveExpectationPath(commandPath, baseName);
        if (!expectedYamlPath) {
          continue;
        }

        result.push({
          id: `${platformName}/${commandDir.name}/${entry.name}`,
          platform: platformName,
          command: commandDir.name.replaceAll('_', ' '),
          rawPath: path.join(commandPath, entry.name),
          expectedPath: expectedYamlPath,
        });

        if (limit && limit > 0 && result.length >= limit) {
          return result;
        }
      }
    }
  }

  return result;
}

async function resolveExpectationPath(
  directory: string,
  baseName: string,
): Promise<string | undefined> {
  const candidates = [
    path.join(directory, `${baseName}.yml`),
    path.join(directory, `${baseName}.yaml`),
  ];

  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

function normalizeValue(value: unknown): TextFSMValue {
  if (Array.isArray(value)) {
    return value.map((item) => (item == null ? '' : String(item)));
  }
  return value == null ? '' : String(value);
}

function hasNormalizedValue(value: TextFSMValue): boolean {
  return Array.isArray(value)
    ? value.some((item) => item.trim().length > 0)
    : value.trim().length > 0;
}

function normalizeActual(records: TextFSMRecord[]): TextFSMRecord[] {
  return records
    .map((record) => {
      const normalized: TextFSMRecord = {};
      for (const [key, value] of Object.entries(record)) {
        normalized[key.toLowerCase()] = normalizeValue(value);
      }
      return normalized;
    })
    .filter((record) => Object.values(record).some(hasNormalizedValue));
}

function normalizeExpected(raw: unknown): TextFSMRecord[] {
  if (!raw || typeof raw !== 'object') {
    return [];
  }
  const parsedSample = Array.isArray((raw as { parsed_sample?: unknown }).parsed_sample)
    ? (raw as { parsed_sample: Array<Record<string, unknown>> }).parsed_sample
    : [];

  return parsedSample.map((row) => {
    const normalized: TextFSMRecord = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[key] = normalizeValue(value);
    }
    return normalized;
  });
}

const compatibilityCases = await fixturesPromise;
const templatesDir = path.join(ntcRoot, 'ntc_templates', 'templates');
const indexSource =
  compatibilityCases.length > 0 ? await fs.readFile(path.join(templatesDir, 'index'), 'utf-8') : '';
const compatFlag = process.env.NTC_COMPAT?.toLowerCase();
const shouldSkip = Boolean(compatFlag?.match(/^(0|false|skip)$/));
const describeFn = shouldSkip ? describe.skip : describe;

describe('NTC value normalization', () => {
  it('preserves list values in expected records', () => {
    expect(normalizeExpected({ parsed_sample: [{ vlan: ['10', '11'] }] })).toEqual([
      { vlan: ['10', '11'] },
    ]);
  });

  it('preserves list values and normalizes keys in actual records', () => {
    expect(normalizeActual([{ VLAN: ['10', '11'] }])).toEqual([{ vlan: ['10', '11'] }]);
  });
});

describeFn('NTC template compatibility', () => {
  if (compatibilityCases.length === 0) {
    it('has downloaded fixtures', () => {
      throw new Error(
        `No NTC fixtures found at ${ntcRoot}. Run npm run fetch:ntc-templates first.`,
      );
    });
    return;
  }

  for (const compatCase of compatibilityCases) {
    it(`parses ${compatCase.id}`, async () => {
      const { rawPath, expectedPath } = compatCase;
      const [rawInput, expectedYaml] = await Promise.all([
        fs.readFile(rawPath, 'utf-8'),
        fs.readFile(expectedPath, 'utf-8'),
      ]);

      const expected = normalizeExpected(load(expectedYaml));
      const table = new CliTable(indexSource, (name) =>
        readFileSync(path.join(templatesDir, name), 'utf-8'),
      );
      const actualDicts = table.parseCmd(rawInput, {
        Platform: compatCase.platform,
        Command: compatCase.command,
      });
      const actual = normalizeActual(actualDicts);

      expect(actual).toEqual(expected);
    });
  }
});
