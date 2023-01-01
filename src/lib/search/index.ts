import factory, { MeiliSearchEngine } from '@del-internet/support-search';

import Sequelize from './Sequelize';
import { get as config } from '@config';

const Manager = factory(config('search'));
const Meilisearch = Manager.driver('meilisearch') as MeiliSearchEngine;

export { Manager as default, Manager, Sequelize, Meilisearch };
