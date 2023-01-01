import { DataTypes, Model, Sequelize } from 'sequelize';

import { DatabaseModels } from '@models';
import config from '@config';
import { deleteFile } from '@api/service/file/fileService';
import intranet from '@utils/intranet';
import { parse } from 'path';
import { snakeCase } from 'lodash';

export class GfInstallationEvaluationForm extends Model {
  declare id: number;
  declare uid: number;
  declare contractId: number;
  declare routerAtPlace: number;
  declare inOutCheck: number;
  declare velocityTest: number;
  declare particularitiesText: string;
  declare evaluatorName: string;
  declare evaluatorPhone: string;
  declare forIncidenceName: string;
  declare forIncidencePhone: string;
  declare evaluatorPuntuation: number;
  declare evaluatorComments: string;
  declare cableMeters: string;
  declare box: string;
  declare email: string;
  declare signature: string;
  declare status: boolean;
  declare creationDate: Date;
  declare updateDate: Date;

  static associate(models: DatabaseModels) {
    GfInstallationEvaluationForm.belongsTo(models.GfContract, {
      foreignKey: 'contractId',
      as: 'contract',
    });
  }

  /**
   * Determine signature column  is not blank.
   *
   * @return {Boolean} [description]
   */
  hasImage() {
    return this.getImage() ? true : false;
  }

  /**
   * Get signature signature name.
   *
   * @return boolean
   */
  getImage() {
    return this.signature;
  }

  get downloadName(): string {
    const { ext } = parse(this.signature);
    const name = snakeCase(
      `gf_installation_evaluation_form_${this.contractId}`,
    );

    return `${name}${ext}`;
  }

  static get bucket(): string {
    return 'GfInstallationEvaluationForm/Signature';
  }

  /**
   * Delete old document if exists
   */
  async deleteOldSignature() {
    if (this.previous('signature')) {
      await deleteFile(
        this.previous('signature'),
        GfInstallationEvaluationForm.bucket,
      );
    }
  }

  async deleteSignature() {
    if (this.signature) {
      await deleteFile(this.signature, GfInstallationEvaluationForm.bucket);
    }
  }

  transferConfig() {
    return {
      attribute: 'signature',
      path: `mooisp/content1/evaluation/signatures/${this.uid}/${this.id}`,
      bucket: GfInstallationEvaluationForm.bucket,
    };
  }
}

export function init(sequelize: Sequelize) {
  GfInstallationEvaluationForm.init(
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
      contractId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      routerAtPlace: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      inOutCheck: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      velocityTest: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      particularitiesText: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      evaluatorName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      evaluatorPhone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      forIncidenceName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      forIncidencePhone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      evaluatorPuntuation: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      evaluatorComments: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      cableMeters: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      box: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      signature: {
        type: DataTypes.STRING,
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
      tableName: 'gf_installation_evaluation_form',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',

      defaultScope: { ...intranet.defaultScope },

      hooks: {
        async afterUpdate(model) {
          if (model.changed('signature')) {
            await model.deleteOldSignature();
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

  return GfInstallationEvaluationForm;
}
