'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const moment = require('moment');
const { isUserConnected } = require('@lib/socket');

const validTime = config.get('index.signaturePad.validTime');

/**
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @param {import('sequelize').DataTypes} DataTypes
 * @returns
 */
module.exports = function (sequelize, DataTypes) {
  const SignaturePad = sequelize.define(
    'SignaturePad',
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
        unique: true,
      },
      creator_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      login_as_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      // this is something like !is_deleted
      is_enable: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      is_online: {
        type: DataTypes.VIRTUAL,
        get() {
          return isUserConnected(String(this.login_as_id));
        },
      },
      is_busy: {
        type: DataTypes.VIRTUAL,
        get() {
          if (!this.sign_request_date) return false;
          const diff = moment(moment()).diff(this.sign_request_date, 'ms');
          return diff <= validTime;
        },
        set(value) {
          this.setDataValue('sign_request_date', value ? new Date() : null);
        },
      },
      sign_request_date: {
        type: DataTypes.DATE,
        allowNull: true,
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
      sequelize,
      tableName: 'global_signature_pads',
      timestamps: true,
      paranoid: true,
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

  SignaturePad.associate = function (models) {
    SignaturePad.belongsTo(models.User, {
      foreignKey: 'creator_id',
      as: 'creator',
    });
    SignaturePad.belongsTo(models.User, {
      foreignKey: 'login_as_id',
      as: 'login_as',
    });
  };
  return SignaturePad;
};
