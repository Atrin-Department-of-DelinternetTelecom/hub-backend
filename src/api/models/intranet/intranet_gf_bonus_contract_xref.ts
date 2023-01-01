import { AnyModel, DatabaseModels } from '@models';
import { Model, Sequelize } from 'sequelize';

import { BONUS } from '@api/constants/statuses';
import GfBonusContractXrefFields from '@resources/intranet/fields/GfBonusContractXref';
import intranet from '@utils/intranet';

export class GfBonusContractXref extends Model {
  declare id: number;
  declare contractId: number;
  declare bonoId: number;
  declare autoRenew: number | null;
  declare prorotable: number | null;
  declare state: string;
  declare userId: number;
  declare promotional: number | null;
  declare status: number;
  declare creationDate: Date;
  declare updateDate: Date;
  // relationships
  declare contract?: AnyModel;
  declare user?: AnyModel;
  declare bonus?: AnyModel;

  static associate(models: DatabaseModels) {
    GfBonusContractXref.belongsTo(models.GfContract, {
      foreignKey: 'contractId',
      as: 'contract',
    });
    GfBonusContractXref.belongsTo(models.GfUser, {
      foreignKey: 'userId',
      targetKey: 'userId',
      as: 'user',
    });
    GfBonusContractXref.belongsTo(models.GfBonus, {
      foreignKey: 'bonoId',
      as: 'bonus',
    });
  }

  async setAsDone() {
    return this.update({ state: BONUS.DONE });
  }

  async setAsPendingActivation() {
    return this.update({ state: BONUS.PENDING_ACTIVATION });
  }

  async setAsPendingDeactivation() {
    return this.update({ state: BONUS.PENDING_DEACTIVATION });
  }

  isPendingActivation() {
    return this.getDataValue('state') == BONUS.PENDING_ACTIVATION;
  }

  isPendingDeactivation() {
    return this.getDataValue('state') == BONUS.PENDING_DEACTIVATION;
  }

  isDone() {
    return this.getDataValue('state') == BONUS.DONE;
  }
}

export function init(sequelize: Sequelize) {
  GfBonusContractXref.init(
    new GfBonusContractXrefFields().fieldCollection({}).toSequelizeConfig(),
    {
      sequelize,
      modelName: 'GfBonusContractXref',
      tableName: 'gf_bonus_contract_xref',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',

      defaultScope: { ...intranet.defaultScope },

      scopes: {
        done: {
          where: {
            state: BONUS.DONE,
          },
        },
        pendingActivation: {
          where: {
            state: BONUS.PENDING_ACTIVATION,
          },
        },
        pendingDeactivation: {
          where: {
            state: BONUS.PENDING_DEACTIVATION,
          },
        },
      },
    },
  );

  return GfBonusContractXref;
}
