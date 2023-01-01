'use strict';
const {
  system: { Closet, ClosetUser, User },
} = require('@models');
const {
  respondSuccess,
  isResponsePayload,
  respondNotFound,
  respondBadRequest,
} = require('@utils/response');
const { getAllEntities, createCatch } = require('@utils/request-handler');
const { findAndDelete } = require('@utils/request-handler');
const { findAndGet } = require('@utils/request-handler');
const { findAndUpdate } = require('@utils/request-handler');
const { publish } = require('@lib/mqtt');
const { modelToJson } = require('@utils/tools');
const config = require('@config');
const { getInstance: getTelegraf } = require('@lib/telegraf');
const { Markup } = require('telegraf');
const { Op } = require('sequelize');

/**
 *
 * deleted record by id
 *
 * id String
 * returns Object
 **/
exports.deleteClosetsId = async function (id) {
  return findAndDelete(id, Closet);
};

/**
 * Your GET endpoint
 * get all closet records
 *
 * returns Object
 **/
exports.getClosets = async function (query) {
  await extractCustomQuery(query);
  return getAllEntities(query, Closet, undefined, [
    { model: User, as: 'owner' },
    { model: User, as: 'owners' },
  ]);
};

const extractCustomQuery = async (query) => {
  if (query?.search?.whereQuery?.owner) {
    const owner = query.search.whereQuery.owner;
    delete query.search.whereQuery.owner;
    if (
      ['Sin Propietario', 'Sense propietari', 'Without Owner'].includes(owner)
    ) {
      const closetsWithOwner = (
        await ClosetUser.findAll({ where: { deletedAt: null } })
      ).map((closetUser) => closetUser.closet_id);
      query.search.whereQuery.id = { [Op.notIn]: closetsWithOwner };
      return;
    }
    query.search.whereQuery = {
      ...query.search.whereQuery,
      [Op.or]: {
        '$owner.first_name$': { [Op.like]: `%${owner}%` },
        '$owner.last_name$': { [Op.like]: `%${owner}%` },
      },
    };
  }
};

/**
 * Your GET endpoint
 * get single closet record by id
 *
 * id String
 * returns Object
 **/
exports.getClosetsId = async function (id) {
  let closet = await findAndGet(
    id,
    Closet,
    [{ model: User, as: 'owner' }],
    false,
    true,
  );
  if (isResponsePayload(closet)) {
    return closet;
  }

  const histories = await ClosetUser.findAll({
    where: {
      closet_id: id,
    },
    paranoid: false,
    include: [
      {
        model: User,
        as: 'owner',
      },
    ],
  });

  closet = modelToJson(closet);
  closet.histories = modelToJson(histories);
  return respondSuccess(closet);
};

/**
 *
 * assign a closet to a user
 *
 * id String
 * body Body  (optional)
 * returns Object
 **/
exports.attachClosetToUser = async function (body, creator_id) {
  const { closet_id, owner_id } = body;
  const closet = await findAndGet(closet_id, Closet, false, false, true);
  if (isResponsePayload(closet)) {
    return closet;
  }

  if (owner_id) {
    const user = await findAndGet(owner_id, User, false, false, true);
    if (isResponsePayload(user)) {
      return user;
    }
    await ClosetUser.update(
      { deletedAt: new Date() },
      {
        where: {
          owner_id,
          deletedAt: { [Op.eq]: null },
        },
      },
    );
  }

  await ClosetUser.update(
    { deletedAt: new Date() },
    {
      where: {
        closet_id,
        deletedAt: { [Op.eq]: null },
      },
    },
  );

  if (closet_id && owner_id) {
    await ClosetUser.create({
      closet_id,
      owner_id,
      creator_id: creator_id,
    });
  }

  return respondSuccess('assignment is done');
};

/**
 *
 * create new closet
 *
 * body Body  (optional)
 * returns Object
 **/
exports.postClosetsId = async function (body, creator_id) {
  if (body.owner_telegram_username) {
    body.owner_telegram_username = body.owner_telegram_username.replace(
      /@/g,
      '',
    );

    const exists = await Closet.findOne({
      where: {
        owner_telegram_username: body.owner_telegram_username,
      },
    });

    if (exists) {
      return respondBadRequest('Telegram username already exists');
    }
  }

  body.creator_id = creator_id;
  return createCatch(body, Closet);
};

/**
 *
 * update closet record by id
 *
 * id String
 * body Body in this example we want to
 * update redis channel name (optional)
 * returns Object
 **/
exports.putClosetsId = async function (id, body) {
  return findAndUpdate(id, body, Closet);
};

exports.changeStateOfClosetsId = async function (id) {
  const closet = await findAndGet(id, Closet, false, false, true);
  if (isResponsePayload(closet)) {
    return closet;
  }

  toggleCloset(closet);

  return respondSuccess({
    success: true,
  });
};

const toggleCloset = (closet) =>
  publish(
    'doors/output',
    JSON.stringify({
      state: 'open',
      pin: closet.code,
    }),
  );

exports.changeStateOfClosets = async function (user) {
  const closetUser = await ClosetUser.findOne({
    where: {
      owner_id: user.id,
      deletedAt: { [Op.eq]: null },
    },
  });

  if (!closetUser) {
    return respondNotFound('there is no closet for this user');
  }

  const closet = await Closet.findByPk(closetUser.closet_id);

  const result = toggleCloset(closet);

  console.log('published on', closet.code);

  return respondSuccess({
    success: result,
  });
};

const messages = {
  hi: {
    en: 'Hello!\nWelcome to Delinternet closet bot',
    es: 'Hola!\nBienvenido al bot del armario de Delinternet',
  },
  open: {
    en: 'Open closet',
    es: 'Armario abierto',
  },
  no_username: {
    en: 'Your must have a Telegram username to use this bot.',
    es: 'Debe tener un nombre de usuario de Telegram para usar este bot.',
  },
  no_closet: {
    en: "You don't have any closet. Please talk to system admin.",
    es: 'No tienes ningún armario. Por favor, hable con el administrador del sistema.',
  },
  done: {
    en: 'Your closet is open now',
    es: 'Tu armario está abierto ahora',
  },
};

const i18n = (lang) => (label) => {
  const message = messages[label];
  if (!message) throw new Error(`No i18n message found for label: ${label}`);
  return message[lang] ?? message.en ?? message.es;
};

exports.initBot = () => {
  const token = config.get('global.closetBotToken', null);
  if (!token) {
    return console.warn(
      'closet telegram bot disabled due no global.closetBotToken config ',
    );
  }

  const bot = getTelegraf(token);

  bot.start((ctx) => {
    const t = i18n(ctx.from?.language_code);

    ctx.reply(
      t('hi'),
      Markup.inlineKeyboard([Markup.button.callback(t('open'), 'toggle')]),
    );
  });

  bot.action('toggle', async (ctx) => {
    const username = ctx.chat?.username;
    const t = i18n(ctx.from?.language_code);
    if (!username) return ctx.answerCbQuery(t('no_username'));

    const closet = await Closet.findOne({
      where: {
        owner_telegram_username: username,
      },
    });
    if (!closet) return ctx.answerCbQuery(t('no_closet'));

    toggleCloset(closet);

    ctx.answerCbQuery(t('done'));
  });

  bot.launch();
};
