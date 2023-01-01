import { DataTypes, Model, Sequelize } from 'sequelize';

import { DatabaseModels } from '@models';
import config from '@config';

export class UserCalendar extends Model {
  declare id: number;
  declare user_id: number;
  declare color: string;
  declare pinned: boolean;
  declare selected_by_default: boolean;

  static associate(models: DatabaseModels) {
    UserCalendar.belongsTo(models.User);
  }
}

export function init(sequelize: Sequelize) {
  UserCalendar.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      color: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'black',
      },
      pinned: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      selected_by_default: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      tableName: 'user_calendars',
      modelName: 'UserCalendar',
      timestamps: false,
      paranoid: false,
      underscored: true,
      schema: config.get('index.sequelize.system.database'),
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

  return UserCalendar;
}
