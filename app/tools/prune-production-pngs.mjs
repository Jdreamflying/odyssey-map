import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const targets = ['scenes', 'landmarks', 'textures', 'assets/cartography', '地图小场景'];
let removed = 0;
let bytes = 0;

function prune(folder) {
  if (!existsSync(folder)) return;
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) prune(path);
    else if (entry.name.toLowerCase().endsWith('.png')) {
      bytes += statSync(path).size;
      rmSync(path);
      removed += 1;
    }
  }
}

for (const target of targets) prune(join(dist, target));
console.log(`[build] removed ${removed} PNG masters from dist (${(bytes / 1048576).toFixed(2)} MB); source masters remain in public/`);
