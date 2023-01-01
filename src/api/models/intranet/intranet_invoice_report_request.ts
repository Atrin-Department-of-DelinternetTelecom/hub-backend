import config from '@config';
import { DatabaseModels } from '@models';
import intranet from '@utils/intranet';
import { DataTypes, Model, Sequelize } from 'sequelize';

export class InvoiceReportRequest extends Model {
  declare id: number;
  declare uid: number;
  declare clientId: string;
  declare invoiceIds: string;
  declare toEmail: string;
  declare state: 'in_progress' | 'closed' | 'error';
  declare error: string | null;
  declare creationDate: Date;
  declare updateDate: Date;

  static associate(models: DatabaseModels) {}
}

export function init(sequelize: Sequelize) {
  InvoiceReportRequest.init(
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
        type: DataTypes.NUMBER,
        allowNull: false,
      },
      invoiceIds: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      toEmail: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      state: {
        type: DataTypes.ENUM('in_progress', 'completed', 'error'),
        allowNull: false,
        defaultValue: 'in_progress',
      },
      error: {
        type: DataTypes.STRING,
        allowNull: true,
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
      tableName: 'invoice_report_requests',
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

  return InvoiceReportRequest;
}
