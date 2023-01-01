'use strict';

const config = require('@config');
const intranet = require('@utils/intranet');
const parseTaskHtml = require('./utils/parseTaskHtml');
const { Mixin } = require('@lib/media');

module.exports = function (sequelize, DataTypes) {
  const CrChat = sequelize.define(
    'CrChat',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      uid: {
        type: DataTypes.INTEGER,
        defaultValue: config.get('index.intranet.uid'),
      },
      fromUserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      toUserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      text: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      read: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      type: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
      },
      filter: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      extracted_html: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
      },
      status: {
        type: DataTypes.INTEGER,
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
      tableName: 'global_messages',
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
      hooks: {
        afterFind: (messages, optoins) => {
          if (!messages) return;
          if (!Array.isArray(messages)) messages = [messages];
          for (const message of messages) {
            const { type, ...others } =
              parseTaskHtml.getInfoAndExtractPropsFromHtml(message.text);
            message.type = type;
            message.metadata = others;
          }
        },
        afterSave: async (message, { transaction }) => {
          if (transaction) {
            transaction.afterCommit(async () => moveEditorMedias(message));
          } else {
            await moveEditorMedias(message);
          }
        },
      },
    },
  );

  CrChat.associate = function (models) {
    CrChat.hasMany(models.CrChatRead, {
      foreignKey: 'messageId',
      as: 'read_info',
    });
    CrChat.belongsTo(models.MoozaicUser, {
      foreignKey: 'fromUserId',
      as: 'from_user',
    });

    CrChat.belongsTo(models.User, {
      foreignKey: 'fromUserId',
      targetKey: 'userId',
      as: 'system_user',
    });
  };

  const moveEditorMedias = async (crmChat) => {
    const matches =
      String(crmChat.text).match(/data-media\s*=\s*['"`]?(\d+)['"`]?/g) ?? [];

    if (matches.length === 0) {
      return;
    }

    const { GlobalMedia } = require('@models').system;

    const medias = await GlobalMedia.findAll({
      where: {
        model_id: null,
        id: matches.map((match) => Number(match.match(/\d+/)[0])),
      },
    });

    await Promise.all(medias.map((media) => media.updateForResource(crmChat)));
  };

  // handle media library
  Mixin.applyTo(CrChat);
  // @ts-ignore
  CrChat.addCollection('message', (collection) => {
    collection.useDisk('message');
  });

  return CrChat;
};
