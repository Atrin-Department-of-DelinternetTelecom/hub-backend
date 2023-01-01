import { AnyModel, DatabaseModels } from '@models';
import { DataTypes, Model, Sequelize } from 'sequelize';

import config from '@config';
import { deleteFile } from '@api/service/file/fileService';
import intranet from '@utils/intranet';
import { parse } from 'path';
import { snakeCase } from 'lodash';

export class GfClientDocument extends Model {
  declare id: number;
  declare name: string;
  declare file: string;
  declare clientId: number;
  declare conceptId: number;
  declare client?: AnyModel;

  static associate(models: DatabaseModels) {
    GfClientDocument.belongsTo(models.GfClientDocumentConcept, {
      foreignKey: 'conceptId',
      as: 'concept',
    });
    GfClientDocument.belongsTo(models.GfClient, {
      foreignKey: 'clientId',
      as: 'client',
    });
  }

  get downloadName(): string {
    const { ext } = parse(this.file);
    const name = snakeCase(
      `gfClient_document_${this.clientId}_${this.client?.name ?? this.name}`,
    );

    return `${name}${ext}`;
  }

  static get bucket(): string {
    return 'GfClientDocument';
  }

  /**
   * Delete old document if exists
   */
  async deleteOldFile() {
    if (this.previous('file')) {
      await deleteFile(this.previous('file'), GfClientDocument.bucket);
    }
  }

  async deleteFile() {
    if (this.file) {
      await deleteFile(this.file, GfClientDocument.bucket);
    }
  }

  /**
   * Determine file column  is not blank.
   */
  hasFile(): boolean {
    return this.file ? true : false;
  }

  transferConfig() {
    return {
      attribute: 'file',
      path: `mooisp/content1/clients/clientdocuments/${this.clientId}/${this.id}`,
      bucket: GfClientDocument.bucket,
    };
  }
}

export function init(sequelize: Sequelize) {
  GfClientDocument.init(
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
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      file: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      conceptId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
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
      tableName: 'gf_client_documents',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',

      defaultScope: { ...intranet.defaultScope },

      hooks: {
        async afterUpdate(model) {
          if (model.changed('file')) {
            await model.deleteOldFile();
          }
        },
      },

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

  return GfClientDocument;
}
