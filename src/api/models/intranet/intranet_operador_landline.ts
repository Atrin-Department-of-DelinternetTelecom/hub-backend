import { AnyModel, DatabaseModels } from '@models';
import { DataTypes, Model, Sequelize } from 'sequelize';

import { ASSIGNABLE } from '@api/constants/statuses';
import { StatusEnum } from '@api/service/intranet/OperadorFixFacade';
import { get as config } from '@config';
import { firstPopulated } from '@api/utils/helpers';

export class OperadorLandline extends Model {
  declare id: number;
  declare number: number;
  declare fiscal_id: string | null;
  declare owner: string | null;
  declare provider: string | null;
  declare revenedor: string | null;
  declare operador_fiscal_id: string | null;
  declare gf_contract_id: number | null;
  declare state: string | null;
  declare portability: string | null;
  declare created_at: Date;
  declare updated_at: Date;
  // relation ships
  declare GfContract?: AnyModel;
  declare client?: AnyModel;

  static associate(models: DatabaseModels) {
    OperadorLandline.belongsTo(models.GfContract);
    OperadorLandline.belongsTo(models.GfClient, {
      as: 'client',
      foreignKey: 'fiscal_id',
      targetKey: 'fiscalId',
    });
  }

  ownerFiscalId() {
    return firstPopulated([this.operador_fiscal_id, this.fiscal_id]);
  }

  isConsolidated() {
    return this.portability === 'CONSOLIDATED';
  }

  isDenied() {
    return this.portability === 'DENIED_BY_DONOR';
  }
}

export function init(sequelize: Sequelize) {
  OperadorLandline.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      number: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      fiscal_id: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      operador_fiscal_id: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      owner: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      provider: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      revenedor: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      gf_contract_id: {
        allowNull: true,
        type: DataTypes.INTEGER.UNSIGNED,
      },
      state: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ASSIGNABLE.ASSIGNABLE,
      },
      portability: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'operador_landlines',
      schema: config('index.sequelize.intranet.database'),
      timestamps: true,
      underscored: true,
      indexes: [
        {
          name: 'PRIMARY',
          unique: true,
          using: 'BTREE',
          fields: [{ name: 'id' }],
        },
      ],
    },
  );

  return OperadorLandline;
}
