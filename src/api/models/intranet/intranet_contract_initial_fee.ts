import { DataTypes, Model, Sequelize } from 'sequelize';

import { DatabaseModels } from '@models';
import { get as config } from '@config';
import { firstPopulated } from '@api/utils/helpers';

export class ContractInitialFee extends Model {
  declare id: number;
  declare start_date: Date | null;
  declare end_date: Date | null;
  declare installments: number;
  declare discount: number;

  static associate(models: DatabaseModels) {
    // define the relationships here
    ContractInitialFee.belongsTo(models.GfContract);
    ContractInitialFee.belongsTo(models.InitialFee);
  }
}

export function init(sequelize: Sequelize) {
  ContractInitialFee.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      gf_contract_id: {
        allowNull: false,
        type: DataTypes.INTEGER.UNSIGNED,
      },
      initial_fee_id: {
        allowNull: false,
        type: DataTypes.INTEGER.UNSIGNED,
      },
      start_date: {
        allowNull: true,
        defaultValue: null,
        type: DataTypes.DATE,
        set(value) {
          this.setDataValue('start_date', firstPopulated([value]));
        },
      },
      end_date: {
        allowNull: true,
        defaultValue: null,
        type: DataTypes.DATE,
        set(value) {
          this.setDataValue('end_date', firstPopulated([value]));
        },
      },
      installments: {
        allowNull: true,
        defaultValue: null,
        type: DataTypes.INTEGER.UNSIGNED,
      },
      discount: {
        allowNull: true,
        defaultValue: null,
        type: DataTypes.FLOAT(10, 3),
        get() {
          return parseFloat(this.getDataValue('discount'));
        },
        set(value) {
          this.setDataValue('discount', parseFloat(value));
        },
      },
    },
    {
      sequelize,
      tableName: 'contract_initial_fee',
      modelName: 'ContractInitialFee',
      schema: config('index.sequelize.intranet.database'),
      timestamps: false,
      underscored: true,
    },
  );

  return ContractInitialFee;
}
