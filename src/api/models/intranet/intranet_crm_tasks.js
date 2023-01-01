'use strict';

const config = require('@config');
const intranet = require('@utils/intranet');
const _ = require('lodash');
const moment = require('moment');
const parseTaskHtml = require('./utils/parseTaskHtml');
const { getInstance: getTelegraf } = require('@lib/telegraf');

const { intranet: knex } = require('@lib/knex');
const { Op, literal } = require('sequelize');
const { CONTRACT } = require('@api/constants/statuses');

module.exports = function (sequelize, DataTypes) {
  const CrTask = sequelize.define(
    'CrTask',
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
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      taskTypeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      alias: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      aditionalText: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      text: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      image: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      file: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      hubFile: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      file2: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      hubFile2: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      file3: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      hubFile3: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      file4: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      hubFile4: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      file5: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      hubFile5: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      file6: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      hubFile6: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      emailAttachments: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      executed: {
        type: DataTypes.ENUM('0', '1', 'in_progress'),
        allowNull: true,
      },
      executedDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      previsionDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      displayFrom: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      displayUntil: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      refererType: {
        type: DataTypes.VIRTUAL,
        get() {
          if (this.refererMetadata) {
            const metadata = JSON.parse(this.refererMetadata);
            return metadata.assistance
              ? 'assistance'
              : metadata.incidence
              ? 'incidence'
              : null;
          }
        },
        allowNull: true,
      },
      type: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
      },
      refererId: {
        type: DataTypes.VIRTUAL,
        get() {
          if (this.refererMetadata) {
            const metadata = JSON.parse(this.refererMetadata);
            return metadata.assistance
              ? metadata.assistanceId
              : metadata.incidence
              ? metadata.incidenceId
              : null;
          }
        },
        allowNull: true,
      },
      refererKey: {
        type: DataTypes.STRING(255),
        defaultValue: 'GfCrm',
        allowNull: true,
      },
      refererMetadata: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      eventHistoryInformation: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
      },
      previsionDate2: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
      },
      allDay: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
      },
      refererTrace: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      altIdType: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      altId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      automaticEventId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      canceled: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      chatId: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      rTaskId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      extracted_html: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
      },
      motherTaskId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
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
      tableName: 'crm_tasks',
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
          fields: [
            {
              name: 'id',
            },
          ],
        },
      ],
      hooks: {
        afterCreate: async (task, options) => {
          const token = config.get('global.crmTaskBotToken', null);
          const channelId = config.get('global.crmTaskChannelId', null);
          if (!token || !channelId) {
            return console.warn(
              'crm task telegram bot disabled due no global.crmTaskBotToken or global.crmTaskChannelId config',
            );
          }

          const bot = getTelegraf(token);
          bot.telegram.sendMessage(
            channelId,
            await parseTaskHtml.generateTelegramMessageBasedOnTask(task),
            { parse_mode: 'HTML' },
          );
        },
        afterFind: async (tasks, optoins) => {
          if (!tasks) return;
          // this hook is for find single
          if (!Array.isArray(tasks)) tasks = [tasks];
          for (const task of tasks) {
            const { type, ...others } =
              parseTaskHtml.getInfoAndExtractPropsFromHtml(task.aditionalText);
            task.type = type;
            task.metadata = others;
            if (!task.duration) {
              task.allDay = 1;
            } else {
              task.allDay = 0;
              task.previsionDate2 = moment(task.previsionDate)
                .add(task.duration, 'minutes')
                .toDate();
            }
          }
        },
      },
    },
  );

  CrTask.associate = function (models) {
    CrTask.hasMany(models.CrTaskLog, {
      foreignKey: 'taskId',
      as: 'logs',
    });

    CrTask.belongsTo(models.CrTaskType, {
      foreignKey: 'taskTypeId',
      as: 'task_type',
    });

    CrTask.belongsTo(models.User, {
      foreignKey: 'userId',
      targetKey: 'userId',
      as: 'system_user',
    });

    CrTask.hasMany(models.CrTaskExtraFieldXref, {
      as: 'extra_fields',
      foreignKey: 'taskId',
    });

    CrTask.hasMany(models.CrTaskUserXref, {
      as: 'users',
      foreignKey: 'taskId',
    });
    CrTask.belongsTo(models.GfClient, {
      as: 'client',
      foreignKey: 'clientId',
      targetKey: 'invoiceClientId',
    });

    CrTask.belongsTo(models.CrmUser, {
      as: 'creator',
      foreignKey: 'userId',
      targetKey: 'userId',
    });

    CrTask.belongsTo(models.InvoiceClient, {
      as: 'invoice_client',
      foreignKey: 'clientId',
    });

    CrTask.belongsTo(models.GfContract, {
      as: 'contract',
      foreignKey: 'altId',
    });
  };

  CrTask.searchFailedResumes = () => {
    const ref = `gc_${Date.now()}`;
    const subQuery = knex(`intranet.gf_contracts AS ${ref}`)
      .select(1)
      .where(`${ref}.status`, 1)
      .where(`${ref}.id`, knex.raw('CrTask.altId'))
      .where(knex.raw('refererTrace LIKE ?', ['doUnBlock%']))
      .whereNot(function () {
        this.where(knex.raw('refererTrace LIKE ?', ['%-ignore']));
      })
      .whereIn(`${ref}.state`, [CONTRACT.BLOCKED])
      .limit(1)
      .toQuery();

    return {
      key: Op.and,
      where: [{ executed: '0' }, literal(`EXISTS (${subQuery})`)],
    };
  };

  return CrTask;
};
