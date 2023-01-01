//@ts-check
'use strict';

const GfContractFeeChangeFields = require('@resources/intranet/fields/GfContractFeeChange');
const intranet = require('@utils/intranet');
module.exports = function (sequelize, DataTypes) {
  const GfContractFeeChange = sequelize.define(
    'GfContractFeeChange',
    new GfContractFeeChangeFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      tableName: 'gf_contracts_fee_change',
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
        {
          name: 'contractIdIndex',
          unique: true,
          using: 'BTREE',
          fields: [{ name: 'contractId' }],
        },
      ],
    },
  );

  GfContractFeeChange.associate = function (models) {
    GfContractFeeChange.belongsTo(models.GfContract, {
      foreignKey: 'contractId',
      as: 'contract',
    });
  };

  return GfContractFeeChange;
};
