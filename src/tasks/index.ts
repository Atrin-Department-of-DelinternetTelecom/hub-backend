import config from '@config';
import fs from 'node:fs';
import path from 'node:path';

if (config.get('global.disableTasks')) {
  console.warn('Tasks were disabled due config');
} else {
  // read files in task directory
  const tasks = fs
    .readdirSync(__dirname)
    .filter((filename) => filename !== 'index.ts')
    .map((filename) => filename.replace(/\.(?:ts|js)$/, ''));

  tasks.map((task) => require(path.join(__dirname, task)));

  console.log('Tasks imported');
}
