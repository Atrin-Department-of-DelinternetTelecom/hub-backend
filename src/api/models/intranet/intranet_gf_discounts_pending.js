'use strict';

const config = require('@config');
const intranet = require('@utils/intranet');
const crypto = require('crypto');
const { fn, col } = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  const GfDiscountsPending = sequelize.define(
    'GfDiscountsPending',
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
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      contractId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      matrixId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      ambiguos: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      key: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      used: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: '[]',
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
      },
      creationDate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      updateDate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'gf_discounts_pending',
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

  GfDiscountsPending.associate = function (models) {
    GfDiscountsPending.belongsTo(models.GfClient, {
      foreignKey: 'clientId',
      as: 'client',
    });
    GfDiscountsPending.belongsTo(models.GfContract, {
      foreignKey: 'contractId',
      as: 'contract',
    });
    GfDiscountsPending.belongsTo(models.GfDiscountsMatrix, {
      foreignKey: 'matrixId',
      as: 'matrix',
    });
  };

  GfDiscountsPending.getPossiblesByClientId = async (
    clientId,
    withAmbiguos = false,
  ) => {
    const { GfContract, GfDiscountsMatrix } = sequelize.models;
    const include = [
      {
        model: GfContract,
        as: 'contract',
      },
      {
        model: GfDiscountsMatrix,
        as: 'matrix',
      },
    ];
    const possibles = await GfDiscountsPending.findAll({
      where: {
        clientId,
        ambiguos: 0,
      },
      include,
    });

    return possibles.concat(
      withAmbiguos
        ? await GfDiscountsPending.getAmbiguosByClientId(clientId, include)
        : [],
    );
  };

  GfDiscountsPending.getAmbiguosByClientId = async (clientId, include = []) => {
    const used = [];
    const ambiguos = await GfDiscountsPending.selectAmbiguousFirst(
      clientId,
      include,
    );
    // the next filter will remove the discounts ( same target contract id ) that
    // have same actors (actors keeps in used json array)
    // return ambiguos.filter((possible) => {
    //   const key = crypto.createHash('md5').update(possible.used).digest('hex');

    //   return used.includes(key) ? false : Boolean(used.push(key));
    // });

    return ambiguos;
  };

  GfDiscountsPending.selectAmbiguousFirst = async (clientId, include = []) => {
    const ambiguoses = await GfDiscountsPending.findAll({
      where: {
        ambiguos: 1,
        clientId,
      },
      attributes: ['key', [fn('max', col('GfDiscountsPending.id')), 'maxId']],
      group: ['key'],
      raw: true,
      include: include.map((include) => {
        return {
          ...include,
          attributes: [],
        };
      }),
    });

    return GfDiscountsPending.findAll({
      where: {
        id: ambiguoses.map((item) => item.maxId),
      },
      include,
    });
  };

  return GfDiscountsPending;
};
