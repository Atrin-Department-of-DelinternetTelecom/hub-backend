import { AnyModel, DatabaseModels } from '@models';
import { DataTypes, Model, Sequelize } from 'sequelize';

import { ASSIGNABLE_HISTORY } from '@api/constants/statuses';
import { get as config } from '@config';

export class OperadorLandlineHistory extends Model {
  declare id: number;
  declare action_type: ASSIGNABLE_HISTORY;
  declare operador_landline_id: number;
  declare gf_contract_id: number;
  declare operator_id: number;
  declare created_at: Date;
  declare updated_at: Date;
  // relation ships
  declare OperadorLandline?: AnyModel;
  declare GfContract?: AnyModel;
  declare User?: AnyModel;

  static associate(models: DatabaseModels) {
    OperadorLandlineHistory.belongsTo(models.User, {
      foreignKey: 'operator_id',
      targetKey: 'userId',
    });
    OperadorLandlineHistory.belongsTo(models.OperadorLandline);
    OperadorLandlineHistory.belongsTo(models.GfContract);
  }
}

export function init(sequelize: Sequelize) {
  OperadorLandlineHistory.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      action_type: {
        allowNull: false,
        type: DataTypes.STRING,
        defaultValue: ASSIGNABLE_HISTORY.ASSIGNED,
      },
      operador_landline_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      gf_contract_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      operator_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      created_at: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'OperadorLandlineHistory',
      schema: config('index.sequelize.intranet.database'),
      underscored: true,
    },
  );

  return OperadorLandlineHistory;
}
