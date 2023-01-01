'use strict';

import { CreationOptional, DataTypes, Model, Sequelize } from 'sequelize';

import Axes from '@api/service/3th-party/Axes';
import { DatabaseModels } from '@models';
import { USER_TYPE } from '@api/constants/enum';
import config from '@config';
import to from 'await-to-js';

export class User extends Model {
  declare id: CreationOptional<number>;
  declare email: string;
  declare username: string;
  declare name: string;
  declare password: string;
  declare userId: number;
  declare user_type: string;
  declare gf_user_id: number;
  declare crm_user_id: number;
  declare enable: CreationOptional<boolean>;
  declare collaboratorId: number;
  declare gf_user?: Model;

  static associate(models: DatabaseModels) {
    User.hasMany(models.EmployeeCertification, {
      foreignKey: 'employee_id',
      as: 'certification',
    });
    User.hasMany(models.Notification, {
      foreignKey: 'owner_id',
      as: 'notification',
    });
    User.hasMany(models.EmployeeContact, {
      foreignKey: 'employee_id',
      as: 'contact',
    });
    User.hasMany(models.EmployeeEducation, {
      foreignKey: 'employee_id',
      as: 'education',
    });
    User.hasMany(models.EmployeeLanguage, {
      foreignKey: 'employee_id',
      as: 'language',
    });
    User.hasOne(models.EmployeeBasicInformation, {
      foreignKey: 'employee_id',
      as: 'basic_information',
    });
    User.hasMany(models.TimeRecord, {
      foreignKey: 'user_id',
      as: 'timeRecords',
    });
    User.hasMany(models.Payroll, { foreignKey: 'employee_id', as: 'payroll' });
    User.hasMany(models.Signature, {
      foreignKey: 'owner_id',
      as: 'signatures',
    });
    User.hasMany(models.TimeSheet, {
      foreignKey: 'owner_id',
      as: 'time_sheets',
    });
    User.hasMany(models.Vacation, { foreignKey: 'owner_id', as: 'vacations' });
    User.hasMany(models.UserDocs, { foreignKey: 'owner_id', as: 'docs' });
    User.hasMany(models.Message, {
      foreignKey: 'from_user_id',
      as: 'send_messages',
    });
    User.hasMany(models.Message, {
      foreignKey: 'to_user_id',
      as: 'recived_messages',
    });
    User.hasOne(models.SignaturePad, {
      foreignKey: 'login_as_id',
      as: 'signature_pad',
    });
    User.belongsTo(models.CrmUser, {
      foreignKey: 'email',
      targetKey: 'email',
      as: 'crm_user',
    });
    User.belongsTo(models.GfUser, {
      foreignKey: 'email',
      targetKey: 'email',
      as: 'gf_user',
    });
    User.belongsTo(models.MoozaicUser, {
      foreignKey: 'email',
      targetKey: 'email',
      as: 'moozaic_user',
    });
    User.hasMany(models.Location, {
      foreignKey: 'locationable_id',
      constraints: false,
      scope: {
        locationable_type: 'global_users',
      },
      as: 'locations',
    });
    User.hasMany(models.StaffFingerPrint, {
      foreignKey: 'user_id',
      as: 'finger_prints',
    });

    User.hasMany(models.LocationHistory, {
      foreignKey: 'routeable_id',
      constraints: false,
      scope: {
        routeable_type: 'global_users',
      },
      as: 'routes',
    });
    User.belongsToMany(models.Skill, {
      through: 'hrms_employee_skill',
      as: 'skills',
      foreignKey: 'employee_id',
    });
    User.belongsToMany(models.Vehicle, {
      through: 'hrms_vehicle_driver',
      as: 'vehicles',
      foreignKey: 'driver_id',
    });
    /* User.hasMany(models.ClosetUser, {
      as: "owners",
      foreignKey: "owner_id",
    }) */
    User.belongsToMany(models.Closet, {
      through: models.ClosetUser,
      foreignKey: 'owner_id',
      as: 'closets',
    });

    User.belongsToMany(models.AclRole, {
      through: {
        model: models.AclUserRole,
        scope: { deletedAt: null },
      },
      foreignKey: 'user_id',
      otherKey: 'role_id',
      as: 'role_item',
    });

    User.hasMany(models.AclUserRole, {
      foreignKey: 'user_id',
      as: 'role_item_associate',
    });
    User.hasOne(models.UserCalendar, {
      foreignKey: 'user_id',
      as: 'calendar',
    });
  }

  async updateAxesUser() {
    return Axes.updateUser([
      {
        email: this.email,
        username: this.username,
        password: this.password,
        user_id: this.userId,
        enable: Number(this.enable),
      },
    ]);
  }
}

export function init(sequelize: Sequelize) {
  User.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      first_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
        set() {
          throw new Error('name column is calculated');
        },
      },
      username: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      avatar_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      avatar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email_verified_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      dni: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      enable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      remember_token: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      reset_password_token: {
        type: DataTypes.STRING(128),
        allowNull: true,
      },
      reset_password_expire: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      reset_password_token_used: {
        type: DataTypes.BOOLEAN,
      },
      userId: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      user_type: {
        type: DataTypes.ENUM(...Object.values(USER_TYPE)),
        defaultValue: USER_TYPE.CLIENT,
      },
      gf_user_id: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      crm_user_id: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      collaboratorId: {
        type: DataTypes.VIRTUAL,
        defaultValue: null,
        get: function () {
          return this.gf_user?.collaboratorId ?? null;
        },
        set: () => {},
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
      defaultScope: {
        attributes: {
          exclude: [
            'email_verified_at',
            'password',
            'remember_token',
            'reset_password_token',
            'reset_password_expire',
            'reset_password_token_used',
          ],
        },
      },
      scopes: {
        securityScope: {
          attributes: { exclude: [] },
        },
      },
      sequelize,
      tableName: 'global_users',
      timestamps: true,
      paranoid: true,
      underscored: true,
      schema: config.get('index.sequelize.system.database'),
      hooks: {
        afterUpdate: async (user) => {
          const changed = user.changed();
          if (Array.isArray(changed) && changed.includes('password')) {
            const [error] = await to(user.updateAxesUser());

            if (error) {
              console.error(
                `Failed to update AXES user for user [${user.id}]: ${error.message}`,
              );
            } else {
              console.info(`AXES user for user [${user.id}] updated`);
            }
          } else {
            console.info(
              `There is nothing to change for user [${user.id}] on axes`,
            );
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
  return User;
}
