'use strict';

const { Op } = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const GfContractUnpaid = sequelize.define(
    'GfContractUnpaid',
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
      init: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      end: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      originalContractState: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      originalSectionState: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      totalsId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      downState: {
        type: DataTypes.ENUM('done', 'pending', 'revoked'),
        allowNull: true,
      },
      upState: {
        type: DataTypes.ENUM('done', 'pending'),
        allowNull: true,
      },
      alive: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      startReason: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      endReason: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      error: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      creationDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      updateDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'gf_contracts_unpaid',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',

      defaultScope: {
        ...intranet.defaultScope,
      },
      scopes: {
        getActivePerdiodsBetween(contractId, from, to) {
          return {
            where: {
              contractId,
              init: {
                [Op.lt]: to,
                [Op.ne]: null,
              },
              [Op.or]: [
                {
                  end: {
                    [Op.gt]: from,
                  },
                },
                {
                  end: {
                    [Op.eq]: null,
                  },
                },
              ],
              status: 1,
              uid: config.get('index.intranet.uid'),
            },
          };
        },
        alive: {
          where: {
            alive: 1,
          },
        },
        notAlive: {
          where: {
            alive: 0,
          },
        },
      },
      indexes: [
        {
          name: 'PRIMARY',
          unique: true,
          using: 'BTREE',
          fields: [
            {
              name: 'id',
            },
          ],
        },
      ],
    },
  );

  GfContractUnpaid.prototype.isBlocked = function () {
    return !this.isAlive();
  };

  GfContractUnpaid.prototype.isAlive = function () {
    return this.alive ? true : false;
  };

  return GfContractUnpaid;
};
