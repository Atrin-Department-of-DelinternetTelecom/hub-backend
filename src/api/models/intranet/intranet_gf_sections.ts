import { AnyModel, DatabaseModels } from '@models';
import { DataTypes, Model, Sequelize } from 'sequelize';

import { SERVICE } from '@api/constants/contracts';
import assert from 'assert';
import { get as config } from '@config';
import { defaultScope } from '@utils/intranet';

export class GfSection extends Model {
  declare id: number;
  declare uid: number;
  declare name: string;
  declare code: SERVICE;
  declare status: boolean;
  declare creationDate: Date;
  declare updateDate: Date;
  // realtions
  declare feeGroups?: AnyModel[];

  static associate(models: DatabaseModels) {
    GfSection.belongsToMany(models.GfFeeGroup, {
      through: {
        model: models.GfFeegroupsSectionsXref,
        scope: defaultScope?.where ?? {},
      },
      foreignKey: 'sectionId',
      otherKey: 'feeGroupId',
      as: 'feeGroups',
      //@ts-ignore
      unique: false,
    });
  }

  static async findByCode(code: string): Promise<AnyModel> {
    const section = await GfSection.findOne({
      where: { code: code.toUpperCase() },
    });
    assert(section, `${GfSection.name} with code:${code} not found.`);

    return section;
  }

  // Determines type of the section
  isCell() {
    return this.code === SERVICE.CELL;
  }
  isFix() {
    return this.code === SERVICE.FIX;
  }
  isInternet() {
    return this.code === SERVICE.INTERNET;
  }
  isTv() {
    return this.code === SERVICE.TV;
  }
}

export function init(sequelize: Sequelize) {
  GfSection.init(
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
        defaultValue: config('index.intranet.uid'),
      },
      name: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      code: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
      },
      creationDate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      updateDate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'gf_sections',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      defaultScope,
      scopes: {
        cell: {
          where: { code: SERVICE.CELL },
        },
        fix: {
          where: { code: SERVICE.FIX },
        },
        internet: {
          where: { code: SERVICE.INTERNET },
        },
        tv: {
          where: { code: SERVICE.TV },
        },
        code(code: SERVICE) {
          return { where: { code: code } };
        },
      },
      indexes: [
        {
          name: 'PRIMARY',
          unique: true,
          using: 'BTREE',
          fields: [
            {
              name: 'id',
            },
          ],
        },
      ],
    },
  );

  return GfSection;
}
