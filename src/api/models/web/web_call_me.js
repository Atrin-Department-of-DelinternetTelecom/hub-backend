'use strict';
const { Model, Op, literal } = require('sequelize');
const config = require('@config');
const moment = require('moment');
const { firstPopulated } = require('@api/utils/helpers');
const { system: knex } = require('@lib/knex');
const handlebars = require('handlebars');
const telegraf = require('@lib/telegraf');

module.exports = (sequelize, DataTypes) => {
  class CallMe extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      CallMe.belongsTo(models.User, {
        foreignKey: 'processed_by_user_id',
        as: 'user_processed',
      });
      CallMe.belongsTo(models.GfClient, {
        foreignKey: 'client_id',
        as: 'client',
      });
      CallMe.belongsToMany(models.CallMeTag, {
        through: models.CallMeTaggable,
        as: 'tags',
        foreignKey: 'callme_id',
        otherKey: 'tag_id',
      });
    }
  }

  CallMe.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      phone_number: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      email: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      processed_by_user_id: {
        allowNull: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      client_id: {
        allowNull: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      reference: {
        type: DataTypes.ENUM('WEB', 'CLUB', 'WEB_CHAT', 'VOICE_DESK'),
        defaultValue: 'WEB',
      },
      status: {
        allowNull: false,
        defaultValue: 'pending',
        type: DataTypes.STRING,
      },
      metadata: {
        allowNull: true,
        type: DataTypes.TEXT,
        get: function () {
          return JSON.parse(this.getDataValue('metadata') || '{}');
        },
        set: function (value) {
          this.setDataValue('metadata', JSON.stringify(value));
        },
      },
      tag: {
        allowNull: true,
        type: DataTypes.VIRTUAL,
        get: function () {
          return (this.tags ?? []).map(({ id, CallMeTaggable, name }) => {
            return {
              id,
              name,
              comment: firstPopulated([CallMeTaggable.comment]),
            };
          });
        },
        set: function () {},
      },
      description: {
        allowNull: true,
        type: DataTypes.TEXT,
      },
      processedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      deletedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: 'CallMe',
      tableName: 'web_call_me',
      underscored: true,
      timestamps: true,
      schema: config.get('index.sequelize.system.database'),
      paranoid: true,
      hooks: {
        beforeSave: (model) => {
          if (model.changed('status')) {
            model.setDataValue(
              'processed_at',
              moment().format('YYYY-MM-DD HH:mm:ss'),
            );
          }
        },
        afterCreate: async (model) => {
          try {
            const fn = handlebars.compile(config.get('notify.callMe.message'));
            const message = fn(model.get({ plain: true }));
            const bot = telegraf.getInstance(
              config.get('notify.callMe.apiKey'),
            );
            await bot.telegram.sendMessage(
              config.get('notify.callMe.channel'),
              message,
              { parse_mode: 'HTML' },
            );
          } catch (e) {
            console.error('[Hooks]', e);
          }
        },
      },
    },
  );

  CallMe.searchUser = async (value) => {
    const searchString = `%${value.replace(/%/g, '')}%`;

    const subQuery = knex('delinternet_hub.global_users AS gu')
      .where('gu.id', knex.raw('CallMe.processed_by_user_id'))
      .where((query) => {
        query
          .whereRaw("CONCAT(gu.first_name, ' ', gu.last_name) LIKE ?", [
            searchString,
          ])
          .orWhere('gu.email', 'like', searchString);
      })
      .select(1)
      .limit(1)
      .toQuery();

    return {
      key: Op.and,
      where: [
        literal(`EXISTS (${subQuery})`),
        { processed_by_user_id: { [Op.not]: null } },
      ],
    };
  };

  CallMe.searchTag = async (value, ...args) => {
    const subQuery = knex('delinternet_hub.web_call_me_tags AS t')
      .join('delinternet_hub.web_call_me_taggables AS tg', 'tg.tag_id', 't.id')
      .where('tg.callme_id', '=', knex.raw('CallMe.id'))
      .where('t.name', 'like', `%${value.replaceAll('%', '')}%`)
      .select(1)
      .limit(1)
      .toQuery();

    return {
      key: Op.and,
      where: [literal(`EXISTS (${subQuery})`)],
    };
  };

  return CallMe;
};
