import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { extract } from 'tar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const lockPath = path.join(projectRoot, 'tests/compat/ntc-templates.lock.json');
const MAX_DOWNLOAD_BYTES = 100 * 1024 * 1024;
const MAX_EXTRACTED_BYTES = 512 * 1024 * 1024;
const MAX_ENTRY_BYTES = 100 * 1024 * 1024;
const MAX_ENTRIES = 100_000;

async function loadLock() {
  const lock = JSON.parse(await readFile(lockPath, 'utf8'));
  if (
    !lock ||
    typeof lock !== 'object' ||
    !/^v\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(lock.tags)
  ) {
    throw new Error('ntc-templates.lock.json must contain a valid tags value');
  }
  if (typeof lock.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(lock.sha256)) {
    throw new Error('ntc-templates.lock.json must contain a lowercase SHA-256 hash');
  }
  return lock;
}

export function buildArchiveUrl(tag) {
  return `https://github.com/networktocode/ntc-templates/archive/refs/tags/${tag}.tar.gz`;
}

export function createEntryValidator({
  maxExtractedBytes = MAX_EXTRACTED_BYTES,
  maxEntryBytes = MAX_ENTRY_BYTES,
  maxEntries = MAX_ENTRIES,
} = {}) {
  let entryCount = 0;
  let totalBytes = 0;

  return (entryPath, entry) => {
    entryCount += 1;
    if (entryCount > maxEntries) {
      throw new Error(`Archive contains more than ${maxEntries} entries`);
    }

    const normalizedName = entryPath.replaceAll('\\', '/');
    const segments = normalizedName.split('/');
    if (
      normalizedName.includes('\0') ||
      normalizedName.startsWith('/') ||
      /^[A-Za-z]:/.test(normalizedName) ||
      segments.includes('..')
    ) {
      throw new Error(`Unsafe archive entry path: ${entryPath}`);
    }

    if (!['File', 'OldFile', 'Directory'].includes(entry.type)) {
      throw new Error(`Unsupported archive entry type ${entry.type}: ${entryPath}`);
    }

    if (entry.size > maxEntryBytes) {
      throw new Error(`Archive entry is too large: ${entryPath}`);
    }
    totalBytes += entry.size;
    if (totalBytes > maxExtractedBytes) {
      throw new Error(`Archive expands beyond ${maxExtractedBytes} bytes`);
    }
    return true;
  };
}

async function downloadArchive(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/gzip',
      'User-Agent': 'textfsm-ts-ntc-fetcher',
    },
    redirect: 'follow',
  });
  if (!response.ok || !response.body) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }
  if (new URL(response.url).protocol !== 'https:') {
    throw new Error(`Archive URL must use HTTPS: ${response.url}`);
  }

  const declaredLength = Number.parseInt(response.headers.get('content-length') ?? '0', 10);
  if (declaredLength > MAX_DOWNLOAD_BYTES) {
    throw new Error(`Archive is larger than ${MAX_DOWNLOAD_BYTES} bytes`);
  }

  const chunks = [];
  let downloadedBytes = 0;
  for await (const chunk of response.body) {
    downloadedBytes += chunk.byteLength;
    if (downloadedBytes > MAX_DOWNLOAD_BYTES) {
      throw new Error(`Archive download exceeded ${MAX_DOWNLOAD_BYTES} bytes`);
    }
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function discoverArchiveRoot(extractDir) {
  const entries = await readdir(extractDir, { withFileTypes: true });
  const roots = entries.filter((entry) => entry.isDirectory());
  if (roots.length !== 1 || entries.length !== 1) {
    throw new Error('Archive must contain exactly one top-level directory');
  }

  const root = path.join(extractDir, roots[0].name);
  const requiredPaths = [
    path.join(root, 'ntc_templates', 'templates', 'index'),
    path.join(root, 'tests'),
  ];
  for (const requiredPath of requiredPaths) {
    await access(requiredPath);
  }
  if (!(await stat(requiredPaths[1])).isDirectory()) {
    throw new Error('Archive tests path is not a directory');
  }
  return root;
}

async function hasValidCache(targetDir, expectedSource) {
  try {
    const source = JSON.parse(
      await readFile(path.join(targetDir, '.textfsm-ts-source.json'), 'utf8'),
    );
    return (
      source.archiveUrl === expectedSource.archiveUrl &&
      source.tag === expectedSource.tag &&
      source.sha256 === expectedSource.sha256
    );
  } catch {
    return false;
  }
}

async function replaceDirectory(sourceDir, targetDir) {
  const backupDir = `${targetDir}.backup-${process.pid}-${Date.now()}`;
  const hadTarget = existsSync(targetDir);
  if (hadTarget) {
    await rename(targetDir, backupDir);
  }

  try {
    await rename(sourceDir, targetDir);
  } catch (error) {
    if (hadTarget && existsSync(backupDir)) {
      await rename(backupDir, targetDir);
    }
    throw error;
  }

  if (hadTarget) {
    await rm(backupDir, { recursive: true, force: true });
  }
}

async function main() {
  const { tags: tag, sha256: expectedSha256 } = await loadLock();
  const archiveUrl = buildArchiveUrl(tag);
  const targetDir = path.resolve(
    process.env.NTC_TEMPLATES_TARGET ?? path.join(projectRoot, 'external', 'ntc-templates'),
  );
  const expectedSource = { archiveUrl, tag, sha256: expectedSha256 };
  if (await hasValidCache(targetDir, expectedSource)) {
    console.log(`Using cached ntc-templates ${tag} at ${targetDir}`);
    return;
  }

  await mkdir(path.dirname(targetDir), { recursive: true });
  const workDir = await mkdtemp(path.join(path.dirname(targetDir), '.ntc-templates-download-'));

  try {
    console.log(`Downloading ${archiveUrl}`);
    const archive = await downloadArchive(archiveUrl);
    const actualSha256 = createHash('sha256').update(archive).digest('hex');
    if (actualSha256 !== expectedSha256) {
      throw new Error(`SHA-256 mismatch: expected ${expectedSha256}, received ${actualSha256}`);
    }

    const archivePath = path.join(workDir, 'ntc-templates.tar.gz');
    const extractDir = path.join(workDir, 'extracted');
    await writeFile(archivePath, archive, { flag: 'wx' });
    await mkdir(extractDir);
    await extract({
      cwd: extractDir,
      file: archivePath,
      filter: createEntryValidator(),
      preservePaths: false,
      strict: true,
    });

    const archiveRoot = await discoverArchiveRoot(extractDir);
    await writeFile(
      path.join(archiveRoot, '.textfsm-ts-source.json'),
      `${JSON.stringify(expectedSource, null, 2)}\n`,
      { flag: 'wx' },
    );
    await replaceDirectory(archiveRoot, targetDir);
    console.log(`Installed ntc-templates ${tag} at ${targetDir}`);
    console.log(`SHA-256: ${actualSha256}`);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
