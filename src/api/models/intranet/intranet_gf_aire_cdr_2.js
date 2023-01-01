'use strict';

const { CDR_STATES, AIRE_CDR_STATES } = require('@api/constants/contracts');
const { formatTime, formatFileSize } = require('@api/utils/dates');
const config = require('@config');
const intranet = require('@utils/intranet');
const { Op } = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  const GfAireCdr2 = sequelize.define(
    'GfAireCdr2',
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
      date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      serviceType: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      fecha: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      segundos: {
        type: DataTypes.INTEGER(12),
        allowNull: true,
        set(value) {
          if (parseInt(value) > 2147483647) {
            this.setDataValue('segundos', 2147483647);
          } else {
            this.setDataValue('segundos', value);
          }
        },
      },
      importe: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: true,
      },
      origen: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      destino: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      descripcion: {
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
      tableName: 'gf_aire_cdr_5',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      defaultScope: {
        ...intranet.defaultScope,
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

  GfAireCdr2.prototype.toCdrResponse = function (contract) {
    const income = this.destino === contract.dataCell.number;
    const type =
      CDR_STATES[this.serviceType] ??
      (income ? CDR_STATES.INCOME : CDR_STATES.OUTCOME);

    const formatter = {
      [CDR_STATES.INCOME]: formatTime,
      [CDR_STATES.OUTCOME]: formatTime,
      [CDR_STATES.DATOS]: formatFileSize,
      [CDR_STATES.SMS]: () => '-',
    };

    return {
      id: this.id,
      uid: this.uid,
      date: this.date,
      status: this.status,
      creationDate: this.creationDate,
      updateDate: this.updateDate,
      fromNumber: this.origen,
      toNumber: this.destino,
      amount: this.segundos,
      amountFormatted: formatter[type](this.segundos),
      serviceType: this.serviceType,
      type: type,
      datetime: this.fecha,
      cost: this.importe,
    };
  };

  GfAireCdr2.searchFromNumber = (value, operator) => {
    return {
      key: 'origen',
      where: {
        [operator]: value,
      },
    };
  };

  GfAireCdr2.searchToNumber = (value, operator) => {
    return {
      key: 'destino',
      where: {
        [operator]: value,
      },
    };
  };

  GfAireCdr2.searchType = (value, operator, query) => {
    if ([CDR_STATES.DATOS, CDR_STATES.SMS].includes(value)) {
      return {
        key: 'serviceType',
        where: CDR_STATES.DATOS ? AIRE_CDR_STATES.DATA : AIRE_CDR_STATES.SMS,
      };
    }

    return {
      key: Op.and,
      where: {
        serviceType: {
          [Op.in]: [AIRE_CDR_STATES.INCOME, AIRE_CDR_STATES.OUTCOME],
        },
        [CDR_STATES.INCOME === value ? 'destino' : 'origen']: query.number,
      },
    };
  };

  GfAireCdr2.searchDatetime = (value, operator) => {
    return {
      key: 'fecha',
      where: {
        [operator]: value,
      },
    };
  };

  GfAireCdr2.orderByDatetime = (value, direction) => ['fecha', direction];

  GfAireCdr2.searchCost = (value, operator) => {
    return {
      key: 'importe',
      where: {
        [operator]: value,
      },
    };
  };

  return GfAireCdr2;
};
