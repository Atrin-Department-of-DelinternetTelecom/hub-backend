'use strict';

const { respondBadRequest, respondOK } = require('@utils/response');
const { PinnedRow } = require('@models').system;
const {
  moozaic: { MoozaicUser },
} = require('@models');
const _ = require('lodash');

/** @type {Map<string, number[]>} */
const cache = new Map();

/**
 *
 * @param {string} table_name
 * @returns {Promise<number[]>}
 */
const getPinnedUsers = async (table_name) => {
  if (cache.has(table_name)) return cache.get(table_name);

  const pinned = await PinnedRow.findAll({
    where: {
      table_name,
    },
  });

  const pinnedRows = pinned.map((e) => e.row_id);
  cache.set(table_name, pinnedRows);
  return pinnedRows;
};

exports.getPinnedUsers = getPinnedUsers;

exports.postPinUser = async ({ user_id, table_name }) => {
  if (!user_id) return respondBadRequest('user_id is null');

  const currentPinnedUsers = await getPinnedUsers(table_name);
  if (currentPinnedUsers.includes(user_id)) {
    return respondOK(`user:${user_id} is already pinned`);
  }

  await PinnedRow.create({
    table_name,
    row_id: user_id,
  });

  cache.clear();
  return respondOK(`user:${user_id} pinned`);
};

/**
 *
 * @param {`${string}:${string}`} row
 * @returns
 */
exports.deleteUnpinUser = async (row) => {
  const [table_name, user_id] = row.split(':');
  if (!table_name || !user_id)
    return respondBadRequest('table_name/row_id is null');

  await PinnedRow.destroy({
    where: {
      table_name,
      row_id: user_id,
    },
  });

  cache.clear();
  return respondOK(`${row} unpinned`);
};
