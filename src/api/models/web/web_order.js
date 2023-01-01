'use strict';
const { Model, Op } = require('sequelize');
const config = require('@config');

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Order.belongsTo(models.User, {
        foreignKey: 'user_processed_id',
        as: 'user_processed',
      });
    }
  }

  Order.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      web_id: {
        allowNull: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      procesed: {
        allowNull: true,
        type: DataTypes.BOOLEAN,
      },
      user_processed_id: {
        allowNull: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      status: {
        allowNull: true,
        type: DataTypes.ENUM('pending', 'checked', 'rejected'),
      },
      fiscal_id: {
        allowNull: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      fiscal_doc: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      user_type: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      delinternet_user: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      company_name: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      name: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      finger_print: {
        defaultValue: '{}',
        type: DataTypes.TEXT,
      },
      surname1: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      surname2: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      email: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      phone: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      address_auto_complete: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      region: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      city: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      postal_code: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      address_street: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      address_number: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      address_stairway: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      address_floor: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      address_door: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      address_lat: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      address_lng: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      service: {
        allowNull: false,
        type: DataTypes.TEXT,
        get: function () {
          return JSON.parse(this.getDataValue('service') || '{}');
        },
        set: function (value) {
          this.setDataValue('service', JSON.stringify(value));
        },
      },
      deletedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: 'Order',
      tableName: 'web_orders',
      timestamps: true,
      paranoid: true,
      schema: config.get('index.sequelize.system.database'),
      underscored: true,
    },
  );

  Order.searchUser = async (value, ...args) => {
    const searchString = `%${value.replace(/%/g, '')}%`;

    return {
      key: Op.or,
      where: {
        '$user_processed.first_name$': {
          [Op.like]: searchString,
        },
        '$user_processed.last_name$': {
          [Op.like]: searchString,
        },
        '$user_processed.email$': {
          [Op.like]: searchString,
        },
      },
    };
  };
  return Order;
};
