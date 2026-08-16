import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const packageJson = JSON.parse(await readFile(join(rootDir, 'package.json'), 'utf8'));
const jsrJson = JSON.parse(await readFile(join(rootDir, 'jsr.json'), 'utf8'));

if (packageJson.version !== jsrJson.version) {
  throw new Error(
    `Package versions do not match: package.json=${packageJson.version}, jsr.json=${jsrJson.version}`,
  );
}
