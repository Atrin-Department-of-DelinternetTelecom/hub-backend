import { AnyModel, DatabaseModels } from '@models';
import { Model, Sequelize } from 'sequelize';

import ActionEventFields from '@resources/crud/fields/ActionEvent';
import { get as config } from '@config';
import { createCustomActionEvent } from '@api/utils/custom-action-model-handler';
import moment from 'moment';
import { v4 } from 'uuid';

type UnknownRecord = Record<string, unknown>;

export type CreationParameters = {
  payload?: UnknownRecord;
  resource: AnyModel;
  userId: number;
};
export type UpdateParameters = CreationParameters & {
  original?: AnyModel | UnknownRecord | null;
};
export type DeleteParameters = CreationParameters;
export type ActionParameters = UpdateParameters & {
  action: string;
  batchId?: string;
};

const getChanges = (original: UnknownRecord, updates: UnknownRecord) => {
  const changes: UnknownRecord = {};

  for (const key in original) {
    let currentValue = updates[key];
    let originalValue = original[key];

    if (currentValue instanceof Date) {
      currentValue = moment(currentValue).toISOString();
    }
    if (originalValue instanceof Date) {
      originalValue = moment(originalValue).toISOString();
    }
    if (currentValue !== originalValue) {
      changes[key] = currentValue;
    }
  }

  return changes;
};

export class ActionEvent extends Model {
  declare id: number;
  declare action: string;
  declare batch_id: string;
  declare resource_id: number | null;
  declare resource_type: string | null;
  declare status: string;
  declare original: UnknownRecord;
  declare cahnges: UnknownRecord;
  declare payload: UnknownRecord;
  declare user_id: number;
  declare created_at: Date;
  declare updated_at: Date;

  static associate(models: DatabaseModels) {
    ActionEvent.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });

    ActionEvent.addHook(
      'afterCreate',
      'generateCustomActionEvent',
      async (actionEvent) => {
        const { CustomActionEventType } = models;
        const customActionTypes = await CustomActionEventType.findAll({
          where: {
            resource_type: actionEvent.get('resource_type'),
            action: actionEvent.get('action'),
            enable: true,
          },
        });
        Promise.all(
          customActionTypes.map((customActionType) =>
            createCustomActionEvent(customActionType, actionEvent),
          ),
        );
      },
    );
  }

  /**
   * Set action event as finished.
   */
  async markAsFinished() {
    this.set('status', 'finished');

    await this.save();

    return this;
  }

  /**
   * Init action event for creating resource event.
   */
  static forResourceCreate({
    payload = {},
    resource,
    userId,
  }: CreationParameters) {
    return new ActionEvent({
      payload,
      action: 'Create',
      resource_type: resource.constructor.name,
      resource_id: resource.get('id'),
      changes: resource.get({ plain: true }),
      user_id: userId,
      batch_id: v4(),
    });
  }

  /**
   * Init action event for update resource event.
   */
  static forResourceUpdate({
    payload = {},
    resource,
    userId,
    original,
  }: UpdateParameters) {
    if (original instanceof Model) {
      original = (original.get({ plain: true }) as UnknownRecord) ?? {};
    } else if (!original) {
      original = resource.previous() ?? {};
    }

    return new ActionEvent({
      payload,
      original,
      action: 'Update',
      resource_type: resource.constructor.name,
      resource_id: resource.get('id'),
      changes: getChanges(original, resource.get({ plain: true })),
      user_id: userId,
      batch_id: v4(),
    });
  }

  /**
   * Init action event for update resource event.
   */
  static forAction({ action, batchId, ...params }: ActionParameters) {
    return ActionEvent.forResourceUpdate(params)
      .set('action', action)
      .set('batch_id', batchId ?? v4());
  }

  /**
   * Init action event for deleting resource event.
   */
  static forResourceDelete({
    payload = {},
    resource,
    userId,
  }: DeleteParameters) {
    return new ActionEvent({
      payload,
      action: 'Delete',
      resource_type: resource.constructor.name,
      resource_id: resource.get('id'),
      original: resource.get({ plain: true }),
      user_id: userId,
      batch_id: v4(),
    });
  }

  /**
   * Init action event for force deleting resource event.
   */
  static forResourceForceDelete({
    payload = {},
    resource,
    userId,
  }: DeleteParameters) {
    return new ActionEvent({
      payload,
      action: 'ForceDelete',
      resource_type: resource.constructor.name,
      resource_id: resource.get('id'),
      original: resource.get({ plain: true }),
      user_id: userId,
      batch_id: v4(),
    });
  }
}

export function init(sequelize: Sequelize) {
  ActionEvent.init(
    new ActionEventFields().fieldCollection({}).toSequelizeConfig(),
    {
      sequelize,
      modelName: 'ActionEvent',
      paranoid: false,
      underscored: true,
      schema: config('index.sequelize.system.database'),
    },
  );

  return ActionEvent;
}
