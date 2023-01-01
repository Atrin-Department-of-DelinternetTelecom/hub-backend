'use strict';
const { Model, Op, Sequelize } = require('sequelize');
const config = require('@config');
const moment = require('moment');

module.exports = (sequelize, DataTypes) => {
  class LandingPage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      LandingPage.belongsTo(models.User, {
        foreignKey: 'user_processed_id',
        as: 'user_processed',
      });
      LandingPage.belongsTo(models.GfClient, {
        foreignKey: 'client_id',
        as: 'client',
      });
    }

    getMetadata() {
      try {
        return JSON.parse(this.get('metadata')) ?? {};
      } catch (error) {
        return {};
      }
    }

    referredBy(referrer) {
      // check if are in the same landing
      if (referrer.landing !== this.landing) {
        return false;
      }

      const metadata = this.getMetadata();
      // without referrer info
      if (!metadata.referrer) {
        return false;
      }

      // check if referred by
      if (metadata.referrer !== referrer.getMetadata().referralCode) {
        return false;
      }
      // prevent self referrals
      if (
        this.email === referrer.email ||
        this.phone === referrer.phone ||
        this.id === referrer.id
      ) {
        return false;
      }
      // valid referral
      return true;
    }
  }

  LandingPage.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING(13),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      gift: {
        type: DataTypes.STRING(255),
        defaultValue: '',
        allowNull: false,
      },
      procesed: {
        allowNull: true,
        type: DataTypes.BOOLEAN,
      },
      user_processed_id: {
        allowNull: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      client_id: {
        allowNull: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      status: {
        allowNull: true,
        type: DataTypes.ENUM('pending', 'checked', 'rejected'),
      },
      metadata: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      landing: {
        type: DataTypes.TEXT,
        defaultValue: null,
        allowNull: true,
      },
      processedAt: {
        allowNull: true,
        type: DataTypes.DATE,
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
      modelName: 'LandingPage',
      tableName: 'web_landing_page',
      timestamps: true,
      paranoid: true,
      underscored: true,
      schema: config.get('index.sequelize.system.database'),
      hooks: {
        beforeSave: (model) => {
          if (model.changed('status')) {
            model.setDataValue(
              'processed_at',
              moment().format('YYYY-MM-DD HH:mm:ss'),
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

  LandingPage.searchUser = async (value, ...args) => {
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
  return LandingPage;
};
