/* eslint-disable you-dont-need-lodash-underscore/get */
import fs from 'fs';
import path from 'path';
import _ from 'lodash';

const configs: Record<string, any> = {};

/**
 * Load all config files from the given config folder
 */
export const load = function (dir: string) {
  for (const filename of fs.readdirSync(dir)) {
    if (!filename.endsWith('.js')) {
      continue;
    }
    if (filename === 'index.js') {
      continue;
    }

    const key = filename.replace('.js', '');
    configs[key] = require(path.join(dir, filename));
  }
};

/**
 * get a config value by key
 * @param {string} configName
 * @param {any=} defaultValue
 */

export function get<T = any>(configName: string): T | null;
export function get<T = any>(configName: string, defaultValue: T): T;
export function get<T = any>(configName: string, defaultValue?: T): T | null {
  const v = _.get(configs, configName, defaultValue);
  if (v === null || v === undefined) {
    if (defaultValue === null) return null;
    console.error(new Error(`config not found: ${configName}`));
    // TODO(erfan) refactor this to throw after a while
    return v ?? null;
  }

  return v;
}

/**
 * get a config value by key
 * @param {string} configName
 */
export const set = function (configName: string, value: unknown) {
  _.set(configs, configName, value);
};
