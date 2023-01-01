import { DatabaseModels } from '@models';
import { DataTypes, Model, Sequelize } from 'sequelize';

import _ from 'lodash';
import intranet from '@utils/intranet';

export class DiscountClientInfo extends Model {
  declare id: number;
  declare contractId: number;
  declare clientId: number;
  declare executedId: number;
  declare clientName: string;

  static associate(models: DatabaseModels) {}
}

export function init(sequelize: Sequelize) {
  DiscountClientInfo.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      targetContractId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      executedId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      clientName: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'DiscountClientInfo',
      tableName: 'discount_client_info_view',
      schema: 'intranet',
      timestamps: false,
      underscored: true,
    },
  );

  return DiscountClientInfo;
}
