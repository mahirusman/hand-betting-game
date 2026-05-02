import { cp, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outputRoot = join(root, 'dist/api-docker');
const compiledShared = join(outputRoot, 'libs/shared/src');
const sharedPackage = join(outputRoot, 'node_modules/@tile-game/shared');

await mkdir(sharedPackage, { recursive: true });
await cp(compiledShared, sharedPackage, { recursive: true });
await writeFile(
  join(sharedPackage, 'package.json'),
  JSON.stringify(
    {
      name: '@tile-game/shared',
      version: '0.0.0',
      private: true,
      main: 'index.js',
      types: 'index.d.ts',
    },
    null,
    2,
  ),
);
