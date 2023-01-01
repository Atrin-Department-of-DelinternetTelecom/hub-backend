'use strict';

const { Counter } = require('@models').system;
const { MoozaicGlobalCounter } = require('@models').moozaic;
const socket = require('@lib/socket');
const { v4: uuid } = require('uuid');
const { commands } = require('@constants/ws');

const emitWS = (c) => {
  socket.emit('data', {
    _date: Date.now(),
    _command: commands.counter_update,
    _uuid: uuid(),
    _data: c.get ? c.get({ plain: true }) : c,
  });
};

const withDelta = (model, d) => {
  if (!model) return null;
  const plain = model.get({ plain: true });
  return {
    ...plain,
    value: plain.value + d,
  };
};

class OptimizedGlobalCounterService {
  /* singleton */
  static get instance() {
    if (!this._i) this._i = new OptimizedGlobalCounterService();
    return this._i;
  }

  constructor() {
    this.cache = new Map(); // key → Counter OR undefined (not found)
    this.delta = new Map(); // key → unflushed inc
    this.pending = new Map(); // key → same as delta, cleared on flush
    this.timer = null;
    this.FLUSH_MS = 10_000;
  }

  /* -------- public -------- */

  async get(key) {
    await this._loadKey(key);
    const model = this.cache.get(key);
    return withDelta(model || null, this.delta.get(key) || 0);
  }

  async create(key, { max, init = 0, model_name, model_id } = {}) {
    await Counter.destroy({ where: { key } });
    const model = await Counter.create({
      key,
      max,
      init,
      value: init,
      model_name,
      model_id,
    });
    this.cache.set(key, model);
    emitWS(model);
    return model.get({ plain: true });
  }

  async tick(key, inc = 1) {
    await this._loadKey(key);

    const newPending = (this.pending.get(key) || 0) + inc;
    const newDelta = (this.delta.get(key) || 0) + inc;

    this.pending.set(key, newPending);
    this.delta.set(key, newDelta);

    const model = this.cache.get(key);
    if (model) {
      emitWS({
        ...model.get({ plain: true }),
        value: model.value + newDelta,
      });
    }

    if (!this.timer)
      this.timer = setTimeout(() => this._flush(), this.FLUSH_MS);
  }

  async forceTick(key, inc = 1) {
    await Counter.increment({ value: inc }, { where: { key } });
    await MoozaicGlobalCounter.increment(
      { count: inc },
      { where: { code: key } },
    );
    this.delta.delete(key);
    await this.refresh(key); // sync cache & WS
  }

  async reset(key, data) {
    await this.refresh(key); // ensure model exists
    const model = this.cache.get(key);
    if (!model) throw new Error(`counter ${key} not found`);
    await model.update(data);
    this.delta.delete(key);
    emitWS(model);
  }

  async flushNow() {
    if (this.timer) clearTimeout(this.timer);
    await this._flush();
  }

  /** OPTIONAL: force re‑read committed value from DB */
  async refresh(key) {
    const model = await Counter.findOne({ where: { key } });
    this.cache.set(key, model || undefined);
    if (model) emitWS(model);
    return model ? model.get({ plain: true }) : null;
  }

  /* -------- load key -------- */
  async _loadKey(key) {
    if (!this.cache.has(key)) {
      const model = await Counter.findOne({ where: { key } });
      this.cache.set(key, model || undefined);
    }
  }

  /* -------- private flush -------- */
  async _flush() {
    this.timer = null;
    if (!this.pending.size) return;

    const batch = [...this.pending.entries()];
    this.pending.clear();

    await Counter.sequelize.transaction(async (t) => {
      for (const [key, inc] of batch) {
        await Counter.increment(
          { value: inc },
          { where: { key }, transaction: t },
        );
        await MoozaicGlobalCounter.increment(
          { count: inc },
          { where: { code: key }, transaction: t },
        );
        const model = this.cache.get(key);
        if (model) model.value += inc; // keep snapshot current
        this.delta.delete(key);
      }
    });

    for (const [key] of batch) {
      const model = this.cache.get(key);
      if (model) emitWS(model);
    }
  }
}

module.exports = OptimizedGlobalCounterService.instance;
