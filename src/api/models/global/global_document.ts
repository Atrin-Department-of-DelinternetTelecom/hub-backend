import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from 'sequelize';

import type { DatabaseModels } from '@models';
import { DocumentView } from '@api/service/documents/types';
import config from '@config';

export class Document extends Model<
  InferAttributes<Document>,
  InferCreationAttributes<Document>
> {
  declare id: CreationOptional<number>;
  declare render_hash: CreationOptional<string | null>;
  declare signed: CreationOptional<boolean>;
  declare signatureUploadDate: CreationOptional<Date | null>;
  declare isSignatureUploaded: CreationOptional<boolean>;
  declare baseDataComplete: CreationOptional<boolean>;
  declare baseDataCompleteInfo: CreationOptional<null>;
  declare title: string;
  declare type: string;
  declare creatorId: number;
  declare deletedAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static associate(models: DatabaseModels) {
    Document.belongsTo(models.User, {
      foreignKey: 'creator_id',
      as: 'creator',
    });

    Document.hasOne(models.GfContractHolderChange, {
      foreignKey: 'docId',
    });
    Document.hasOne(models.ChangeBankNumber, {
      foreignKey: 'doc_id',
    });
    Document.hasOne(models.GrantPermission, {
      foreignKey: 'docId',
    });
    Document.hasOne(models.SuspendingAction, {
      foreignKey: 'doc_id',
    });
  }

  static toDocumentView(doc: Document): DocumentView {
    return {
      id: `del:${doc.id}`,
      type: doc.type,
      title: doc.title,
      signed: doc.signed,
      baseDataComplete: doc.baseDataComplete,
      baseDataCompleteInfo: doc.baseDataCompleteInfo ?? null,
      createdAt: doc.createdAt,
      isSignatureUploaded: doc.isSignatureUploaded,
    };
  }
}

export function init(sequelize: Sequelize): typeof Document {
  return Document.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      render_hash: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: '',
      },
      signed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      signatureUploadDate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      isSignatureUploaded: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      baseDataCompleteInfo: {
        type: DataTypes.VIRTUAL,
        get() {
          return null;
        },
      },
      baseDataComplete: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      creatorId: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'global_documents',
      timestamps: true,
      paranoid: true,
      underscored: true,
      schema: config.get('index.sequelize.system.database'),
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
}
