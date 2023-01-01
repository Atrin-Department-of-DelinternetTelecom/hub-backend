import { DataTypes, Model, Sequelize } from 'sequelize';

import { DatabaseModels } from '@models';
import type { Document } from '../global/global_document';

export class DataProtectionDocument extends Model {
  declare id: number;
  declare clientId: number;
  declare docId: number;
  declare doc: Document;
  declare creationDate: Date;
  declare updateDate: Date;

  static associate(models: DatabaseModels) {
    DataProtectionDocument.belongsTo(models.Document, {
      as: 'doc',
      foreignKey: 'docId',
    });
  }
}

export function init(sequelize: Sequelize) {
  DataProtectionDocument.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      docId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      creationDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updateDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'gf_data_protection_documents',
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      schema: 'intranet',
      timestamps: true,
    },
  );

  return DataProtectionDocument;
}
