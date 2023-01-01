'use strict';

const {
  SERVICE,
  FIX_CDR_TYPE,
  CDR_STATES,
} = require('@api/constants/contracts');
const { formatTime } = require('@api/utils/dates');
const { value } = require('@api/utils/helpers');
const config = require('@config');
const intranet = require('@utils/intranet');
const { Op } = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  const GfKamailioUnifiedCdr = sequelize.define(
    'GfKamailioUnifiedCdr',
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
      providerCdrId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      periodId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      pass: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      from: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      to: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      seconds: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      cost: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
      },
      computed: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      groupIds: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      callType: {
        type: DataTypes.STRING(5),
        allowNull: true,
      },
      finalPrice: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
      },
      userCharge: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
      },
      contractId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
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
      tableName: 'gf_kamailio_unified_cdr',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      defaultScope: {
        ...intranet.defaultScope,
      },
      schema: 'intranet',
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

  GfKamailioUnifiedCdr.prototype.toCdrResponse = function (contract) {
    return {
      id: this.id,
      uid: this.uid,
      date: this.date,
      status: this.status,
      creationDate: this.creationDate,
      updateDate: this.updateDate,
      fromNumber: this.from,
      toNumber: this.to,
      amount: this.seconds,
      amountFormatted: formatTime(this.seconds),
      callType: this.callType,
      type:
        contract.dataFix.number === this.to
          ? CDR_STATES.INCOME
          : CDR_STATES.OUTCOME,
      datetime: this.date,
      cost: this.cost,
    };
  };

  GfKamailioUnifiedCdr.searchFromNumber = (value, operator) => {
    return {
      key: 'from',
      where: {
        [operator]: value,
      },
    };
  };

  GfKamailioUnifiedCdr.searchToNumber = (value, operator) => {
    return {
      key: 'to',
      where: {
        [operator]: value,
      },
    };
  };

  GfKamailioUnifiedCdr.searchType = (value, operator, query) => {
    return {
      key: CDR_STATES.INCOME === value ? 'to' : 'from',
      where: query.number,
    };
  };

  GfKamailioUnifiedCdr.searchDatetime = (value, operator) => {
    return {
      key: 'date',
      where: {
        [operator]: value,
      },
    };
  };

  GfKamailioUnifiedCdr.orderByDatetime = (value, direction) => [
    'date',
    direction,
  ];

  return GfKamailioUnifiedCdr;
};
