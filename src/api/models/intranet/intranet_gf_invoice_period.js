'use strict';
const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const GfInvoicePeriod = sequelize.define(
    'GfInvoicePeriod',
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
      period: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      state: {
        type: DataTypes.ENUM(
          'pending',
          'in_progress',
          'done',
          'error',
          'preparing',
          'prepared',
          'throwbacking',
        ),
        defaultValue: 'pending',
        allowNull: true,
      },
      aireResumenDownloaded: {
        type: DataTypes.ENUM('pending', 'in_progress', 'done', 'error'),
        allowNull: true,
        set: function (value) {
          if (!value) {
            this.setDataValue('aireResumenDownloaded', null);
          } else {
            this.setDataValue('aireResumenDownloaded', value);
          }
        },
      },
      aireDesgloseDownloaded: {
        type: DataTypes.ENUM('pending', 'in_progress', 'done', 'error'),
        allowNull: true,
        set: function (value) {
          if (!value) {
            this.setDataValue('aireDesgloseDownloaded', null);
          } else {
            this.setDataValue('aireDesgloseDownloaded', value);
          }
        },
      },
      lemonResumenDownloaded: {
        type: DataTypes.ENUM('pending', 'in_progress', 'done', 'error'),
        allowNull: true,
        set: function (value) {
          if (!value) {
            this.setDataValue('lemonResumenDownloaded', null);
          } else {
            this.setDataValue('lemonResumenDownloaded', value);
          }
        },
      },
      fixCdrEdgesDone: {
        type: DataTypes.ENUM('pending', 'in_progress', 'done', 'error'),
        allowNull: true,
        set: function (value) {
          if (!value) {
            this.setDataValue('fixCdrEdgesDone', null);
          } else {
            this.setDataValue('fixCdrEdgesDone', value);
          }
        },
      },
      controlRows: {
        type: DataTypes.ENUM('pending', 'in_progress', 'done', 'error'),
        allowNull: true,
        set: function (value) {
          if (!value) {
            this.setDataValue('controlRows', null);
          } else {
            this.setDataValue('controlRows', value);
          }
        },
      },
      invoicesState: {
        type: DataTypes.ENUM('in_progress', 'pending', 'done'),
        allowNull: true,
        set: function (value) {
          if (!value) {
            this.setDataValue('invoicesState', null);
          } else {
            this.setDataValue('invoicesState', value);
          }
        },
      },
      issuedState: {
        type: DataTypes.ENUM('in_progress', 'pending', 'done'),
        allowNull: true,
        set: function (value) {
          if (!value) {
            this.setDataValue('issuedState', null);
          } else {
            this.setDataValue('issuedState', value);
          }
        },
      },
      emailsState: {
        type: DataTypes.ENUM('in_progress', 'pending', 'done'),
        allowNull: true,
        set: function (value) {
          if (!value) {
            this.setDataValue('emailsState', null);
          } else {
            this.setDataValue('emailsState', value);
          }
        },
      },
      fixCdrExcel: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      errors: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      emailSubject: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      senderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      fromName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      testMail: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      transitUnitPrice: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      transportUnitPrice: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      infraIpUnitPrice: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      opexUnitPrice: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      supportUnitPrice: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      guifiRadioStructureUnitPrice: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      liquidationDateInit: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      liquidationDateEnd: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      totals: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      Invoice_GfPeriodsManager_controlRows: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
      },
      Invoice_GfPeriodsManager_controlRowsTanda: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
      },
      GfPreparativesAire: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
      },
      GfPreparativesLemon: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
      },
      Invoice_FixEdges: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
      },
      Invoice_GfPeriodsManager_progress: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
      },
      Invoice_GfPeriodsManager_progress_errors: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
      },
      Invoice_GfPeriodsManager_progress_invoice_cueued: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
      },
      Invoice_GfPeriodsManager_progress_issued: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
      },
      Invoice_GfPeriodsManager_progress_issued_errors: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
      },
      Invoice_GfPeriodsManager_progress_mail: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
      },
      Invoice_GfPeriodsManager_progress_mail_errors: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
      },
      Invoice_GfPeriodsManager_progress_issued_cueued: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
      },
      Invoice_GfPeriodsManager_progress_aire_invocie_line: {
        type: DataTypes.VIRTUAL,
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
      tableName: 'gf_invoice_periods',
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

  GfInvoicePeriod.associate = function (models) {
    GfInvoicePeriod.hasOne(models.Bulk, {
      foreignKey: 'model_id',
      constraints: false,
      scope: {
        model_name: 'gf_invoice_periods:consolideAire',
      },
      as: 'build_aire_progress',
    });

    GfInvoicePeriod.hasOne(models.Bulk, {
      foreignKey: 'model_id',
      constraints: false,
      scope: {
        model_name: 'gf_invoice_periods:build-control',
      },
      as: 'build_control_progress',
    });

    GfInvoicePeriod.hasOne(models.Bulk, {
      foreignKey: 'model_id',
      constraints: false,
      scope: {
        model_name: 'gf_invoice_periods:invoiceControlRow',
      },
      as: 'invoice_control_progress',
    });

    GfInvoicePeriod.hasOne(models.Bulk, {
      foreignKey: 'model_id',
      constraints: false,
      scope: {
        model_name: 'gf_invoice_periods:throwbackInvoiceControlRow',
      },
      as: 'throwback_invoice_control_progress',
    });

    GfInvoicePeriod.hasOne(models.Bulk, {
      foreignKey: 'model_id',
      constraints: false,
      scope: {
        model_name: 'gf_invoice_periods:issueInvoiceControlRow',
      },
      as: 'issue_invoice_control_progress',
    });

    GfInvoicePeriod.belongsTo(models.MoozaicMailSender, {
      foreignKey: 'senderId',
      as: 'sender',
    });

    GfInvoicePeriod.hasOne(models.Bulk, {
      foreignKey: 'model_id',
      constraints: false,
      scope: {
        model_name: 'gf_invoice_periods:setEdgesFix',
      },
      as: 'set_edges_progress',
    });

    GfInvoicePeriod.addHook('afterFind', async (results, query) => {
      if (!results) return;

      if (!Array.isArray(results)) {
        results = [results];
      }

      const CounterService = require('../../service/global/CounterService');

      const keys = [];
      for (const result of results) {
        keys.push(
          `Invoice_GfPeriodsManager_controlRows_${result.id}`,
          `Invoice_GfPeriodsManager_controlRowsTanda_${result.id}`,
          `Invoice_GfPeriodsManager_progress_${result.id}`,
          `Invoice_GfPeriodsManager_progress_errors_${result.id}`,
          `Invoice_GfPeriodsManager_progress_invoice_cueued_${result.id}`,
          `Invoice_GfPeriodsManager_progress_issued_${result.id}`,
          `Invoice_GfPeriodsManager_progress_issued_errors_${result.id}`,
          `Invoice_GfPeriodsManager_progress_issued_cueued_${result.id}`,
          `Invoice_GfPeriodsManager_progress_aire_invocie_line_${result.id}`,
          `GfPreparativesAire_${result.id}`,
          `GfPreparativesLemon_${result.id}`,
          `Invoice_FixEdges_${result.id}`,
          `Invoice_GfPeriodsManager_progress_mail_${result.id}`,
          `Invoice_GfPeriodsManager_progress_mail_errors_${result.id}`,
        );
      }

      const values = await CounterService.getCounters(keys);

      for (const result of results) {
        result.Invoice_GfPeriodsManager_controlRowsTanda =
          values[`Invoice_GfPeriodsManager_controlRowsTanda_${result.id}`];

        result.Invoice_GfPeriodsManager_controlRows =
          values[`Invoice_GfPeriodsManager_controlRows_${result.id}`];

        result.Invoice_GfPeriodsManager_progress =
          values[`Invoice_GfPeriodsManager_progress_${result.id}`];

        result.Invoice_GfPeriodsManager_progress_errors =
          values[`Invoice_GfPeriodsManager_progress_errors_${result.id}`];

        result.Invoice_GfPeriodsManager_progress_invoice_cueued =
          values[
            `Invoice_GfPeriodsManager_progress_invoice_cueued_${result.id}`
          ];
        result.GfPreparativesAire = values[`GfPreparativesAire_${result.id}`];
        result.GfPreparativesLemon = values[`GfPreparativesLemon_${result.id}`];
        result.Invoice_FixEdges = values[`Invoice_FixEdges_${result.id}`];
        result.Invoice_GfPeriodsManager_progress_issued =
          values[`Invoice_GfPeriodsManager_progress_issued_${result.id}`];

        result.Invoice_GfPeriodsManager_progress_issued_errors =
          values[
            `Invoice_GfPeriodsManager_progress_issued_errors_${result.id}`
          ];

        result.Invoice_GfPeriodsManager_progress_aire_invocie_line =
          values[
            `Invoice_GfPeriodsManager_progress_aire_invocie_line_${result.id}`
          ];

        result.Invoice_GfPeriodsManager_progress_mail =
          values[`Invoice_GfPeriodsManager_progress_mail_${result.id}`];

        result.Invoice_GfPeriodsManager_progress_mail_errors =
          values[`Invoice_GfPeriodsManager_progress_mail_errors_${result.id}`];

        result.Invoice_GfPeriodsManager_progress_issued_cueued =
          values[
            `Invoice_GfPeriodsManager_progress_issued_cueued_${result.id}`
          ];
      }

      return results;
    });

    GfInvoicePeriod.addHook('beforeUpdate', async (period, query) => {
      if (!period.id) return;
      const preparatives = [
        period.aireResumenDownloaded,
        period.fixCdrEdgesDone,
        period.controlRows,
      ];
      let pTotals = {};
      for (let preparative of preparatives) {
        preparative = preparative ? preparative : 'pending';
        pTotals[preparative] = true;
      }
      pTotals = Object.keys(pTotals);

      let state = 'preparing';
      if (pTotals.length === 1 && pTotals[0] === 'done') {
        state = 'prepared';
      }

      if (pTotals.length === 1 && pTotals[0] === 'pending') {
        state = 'pending';
      }

      if (state === 'prepared') {
        const processes = [
          period.invoicesState,
          period.issuedState,
          period.emailsState,
        ];

        pTotals = {};
        for (let process of processes) {
          process = process ? process : 'pending';
          pTotals[process] = true;
        }
        pTotals = Object.keys(pTotals);
        if (pTotals.length === 1 && pTotals[0] === 'done') {
          state = 'done';
        }

        if (pTotals.length > 1) {
          state = 'in_progress';
        }
      }

      period.state = state;
    });

    GfInvoicePeriod.addHook('afterUpdate', async (period, query) => {
      if (!period.id) return;
      const socket = require('@lib/socket');
      const { commands } = require('@constants/ws');
      socket.emit(commands.invoicePeriod.update, period);
    });
  };

  return GfInvoicePeriod;
};
