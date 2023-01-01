//@ts-check
'use strict';

const {
  CHNAGE_HOLDER_STATE_OPTION,
  CHNAGE_HOLDER_STATE,
} = require('@api/constants/statuses');
const config = require('@config');

const intranet = require('@utils/intranet');
module.exports = function (sequelize, DataTypes) {
  const GfContractHolderChange = sequelize.define(
    'GfContractHolderChange',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      uid: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: config.get('index.intranet.uid', 90),
      },
      contractId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      fromClientId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      toClientId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      changeDate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      state: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      stateOption: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
      },
      creationDate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      updateDate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      docId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        defaultValue: null,
      },
      provider_tracking_code: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      sequelize,
      tableName: 'gf_contracts_holder_change',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',

      defaultScope: { ...intranet.defaultScope },

      scopes: {
        inProgress: {
          where: {
            state: CHNAGE_HOLDER_STATE.INPROGRESS,
          },
        },
      },

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

  GfContractHolderChange.associate = function (models) {
    GfContractHolderChange.belongsTo(models.GfContract, {
      foreignKey: 'contractId',
      as: 'contract',
    });
    GfContractHolderChange.belongsTo(models.GfClient, {
      foreignKey: 'toClientId',
      as: 'toClient',
    });
    GfContractHolderChange.belongsTo(models.GfClient, {
      foreignKey: 'fromClientId',
      as: 'fromClient',
    });
    GfContractHolderChange.belongsTo(models.Document, {
      foreignKey: 'docId',
      as: 'document',
    });
  };

  GfContractHolderChange.prototype.isDone = function () {
    return this.state === CHNAGE_HOLDER_STATE.DONE;
  };

  GfContractHolderChange.prototype.inProgress = function () {
    return this.state === CHNAGE_HOLDER_STATE.INPROGRESS;
  };

  GfContractHolderChange.prototype.isPendingDocumentation = function () {
    return (
      this.stateOption === CHNAGE_HOLDER_STATE_OPTION.PENDING_DOCUMENTATION
    );
  };

  return GfContractHolderChange;
};
