import { DataTypes, Model, Sequelize } from 'sequelize';

import type { Namespace } from 'cls-hooked';
/* eslint-disable @typescript-eslint/no-var-requires */
import { getConnectionFor } from '@lib/sequelize';
import { walk } from '@lib/walk';

export class AnyModel extends Model<any, any> {
  [key: string]: any;
}

export type DatabaseModels = {
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
  transaction: <T>(cb: any) => Promise<T>;
  noTransaction: <T>(cb: () => Promise<T>) => Promise<T>;
} & {
  [key: string]: typeof AnyModel;
};

interface ModelFactory {
  filename: string;
  factory: (sequelize: Sequelize, datatypes: typeof DataTypes) => AnyModel;
}

let namespace: Namespace;
const enableClsHooked = !process.env.DISABLE_CLS_HOOKED;
if (enableClsHooked) {
  const cls = require('cls-hooked');
  namespace = cls.createNamespace('sequelize-namespace');
  Sequelize.useCLS(namespace);
}

/** */

/**
 * This function should be only called once
 */
function loadFactories() {
  const factories: ModelFactory[] = [];
  for (const { filename, path } of walk(__dirname)) {
    const mod = require(path);
    const factory =
      typeof mod.init === 'function'
        ? mod.init
        : typeof mod === 'function'
        ? mod
        : null;

    if (!factory) {
      console.warn(`Ignore loading ${path}: no init function were defined`);
      continue;
    }

    factories.push({
      filename,
      factory,
    });
  }

  return factories;
}

const factories = loadFactories();

function loadModels(
  database: Sequelize,
  filesCondition: (filename: string) => boolean,
): DatabaseModels {
  const models = factories
    .filter((f) => filesCondition(f.filename))
    .map((f) => f.factory(database, DataTypes));

  const db = Object.fromEntries(models.map((m) => [m.name, m]));
  db.sequelize = database;
  db.Sequelize = Sequelize;

  db.transaction = function transaction<T>(cb: (t?: any) => Promise<T>) {
    if (!namespace) return cb();

    const t = namespace.get('transaction');
    return t ? cb(t) : database.transaction(cb);
  };

  db.noTransaction = function noTransaction<T>(cb: () => Promise<T>) {
    if (!namespace) return cb();

    const t = namespace.get('transaction');
    if (!t) return cb();
    return namespace.runAndReturn(() => {
      namespace.set('transaction', undefined);
      return cb();
    });
  };

  return db;
}

export const intranet = loadModels(
  getConnectionFor('intranet')!,
  (file) =>
    file.startsWith('intranet') ||
    file.startsWith('unpaid') ||
    file.startsWith('inventory'),
);

export const moozaic = loadModels(getConnectionFor('moozaic')!, (file) =>
  file.startsWith('moozaic'),
);

export const system = loadModels(
  getConnectionFor('system')!,
  (file) =>
    file.startsWith('hrms') ||
    file.startsWith('global') ||
    file.startsWith('web') ||
    file.startsWith('crud') ||
    file.startsWith('delinternet') ||
    file.startsWith('geo') ||
    file.startsWith('acl') ||
    file.startsWith('stats') ||
    file.startsWith('technician') ||
    file.startsWith('installation') ||
    file.startsWith('discounting'),
);

// @ts-ignore Should be refactored
export const allModels: Record<string, AnyModel> = {
  ...intranet,
  ...moozaic,
  ...system,
};

for (const model of Object.values(allModels)) {
  if ('associate' in model) {
    model.associate(allModels);
  }
}
