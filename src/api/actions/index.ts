import ActionRunner from '@lib/action-runner/index';
import fs from 'node:fs';
import path from 'node:path';

// set timer
// read files in task directory
fs.readdirSync(__dirname).forEach((filename) => {
  if (filename !== 'index.ts') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const handler = require(path.join(__dirname, filename));

    ActionRunner.register(
      filename.replace(/\.(?:ts|js)$/, ''),
      handler.default ?? handler,
    );
  }
});
