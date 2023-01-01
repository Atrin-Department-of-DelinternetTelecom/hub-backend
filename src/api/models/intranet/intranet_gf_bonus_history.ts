import { AnyModel, DatabaseModels } from '@models';
import { Model, Sequelize } from 'sequelize';

import { BONUS } from '@api/constants/statuses';
import GfBonusHistoryFields from '@resources/intranet/fields/GfBonusHistory';
import intranet from '@utils/intranet';

export class GfBonusHistory extends Model {
  declare id: number;
  declare xrefId: number;
  declare bonoId: number;
  declare contractId: number;
  declare initDate: string;
  declare endDate: string;
  declare status: number;
  declare creationDate: Date;
  declare updateDate: Date;
  // relationships
  declare xref?: AnyModel;
  declare contract?: AnyModel;
  declare bonus?: AnyModel;
  declare user?: AnyModel;

  static associate(models: DatabaseModels) {
    GfBonusHistory.belongsTo(models.GfBonusFeegroupsXref, {
      foreignKey: 'xrefId',
      as: 'xref',
    });
    GfBonusHistory.belongsTo(models.GfContract, {
      foreignKey: 'contractId',
      as: 'contract',
    });
    GfBonusHistory.belongsTo(models.GfBonus, {
      foreignKey: 'bonoId',
      as: 'bonus',
    });
    GfBonusHistory.belongsTo(models.GfUser, {
      foreignKey: 'userId',
      targetKey: 'userId',
      as: 'user',
    });
  }
}

export function init(sequelize: Sequelize) {
  GfBonusHistory.init(
    new GfBonusHistoryFields().fieldCollection({}).toSequelizeConfig(),
    {
      sequelize,
      modelName: 'GfBonusHistory',
      tableName: 'gf_bonus_history',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',

      defaultScope: { ...intranet.defaultScope },
    },
  );

  return GfBonusHistory;
}
