//@ts-check
'use strict';
const GfBonusScheduledField = require('@resources/intranet/fields/GfBonusScheduled');
const intranet = require('@utils/intranet');
const moment = require('moment');
const { Op } = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  const GfBonusScheduled = sequelize.define(
    'GfBonusScheduled',
    new GfBonusScheduledField().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      tableName: 'gf_bonus_scheduled',
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

  GfBonusScheduled.associate = function (models) {
    GfBonusScheduled.belongsTo(models.GfContract, {
      foreignKey: 'contractId',
      as: 'contract',
    });
    GfBonusScheduled.belongsTo(models.GfDiscountsExecuted, {
      foreignKey: 'executedId',
      as: 'executed',
    });
    GfBonusScheduled.belongsTo(models.GfBonusContractXref, {
      foreignKey: 'bonusContractXrefId',
      as: 'bonusContractXref',
    });
  };

  /**
   * SEARCH NOT ACTIVATED AND IN DATE
   *
   * @param {Number} contractId
   * @return {Promise<Array>}
   */
  GfBonusScheduled.inDates = async function (contractId) {
    return await GfBonusScheduled.findAll({
      where: {
        initDate: {
          [Op.lte]: moment().format('YYYY-MM-DD HH:mm:ss'),
        },
        endDate: {
          [Op.gte]: moment().format('YYYY-MM-DD HH:mm:ss'),
        },
        contractId: contractId,
      },
      include: [
        {
          model: sequelize.models.GfBonusContractXref.unscoped(),
          as: 'bonusContractXref',
          required: true,
          where: {
            [Op.or]: [{ id: null }, { status: 0 }],
          },
        },
      ],
    });
  };

  /**
   * SEARCH ACTIVATED AND OUT DATE
   *
   * @param {Number} contractId
   * @return {Promise<Array>}
   */
  GfBonusScheduled.outDates = async function (contractId) {
    return await GfBonusScheduled.findAll({
      where: {
        [Op.or]: [
          {
            initDate: {
              [Op.gt]: moment().format('YYYY-MM-DD HH:mm:ss'),
            },
          },
          {
            endDate: {
              [Op.lt]: moment().format('YYYY-MM-DD HH:mm:ss'),
            },
          },
        ],
        contractId: contractId,
      },
      include: [
        {
          model: sequelize.models.GfBonusContractXref,
          as: 'bonusContractXref',
          required: true,
          where: {
            id: {
              [Op.gt]: 0,
            },
          },
        },
      ],
    });
  };

  return GfBonusScheduled;
};
