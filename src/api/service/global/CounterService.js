'use strict';

const { Counter } = require('@models').system;
const { MoozaicGlobalCounter } = require('@models').moozaic;
const socket = require('@lib/socket');
const { v4: uuidv4 } = require('uuid');
const { commands } = require('@constants/ws');

const counters = new Map();

exports.emitChange = (counter) => {
  socket.emit('data', {
    _date: Date.now(),
    _command: commands.counter_update,
    _uuid: uuidv4(),
    _data: counter,
  });
};

exports.getCounter = async (key) => {
  if (counters.has(key)) {
    return counters.get(key);
  }

  const counter = await Counter.findOne({ where: { key } });
  if (counter) {
    counters.set(key, counter);
    return counter;
  }

  return null;
};

exports.getCounters = async (keys) => {
  const values = util.objectWithKeys(keys);

  for (const key of util.nullKeys(values)) {
    values[key] = counters.get(key) ?? null;
  }

  let nullCounters = util.nullKeys(values);
  if (nullCounters.length === 0) return values;

  const fromNew = await Counter.findAll({
    where: {
      key: nullCounters,
    },
  });

  for (const counter of fromNew) {
    values[counter.key] = counter;
  }

  nullCounters = util.nullKeys(values);
  if (nullCounters.length === 0) return values;

  const fromOld = await MoozaicGlobalCounter.findAll({
    where: {
      code: nullCounters,
    },
  });

  for (const counter of fromOld) {
    values[counter.code] = {
      id: counter.id,
      key: counter.code,
      init: counter.init,
      max: counter.end,
      value: counter.count,
    };
  }

  return values;
};

exports.create = async (key, { max, init: _init, model_name, model_id }) => {
  const init = _init ?? 0;
  await Counter.destroy({
    where: {
      key,
    },
  });

  const counter = await Counter.create({
    key,
    max,
    init: init ?? 0,
    value: init ?? 0,
    model_name,
    model_id,
  });

  counters.set(key, counter);

  return counter;
};

exports.tick = async (key, inc = 1, sendToWS = true) => {
  const counter = await exports.getCounter(key);
  if (!counter) {
    throw new Error(`counter with key:${key} not found`);
  }

  counter.value = counter.value + inc;
  await counter.save();
  await MoozaicGlobalCounter.update(
    { count: counter.value, init: counter.init, end: counter.max },
    {
      where: {
        code: counter.key,
      },
    },
  );
  if (sendToWS) exports.emitChange(counter);
};

exports.reset = async (key, { init, value, max }) => {
  const counter = await exports.getCounter(key);

  await counter.update({
    max,
    init,
    value,
  });
  exports.emitChange(counter);
};

// /**
//  *
//  * @param {string} key
//  */
// const getModelName = (key) => {
//   if (key.startsWith(''))
// }
// exports.syncWithOldCounter = async () => {
//   for (const oldCounter of await MoozaicGlobalCounter.findAll()) {
//     const current = Counter.findOne({ key: oldCounter.code });
//     if (!current) {
//       Counter.create({
//         key: oldCounter.code,
//         init: oldCounter.init,
//         max: oldCounter.end,
//         value: oldCounter.count,

//       })
//     }
//   }

// }

const util = {
  /**
   *
   * @param {string[]} keys
   * @returns {Record<string, null | any>}
   */
  objectWithKeys(keys) {
    const object = {};
    for (const key of keys) {
      object[key] = null;
    }
    return object;
  },
  /**
   *
   * @param {Record<string, null | any>} obj
   * @returns {string[]}
   */
  nullKeys(obj) {
    const result = [];
    for (const [key, value] of Object.entries(obj)) {
      if (value) continue;
      result.push(key);
    }

    return result;
  },
};
