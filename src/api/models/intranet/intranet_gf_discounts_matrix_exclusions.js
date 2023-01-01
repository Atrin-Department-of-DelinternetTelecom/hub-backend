'use strict';

const config = require('@config');
const intranet = require('@utils/intranet');
const _ = require('lodash');
const { Op } = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  const GfDiscountsMatrixExclusion = sequelize.define(
    'GfDiscountsMatrixExclusion',
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
      matrixId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      excludedMatrixId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
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
      tableName: 'gf_discounts_matrix_exclusions',
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

  GfDiscountsMatrixExclusion.associate = function (models) {
    GfDiscountsMatrixExclusion.belongsTo(models.GfDiscountsMatrix, {
      foreignKey: 'matrixId',
      as: 'matrix',
    });
    GfDiscountsMatrixExclusion.belongsTo(models.GfDiscountsMatrix, {
      foreignKey: 'excludedMatrixId',
      as: 'excludedMatrix',
    });
  };

  /**
   * Group GfDiscountsMatrixExclusion by matrix id.
   *
   * @returns {Promise<Object<string, GfDiscountsMatrixExclusion[]>>}
   */
  GfDiscountsMatrixExclusion.prototype.groupByMatrixId = async () => {
    return _.groupBy(await GfDiscountsMatrixExclusion.findAll(), 'matrixId');
  };

  return GfDiscountsMatrixExclusion;
};
