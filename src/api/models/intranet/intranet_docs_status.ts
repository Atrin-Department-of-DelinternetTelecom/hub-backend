import { AnyModel, DatabaseModels } from '@models';
import { DataTypes, Model, Sequelize } from 'sequelize';

import config from '@config';
import intranet from '@utils/intranet';
import { jsonSetterAndGetter } from '@utils/sequelize';

export class DocStatus extends Model {
  declare id: number;
  declare uid: number;
  declare title: string | null;
  declare type: string;
  declare typeId: number;
  declare signed: boolean;
  declare onlyUpload: boolean;
  declare imageSignature: string | null;
  declare signatureUploadedDate: Date | null;
  declare renderHash: string | null;
  declare baseDataComplete: boolean;
  declare baseDataCompleteInfo:
    | string
    | { success: true }
    | { success: false; reason: string };

  declare pdfInfo: any;
  declare status: boolean;
  declare creationDate: Date;
  declare updateDate: Date;
  // relationships
  declare GfDoc?: AnyModel;

  static associate(models: DatabaseModels) {
    DocStatus.belongsTo(models.GfDoc, { foreignKey: 'typeId' });
  }

  imageSignaturePath(): string | null {
    if (!this.imageSignature) return null;
    return this.imageSignatureDirectory() + '/' + this.imageSignature;
  }

  imageSignatureDirectory(): string {
    return this.rootDirectory() + `/${this.uid}/${this.id}`;
  }

  rootDirectory(): string {
    return config.get(
      'intranet.signature_path.docs_status',
      'documents/content/signatures',
    );
  }
}

export function init(sequelize: Sequelize) {
  DocStatus.init(
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
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      typeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      signed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      onlyUpload: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      imageSignature: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      signatureUploadedDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      renderHash: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      baseDataComplete: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      baseDataCompleteInfo: {
        type: DataTypes.TEXT,
        allowNull: true,
        ...jsonSetterAndGetter({
          name: 'baseDataCompleteInfo',
          defaultValue: null,
        }),
      },

      pdfInfo: {
        type: DataTypes.TEXT,
        allowNull: true,
        ...jsonSetterAndGetter({
          name: 'pdfInfo',
          defaultValue: null,
        }),
      },
      status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
      tableName: 'docs_status',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',

      defaultScope: { ...intranet.defaultScope },

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

  return DocStatus;
}
