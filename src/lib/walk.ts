import fs from 'fs';
import path from 'path';

/**
 * loads all files in a dir, except root level files and file and directories started with _
 * @param dir
 * @param level do not set it
 */
export function* walk(
  dir: string,
  level = 0,
): Generator<{
  path: string;
  filename: string;
}> {
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    const entry = path.join(dir, d.name);
    if (d.name.startsWith('_')) continue;
    if (d.isDirectory()) yield* walk(entry, level + 1);
    else if (d.isFile() && level > 0)
      yield {
        path: entry,
        filename: d.name,
      };
  }
}
