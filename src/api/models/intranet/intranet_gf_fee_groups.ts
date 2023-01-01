import { AnyModel, DatabaseModels } from '@models';
import { DataTypes, Model, Op, Sequelize } from 'sequelize';

import _ from 'lodash';
import config from '@config';
import intranet from '@utils/intranet';

export class GfFeeGroup extends Model {
  declare id: number;
  declare uid: number;
  declare active: number;
  declare name: string;
  declare internalName: string;
  declare description: string;
  declare type: string | null;
  declare provider: string | null;
  declare status: boolean;
  declare creationDate: Date;
  declare updateDate: Date;
  declare sections?: AnyModel[];
  declare gf_fees?: AnyModel[];
  declare gf_active_fee?: AnyModel;

  isActive() {
    return Boolean(this.active);
  }

  async activate() {
    return this.update({ active: 1 });
  }

  async deactivate() {
    return this.update({ active: 0 });
  }

  static associate(models: DatabaseModels) {
    GfFeeGroup.hasMany(models.GfFee, {
      foreignKey: 'feeGroupId',
      as: 'gf_fees',
    });

    GfFeeGroup.hasOne(models.GfActiveFee, {
      foreignKey: 'feeGroupId',
      as: 'gf_active_fee',
    });

    GfFeeGroup.hasMany(models.GfBonusFeegroupsXref, {
      foreignKey: 'feeGroupId',
      as: 'gf_bonus',
    });

    GfFeeGroup.belongsToMany(models.GfFeegroupsLabel, {
      through: {
        model: models.GfFeegroupsLabelsXref,
        scope: _.get(intranet, 'defaultScope.where', {}),
      },
      foreignKey: 'feeGroupId',
      otherKey: 'labelId',
      as: 'labels',
      timestamps: false,
      //@ts-ignore
      unique: false,
    });

    GfFeeGroup.belongsToMany(models.GfFeegroupsGroupLabel, {
      through: {
        model: models.GfFeegroupsGroupLabelsXref,
        scope: _.get(intranet, 'defaultScope.where', {}),
      },
      foreignKey: 'feeGroupId',
      otherKey: 'labelId',
      as: 'groupLabels',
      timestamps: false,
      //@ts-ignore
      unique: false,
    });

    GfFeeGroup.hasMany(models.GfDiscountsMatrix, {
      foreignKey: 'feeGroupId',
      as: 'group_discounts',
    });

    GfFeeGroup.belongsToMany(models.GfSection, {
      through: {
        model: models.GfFeegroupsSectionsXref,
        scope: _.get(intranet, 'defaultScope.where', {}),
      },
      foreignKey: 'feeGroupId',
      otherKey: 'sectionId',
      as: 'sections',
      timestamps: false,
      //@ts-ignore
      unique: false,
    });

    GfFeeGroup.belongsToMany(models.GfBonus, {
      through: {
        model: models.GfBonusFeegroupsXref,
        scope: _.get(intranet, 'defaultScope.where', {}),
      },
      foreignKey: 'feeGroupId',
      otherKey: 'bonusId',
      as: 'bonuses',
      timestamps: false,
      //@ts-ignore
      unique: false,
    });
  }

  static async getCellActualFeeGroup(siglas: string | null = null) {
    // Attention: dont use the sequlize relationship to join next queries
    // because sequlize not wokring good on it and will throw error
    const gfFees = await this.sequelize!.models.GfFee.findAll({
      order: [['fromDate', 'desc']],
      attributes: ['id', 'feeGroupId'],
      include: [
        {
          model: this.sequelize!.models.GfCellProviderFee,
          as: 'cellProviderFees',
          required: true,
          where: {
            providerFeeId: siglas,
          },
          attributes: ['id'],
        },
      ],
    });

    return GfFeeGroup.findOne({
      order: [['active', 'desc']],
      where: {
        id: {
          [Op.in]: gfFees.map((gfFee: AnyModel) => gfFee.feeGroupId),
        },
      },
    });
  }

  static async searchFeeGroupName(value: string) {
    const likeString = `%${value}%`;

    return {
      key: Op.or,
      where: {
        name: {
          [Op.like]: likeString,
        },
        internalName: {
          [Op.like]: likeString,
        },
      },
    };
  }
}

export function init(sequelize: Sequelize) {
  GfFeeGroup.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      uid: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: config.get('index.intranet.uid'),
      },
      active: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      internalName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
      },
      creationDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      updateDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      type: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.sections?.[0]?.code ?? null;
        },
        set() {},
      },
      provider: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.gf_active_fee?.cellProvider?.code ?? null;
        },
        set() {},
      },
    },
    {
      sequelize,
      modelName: 'GfFeeGroup',
      tableName: 'gf_fee_groups',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      defaultScope: {
        ...intranet.defaultScope,
      },
    },
  );

  return GfFeeGroup;
}
