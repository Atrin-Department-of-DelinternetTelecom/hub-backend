import { AnyModel, DatabaseModels } from '@models';
import { DataTypes, Model, Sequelize } from 'sequelize';

import _ from 'lodash';

export class AireUploadHistory extends Model {
  declare id: number;
  declare document_id: number;
  declare user_id: number;
  declare success: boolean;
  declare error: string;
  declare uploaded_at: Date;
  // relationships
  declare document?: AnyModel;
  declare user?: AnyModel;

  static associate(models: DatabaseModels) {
    this.belongsTo(models.GfDoc, { foreignKey: 'document_id' });
  }
}

export function init(sequelize: Sequelize) {
  AireUploadHistory.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      document_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      success: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      error: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      uploaded_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
    },
    {
      sequelize,
      modelName: 'AireUploadHistory',
      tableName: 'aire_upload_histories',
      schema: 'intranet',
      timestamps: false,
    },
  );

  return AireUploadHistory;
}
