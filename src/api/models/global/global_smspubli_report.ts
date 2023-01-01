import {
  CreationOptional,
  DataTypes,
  Model,
  Optional,
  Sequelize,
} from 'sequelize';
import config from '@config';

export class SmspubliReport extends Model {
  declare id: CreationOptional<number>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function init(sequelize: Sequelize) {
  SmspubliReport.init(
    {
      id: {
        type: DataTypes.STRING(255),
        primaryKey: true,
      },
      from: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      to: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      custom: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      sms_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
          'DELIVRD',
          'ACCEPTD',
          'EXPIRED',
          'DELETED',
          'UNDELIV',
          'UNKNOWN',
          'REJECTD',
        ),
        allowNull: false,
      },
      dlr_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'global_smspubli_report',
      timestamps: true,
      underscored: true,
      schema: config.get('index.sequelize.system.database'),
    },
  );

  return SmspubliReport;
}
