import { DataTypes, Model, Sequelize } from 'sequelize';

import { DatabaseModels } from '@models';
import type { Document } from '../global/global_document';
import type { GfClient } from './intranet_gf_clients';

export class SepaDocument extends Model {
  declare id: number;
  declare clientId: number;
  declare docId: number;
  declare iban: string;
  declare bic: string;
  declare bicName: string;
  declare doc: Document;
  declare client: GfClient;

  static associate(models: DatabaseModels) {
    SepaDocument.belongsTo(models.Document, {
      as: 'doc',
      foreignKey: 'docId',
    });
    SepaDocument.belongsTo(models.GfClient, {
      as: 'client',
      foreignKey: 'clientId',
    });
  }
}

export function init(sequelize: Sequelize) {
  SepaDocument.init(
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
      iban: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      bic: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      bicName: {
        type: DataTypes.STRING(255),
        allowNull: true,
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
      tableName: 'gf_sepa_documents',
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      schema: 'intranet',
      timestamps: true,
    },
  );

  return SepaDocument;
}
