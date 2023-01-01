//@ts-check
'use strict';
const _ = require('lodash');
const GfSubscriberTypeFields = require('@resources/intranet/fields/GfSubscriberType');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const GfSubscriberType = sequelize.define(
    'GfSubscriberType',
    new GfSubscriberTypeFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      tableName: 'gf_subscriber_types',
      schema: 'intranet',
      timestamps: true,
      updatedAt: 'updateDate',
      createdAt: 'creationDate',

      defaultScope: { ...intranet.defaultScope },

      indexes: [
        {
          name: 'PRIMARY',
          unique: true,
          using: 'BTREE',
          fields: [{ name: 'id' }],
        },
        {
          name: 'aireNetworksCodeIndex',
          unique: true,
          using: 'BTREE',
          fields: [{ name: 'aireNetworksCode' }],
        },
      ],
    },
  );

  GfSubscriberType.prototype.indexByAireCode = async () => {
    const subscriberTypes = await GfSubscriberType.findAll({
      attributes: ['aireNetworksCode', 'id'],
    });

    return _.fromPairs(
      subscriberTypes.map((subscriberType) => {
        return [subscriberType.aireNetworksCode, subscriberType.id];
      }),
    );
  };

  return GfSubscriberType;
};
