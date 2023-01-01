import { AnyModel, DatabaseModels } from '@models';
import { CreationOptional, Model, Sequelize } from 'sequelize';

import { SUSPENSION_ACTION_TYPE } from '@api/constants/contracts';
import SuspendingActionFields from '@resources/global/fields/SuspendingAction';
import { get as config } from '@config';
import moment from 'moment';

export class SuspendingAction extends Model {
  declare id: CreationOptional<number>;
  declare gf_contract_id: CreationOptional<number>;
  declare operator_id: CreationOptional<number>;
  declare comment: string;
  declare state: string;
  declare provider_tracking_code: string;
  declare doc_id: string;
  declare action_type: SUSPENSION_ACTION_TYPE;
  declare suspend_at: Date;
  declare suspended_at: Date;
  declare created_at: Date;
  declare updated_at: Date;
  // realtions
  declare GfContract?: AnyModel;
  declare User?: AnyModel;
  declare SuspendingReasons?: AnyModel[];

  isSuspendedInPast() {
    return moment(this.suspend_at).isBefore(moment());
  }

  static associate(models: DatabaseModels) {
    SuspendingAction.belongsTo(models.GfContract);
    SuspendingAction.belongsTo(models.User, {
      foreignKey: 'operator_id',
      targetKey: 'userId',
    });
    SuspendingAction.belongsToMany(models.SuspendingReason, {
      through: models.SuspendingActionReason,
    });
  }

  static forChangingTechnology(contract: AnyModel, userId: number) {
    return new SuspendingAction({
      gf_contract_id: contract.id,
      operator_id: userId,
      suspend_at: moment(),
      action_type: SUSPENSION_ACTION_TYPE.CHANGE_TECHNOLOGY,
    });
  }
}

export function init(sequelize: Sequelize) {
  SuspendingAction.init(
    //@ts-ignore
    new SuspendingActionFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      modelName: 'SuspendingAction',
      paranoid: false,
      schema: config('index.sequelize.system.database'),
      underscored: true,
    },
  );
  return SuspendingAction;
}
