import { AnyModel, DatabaseModels } from '@models';
import { DataTypes, Model, Op, Sequelize, literal } from 'sequelize';

import type { DocStatus } from './intranet_docs_status';
import { DocumentView } from '@api/service/documents/types';
import _ from 'lodash';
import config from '@config';
import intranet from '@utils/intranet';
import { intranet as knex } from '@lib/knex';

export class GfDoc extends Model {
  declare id: number;
  declare uid: number;
  declare type: string;
  declare file: string;
  declare clientId: number;
  declare contractId: number | null;
  declare aireType: string | null;
  declare uploadHistory: any[];
  declare aire: any;
  declare comments: string | null;
  declare reason: string | null;
  declare status: boolean;
  declare creationDate: Date;
  declare updateDate: Date;
  declare statuses: [DocStatus]; // only has one element
  declare docStatus: DocStatus; // only has one element
  declare history: AnyModel[];

  hasFile() {
    return !!this.getFile();
  }

  getFile() {
    return this.file;
  }

  filePath() {
    if (!this.file) return null;
    return this.fileDirectory() + '/' + this.file;
  }

  fileDirectory() {
    return (
      this.rootDirectory() +
      '/' +
      this.uid +
      '/' +
      this.type +
      '/' +
      this.clientId +
      '/' +
      this.id
    );
  }

  rootDirectory() {
    return config.get(
      'index.intranet.doc_path.gf_docs',
      'mooisp/content1/intellidocs',
    );
  }

  assetName() {
    return `${this.type}-${this.clientId}`;
  }

  static associate(models: DatabaseModels) {
    GfDoc.belongsTo(models.GfContract, {
      foreignKey: 'contractId',
      as: 'contract',
    });
    GfDoc.belongsTo(models.GfClient, {
      foreignKey: 'clientId',
      as: 'client',
    });
    GfDoc.hasMany(models.DocStatus, {
      foreignKey: 'typeId',
      as: 'statuses',
    });
    GfDoc.hasOne(models.DocStatus, {
      foreignKey: 'typeId',
      as: 'docStatus',
    });
    GfDoc.hasMany(models.AireUploadHistory, {
      foreignKey: 'document_id',
      as: 'history',
    });
  }

  static async searchContractType(value: string | string[]) {
    const subQuery = knex('intranet.gf_contracts AS x')
      .select(1)
      .join(
        'intranet.gf_feegroups_sections_xref AS gfsx',
        'gfsx.feeGroupId',
        '=',
        'x.feeGroupId',
      )
      .join('intranet.gf_sections AS gs', 'gs.id', '=', 'gfsx.sectionId')
      .where('gs.code', 'in', knex.raw('?', [value]))
      .where('x.status', '=', 1)
      .where('x.id', '=', knex.raw('GfDoc.contractId'))
      .toQuery();

    return {
      key: Op.and,
      where: literal(`EXISTS (${subQuery})`),
    };
  }

  static toDocumentView(doc: GfDoc): DocumentView {
    return {
      id: `gf-doc:${doc.id}`,
      type: doc.type,
      title: doc.docStatus.title ?? '',
      signed: doc.docStatus.signed,
      baseDataComplete: doc.docStatus.baseDataComplete,
      baseDataCompleteInfo: toStandardBaseDataCompleteInfo(doc.docStatus),
      createdAt: doc.creationDate,
      isSignatureUploaded: !!doc.docStatus.signatureUploadedDate,
    };
  }
}

export function init(sequelize: Sequelize) {
  GfDoc.init(
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
      type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      file: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      contractId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      aireType: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      uploadHistory: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const value = this.getDataValue('uploadHistory') || '[]';
          try {
            return JSON.parse(value);
          } catch (e) {
            // statements
            console.log(e!.toString(), value);
            return [];
          }
        },
        set(value) {
          this.setDataValue(
            'uploadHistory',
            typeof value === 'object' && value !== null
              ? JSON.stringify(value)
              : value,
          );
        },
      },
      comments: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
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
      tableName: 'gf_docs',
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

  return GfDoc;
}

export const toStandardBaseDataCompleteInfo = (docStatus: DocStatus) => {
  const info = docStatus.baseDataCompleteInfo;
  if (!info) return null;
  if (typeof info === 'string') return info;
  if (info.success) return null;
  return info.reason;
};
