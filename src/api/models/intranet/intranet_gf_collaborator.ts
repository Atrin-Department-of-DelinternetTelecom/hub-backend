import { AnyModel, DatabaseModels } from '@models';
import { DataTypes, Model, Sequelize } from 'sequelize';

import { get as config } from '@config';
import { defaultScope } from '@utils/intranet';

export class GfCollaborator extends Model {
  declare id: number;
  declare uid: number;
  declare status: number;
  declare name: string;
  declare master: boolean;
  declare comisionista: Date;
  declare comissionPercentage: number;
  declare creationDate: Date;
  declare updateDate: Date;
  // relationships
  crmEvents?: AnyModel[];

  static associate(models: DatabaseModels) {
    GfCollaborator.hasMany(models.GfCrmEvent, {
      foreignKey: 'collaboratorId',
      as: 'crmEvents',
    });
  }
}

export function init(sequelize: Sequelize) {
  GfCollaborator.init(
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
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      master: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        get() {
          return Boolean(this.getDataValue('master'));
        },
      },
      comisionista: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      comissionPercentage: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: true,
      },
      creationDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      updateDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'gf_collaborators',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      defaultScope,
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

  return GfCollaborator;
}
