import { AnyModel, DatabaseModels } from '@models';
import { BONUS_RULE, BONUS_TECHNOLOGY } from '@api/constants/contracts';
import { Model, Sequelize, Op } from 'sequelize';
import config from '@config';

import GfBonusFields from '@resources/intranet/fields/GfBonus';
import intranet from '@utils/intranet';

export class GfBonus extends Model {
  declare id: number;
  declare status: number;
  declare creationDate: Date;
  declare updateDate: Date;

  declare name: string;
  declare internalName: string | null;
  declare sectionId: number;
  declare providerCode: string;
  declare tpvCode: string | null;
  declare autoRenew: number | null;
  declare prorotable: number | null;
  declare acumulative: number | null;
  declare description: string | null;
  declare pvp: number;
  declare requireTechnicalAction: number | null;
  declare lineaPercentage: number | null;
  declare technologyAnalitic: BONUS_TECHNOLOGY | null;
  declare percentageRule: BONUS_RULE | null;
  declare capexType: number | null;
  declare opexValue: number | null;
  declare infraIp: number | null;
  declare importT: number | null;
  declare suportCor: number | null;
  declare internetMbIncluded: number | null;
  declare internetUpMbIncluded: number | null;
  declare internetIpFix: number | null;
  // relationships
  declare section?: AnyModel;
  declare feeGroups?: AnyModel[];
  declare labels?: AnyModel[];
  declare contracts?: AnyModel[];
  declare bonus_fix_value?: AnyModel[];

  static associate(models: DatabaseModels) {
    GfBonus.belongsTo(models.GfSection, {
      foreignKey: 'sectionId',
      as: 'section',
    });

    GfBonus.belongsToMany(models.GfBonoLabel, {
      through: {
        model: models.GfBonoLabelXref,
        scope: {
          status: {
            [Op.not]: config.get('index.intranet.deleteStatus'),
          },
        },
      },
      foreignKey: 'bonoId',
      otherKey: 'labelId',
      as: 'labels',
    });

    GfBonus.belongsToMany(models.GfFeeGroup, {
      through: {
        model: models.GfBonusFeegroupsXref,
        scope: intranet.defaultScope.where,
      },
      foreignKey: 'bonusId',
      otherKey: 'feeGroupId',
      as: 'feeGroups',
    });

    GfBonus.belongsToMany(models.GfContract, {
      through: {
        model: models.GfBonusContractXref,
        scope: intranet.defaultScope?.where ?? {},
      },
      foreignKey: 'bonoId',
      otherKey: 'contractId',
      as: 'contracts',
    });

    GfBonus.hasMany(models.GfBonosFixValues, {
      foreignKey: 'bonoId',
      as: 'bonus_fix_value',
    });
  }

  affectRadius() {
    return (
      this.getDataValue('internetMbIncluded') > 0 ||
      this.getDataValue('internetUpMbIncluded') > 0
    );
  }

  needTechnicalAction() {
    return Number(this.getDataValue('requireTechnicalAction')) === 1;
  }
}

export function init(sequelize: Sequelize) {
  GfBonus.init(new GfBonusFields().fieldCollection({}).toSequelizeConfig(), {
    sequelize,
    modelName: 'GfBonus',
    tableName: 'gf_bonus',
    schema: 'intranet',
    timestamps: true,
    createdAt: 'creationDate',
    updatedAt: 'updateDate',
    defaultScope: { ...intranet.defaultScope },
  });

  return GfBonus;
}
