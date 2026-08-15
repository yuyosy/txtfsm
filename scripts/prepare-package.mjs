import { access, copyFile, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = join(rootDir, 'dist');
const requiredOutputs = ['txtfsm.js', 'txtfsm.umd.cjs', 'index.d.ts'];
const packageFiles = ['README.md', 'LICENSE', 'NOTICE'];

await Promise.all(requiredOutputs.map((file) => access(join(distDir, file))));

const packageJson = JSON.parse(await readFile(join(rootDir, 'package.json'), 'utf8'));

packageJson.private = false;
delete packageJson.scripts;
delete packageJson.devDependencies;

await Promise.all(packageFiles.map((file) => copyFile(join(rootDir, file), join(distDir, file))));

await writeFile(join(distDir, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);
