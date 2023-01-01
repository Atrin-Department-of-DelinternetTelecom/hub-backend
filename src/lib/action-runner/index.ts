import Sequelize, { CreationAttributes } from 'sequelize';
import * as socket from '@lib/socket';
import { v4 as uuidv4 } from 'uuid';
import config from '@config';
import { commands } from '@constants/ws';
import { Action } from '@models/global/global_action';
import { Bulk } from '@models/global/global_bulk';

type Handler = (params: unknown, bulk: Bulk, action: Action) => Promise<void>;

const delay = (ms: number) =>
  new Promise((res) => {
    setTimeout(res, ms);
  });

class ActionRunner {
  handlers = new Map<string, Handler>();
  bulks = new Map<number, Bulk>();
  actions: Record<number, Action[]> = {};

  #getUnfinishedBulks() {
    return Bulk.findAll({
      where: {
        status: 'running',
      },
    });
  }

  #getScheduledBulks() {
    return Bulk.findAll({
      where: {
        status: 'scheduled',
        scheduled_for: {
          [Sequelize.Op.lte]: new Date(),
        },
      },
    });
  }

  async #fetchNextActionChunk(bulkId: number, n: number): Promise<Action[]> {
    if (!this.actions[bulkId]) {
      this.actions[bulkId] = await Action.findAll({
        where: {
          bulk_id: bulkId,
          status: 'in-queue',
        },
      });
    }
    return this.actions[bulkId].splice(0, n);
  }

  #emitChange(bulk: Bulk) {
    socket.emit('data', {
      _date: Date.now(),
      _command: commands.bulk_update,
      _uuid: uuidv4(),
      _data: bulk,
    });
  }

  async processBulk(bulk: Bulk) {
    this.bulks.set(bulk.id, bulk);

    await bulk.update({ status: 'running' });

    while (bulk.status === 'running') {
      const nextChunk = await this.#fetchNextActionChunk(
        bulk.id,
        bulk.params.fetchActions ? bulk.params.fetchActions : 1,
      );
      console.log(`Found ${nextChunk.length} actions in bulk ${bulk.id}`);
      if (nextChunk.length === 0) {
        break;
      }

      const actionIds = [];
      for (const action of nextChunk) {
        actionIds.push(action.id);
        action.status = 'pending';
      }
      await Action.update({ status: 'pending' }, { where: { id: actionIds } });

      const results = await Promise.allSettled(
        nextChunk.map((action) => {
          const actionHandler = this.handlers.get(action.name);
          if (!actionHandler) {
            throw new Error(`Can not find handler for action:${action.name}`);
          }

          return actionHandler(action.params, bulk, action);
        }),
      );

      let i = 0;
      let nFulfilled = 0;
      let nFailed = 0;

      for (const result of results) {
        const action = nextChunk[i];

        if (result.status === 'fulfilled') {
          await action.update({ status: 'fulfilled', result: result.value });
          nFulfilled++;
        } else {
          console.error('Error', result.reason);
          if (
            action.remaining_retry_count <= 1 &&
            result.reason.message !== 'retry'
          ) {
            await action.update({
              status: 'failed',
              error: result.reason.toString(),
              remaining_retry_count: 0,
            });
            nFailed++;
          } else {
            await action.update({
              status: 'in-queue',
            });
            this.actions[action.bulk_id].push(action);
          }
        }

        i++;
      }

      // update bulk progress state
      await bulk.update({
        total_fulfilled_actions: bulk.total_fulfilled_actions + nFulfilled,
        total_failed_actions: bulk.total_failed_actions + nFailed,
      });

      this.#emitChange(bulk);
    }

    if (bulk.status === 'paused') {
      this.#emitChange(bulk);
      console.log(`Bulk ${bulk.id} paused`);
      return;
    }

    if (bulk.status === 'stopped') {
      this.#emitChange(bulk);
      console.log(`Bulk ${bulk.id} stopped`);
      return;
    }

    // bulk is finished normally
    await bulk.update({ status: 'finished', finished_at: new Date() });
    this.#emitChange(bulk);
    this.bulks.delete(bulk.id);
    console.log(`Bulk ${bulk.id} finished`);
  }

  register(action: string, handler: Handler) {
    this.handlers.set(action, handler);
  }

  async start() {
    if (config.get('global.actions.disable')) {
      console.log('Actions were disabled due config');
      return;
    }
    const bulks = await this.#getUnfinishedBulks();
    console.log(`Found ${bulks.length} unfinished bulks`);
    bulks.forEach((bulk) => this.processBulk(bulk));

    return setInterval(async () => {
      const scheduledBulks = await this.#getScheduledBulks();
      console.log(`Found ${scheduledBulks.length} scheduled bulks`);
      scheduledBulks.forEach((bulk) => this.processBulk(bulk));
    }, 5 * 60 * 1000);
  }

  async createBulk(
    bulk: CreationAttributes<Bulk>,
    actions: { name: string; params: any }[],
  ) {
    const now = new Date();

    if (bulk.scheduled_for) {
      bulk.status = 'scheduled';
      console.log(`Bulk scheduled for ${bulk.scheduled_for}`);
    }

    const createdBulk = await Bulk.create({
      name: bulk.name,
      model_name: bulk.model_name,
      model_id: bulk.model_id,
      creator_id: bulk.creator_id,
      status: bulk.status ?? 'running',
      total_actions: actions.length,
      scheduled_for: bulk.scheduled_for,
      params: bulk.params,
      created_at: now,
      finished_at: null,
    });

    actions = actions.map((action) => ({
      ...action,
      bulk_id: createdBulk.id,
      created_at: now,
    }));

    await Action.bulkCreate(actions);

    if (bulk.status === 'scheduled') return createdBulk;
    this.processBulk(createdBulk);

    return createdBulk;
  }

  async pauseBulk(bulkId: number) {
    const bulk = this.bulks.get(bulkId);
    if (!bulk) return false;
    await bulk.update({ status: 'paused' });
    return bulk;
  }

  async stopBulk(bulkId: number) {
    const bulk = this.bulks.get(bulkId);
    if (!bulk) return false;
    await bulk.update({ status: 'stopped' });
    await delay(2000); // delay to let the bulk finish
    return bulk;
  }

  async resumeBulk(bulkId: number) {
    const bulk = this.bulks.get(bulkId) ?? (await Bulk.findByPk(bulkId));
    if (!bulk) return false;
    bulk.status = 'running';
    this.processBulk(bulk);
    return bulk;
  }

  async rerunAction(actionId: number) {
    const action = await Action.findByPk(actionId);
    if (!action) return false;

    if (action.status !== 'failed') return false;

    const bulk = await Bulk.findByPk(action.bulk_id);
    if (!bulk) return false;

    const actionHandler = this.handlers.get(action.name);
    if (!actionHandler)
      throw new Error(`Can not find handler for action:${action.name}`);

    await action.update({ status: 'pending' });

    const [result] = await Promise.allSettled([
      actionHandler(action.params, bulk, action),
    ]);

    if (result.status === 'fulfilled') {
      await action.update({ status: 'fulfilled', result: result.value });
      await bulk.update({
        total_fulfilled_actions: bulk.total_fulfilled_actions + 1,
        total_failed_actions: bulk.total_failed_actions - 1,
      });
      this.#emitChange(bulk);
    } else {
      await action.update({
        status: 'failed',
        error: result.reason.toString(),
      });
    }

    return action;
  }

  findBulkForModel(model_name: string, model_id: number) {
    for (const [bulkId, bulk] of this.bulks.entries()) {
      if (bulk.model_name === model_name && bulk.model_id === model_id)
        return bulk;
    }
  }
}

const instance = new ActionRunner();
export default instance;
