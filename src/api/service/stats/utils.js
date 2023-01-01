'use strict';

const knex = require('@lib/knex').intranet;
const config = require('@config');

const { cleanObject } = require('@utils/tools');

/**
 *
 * @param {string} input
 * @returns {{ service?: string, internetTechnology?: string }}
 */
exports.getServiceInfo = (input) => {
  if (!input) return {};

  switch (input) {
    case 'fibra':
    case 'radio':
      return { service: 'INTERNET', internetTechnology: input };

    case 'cell':
    case 'tv':
    case 'fix':
      return { service: input.toUpperCase() };

    default:
      throw new Error(`invalid service name: ${input}`);
  }
};

/**
 *
 * @param {{ pinned: number[], status?: boolean }} param0
 * @returns
 */
exports.knexUsers = ({ pinned, status } = { pinned: [] }) => {
  pinned = pinned ? [...pinned] : [];
  if (pinned.length === 0) pinned.push(-1); // prevent incorrect sql

  const isPinnedSelect =
    pinned.length === 0
      ? knex.raw('0 as is_pinned')
      : knex.raw(`moozaic_users.id in (${pinned.toString()}) as is_pinned`);

  return knex('moozaic.moozaic_users')
    .select(
      'moozaic_users.id',
      'moozaic_users.id as userId', // for backward-compatibility
      'moozaic_users.name',
      'moozaic_users.email',
      'moozaic_users.status',
      'gf_users.role',
      'global_users.id as globalUserId',
      isPinnedSelect,
    )
    .leftJoin('gf_users', { 'gf_users.userId': 'moozaic_users.id' })
    .leftJoin('delinternet_hub.global_users as global_users', {
      'global_users.user_id': 'moozaic_users.id',
    })
    .where(
      cleanObject({
        'moozaic_users.uid': config.get('index.intranet.uid'),
        'moozaic_users.status': status,
      }),
    )
    .orderBy('is_pinned', 'desc');
};

exports.kUserIdRef = knex.ref('moozaic_users.id');
