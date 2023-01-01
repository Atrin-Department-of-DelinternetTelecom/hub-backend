import {
  CreationOptional,
  DataTypes,
  Model,
  Optional,
  Sequelize,
} from 'sequelize';
import config from '@config';

export class PhoneOtp extends Model {
  declare id: CreationOptional<number>;
  public phone!: string;
  public code!: string;
  public verified!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function init(sequelize: Sequelize) {
  PhoneOtp.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
      tableName: 'global_phone_otp',
      timestamps: true,
      underscored: true,
      schema: config.get('index.sequelize.system.database'),
    },
  );

  return PhoneOtp;
}
