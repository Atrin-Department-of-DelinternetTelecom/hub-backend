// @ts-check
'use strict';

const {
  system: { Message, User },
} = require('@models');
const { respondSuccess } = require('@utils/response');
const {
  getAllEntities,
  createCatch,
  findAndDelete,
  findAndGet,
  findAndUpdate,
} = require('@utils/request-handler');
const Sequelize = require('sequelize');
const { concat } = require('lodash');
const { commands: _commands } = require('@constants/ws');
const { onConnection } = require('@lib/socket');
const to = require('await-to-js').default;

const commands = _commands.hrmsMessage;

/**
 *
 * delete a Message by id
 *
 * id String id of table Message
 * returns Object
 **/
exports.deleteMessagesId = async function (id) {
  return await findAndDelete(id, Message);
};

/**
 * Your GET endpoint
 * get all Messages in system
 *
 * returns Object
 **/
exports.getMessages = async function (query) {
  return await getAllEntities(query, Message);
};

/**
 * Your GET endpoint
 * get a Message by id
 *
 * id String id of table Message
 * returns Object
 **/
exports.getMessagesId = async function (id) {
  return await findAndGet(id, Message);
};

/**
 *
 * insert a Message to system
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postMessages = async function (body, creator_id) {
  body.creator_id = creator_id;
  body.read = false;
  return createCatch(body, Message);
};

/**
 *
 * update a Message by id
 *
 * id String id of table Message
 * body Body change the name of the Message(in the example) (optional)
 * returns Object
 **/
exports.putMessagesId = async function (id, body) {
  return await findAndUpdate(id, body, Message);
};

/**
 *
 * get messages that sended by user
 *
 * id String id of table Message
 * body Body change the name of the Message(in the example) (optional)
 * returns Object
 **/
exports.getUserMessagesId = async function (id, query, user) {
  return await getAllEntities(query, Message, {
    to_user_id: [parseInt(id), user.id],
    from_user_id: {
      [Sequelize.Op.in]: [parseInt(id), user.id],
      [Sequelize.Op.ne]: Sequelize.col('to_user_id'),
    },
  });
};

/**
 *
 * get messages that sended by user
 *
 * id String id of table Message
 * body Body change the name of the Message(in the example) (optional)
 * returns Object
 **/
exports.getUsersChatsId = async function (user) {
  const toUser = await Message.findAll({
    where: {
      to_user_id: user.id,
    },
    group: ['from_user_id'],
    include: [
      {
        model: User,
        as: 'from_user',
      },
      {
        model: User,
        as: 'to_user',
      },
    ],
  });
  const fromUser = await Message.findAll({
    where: {
      from_user_id: user.id,
    },
    group: ['to_user_id'],
    include: [
      {
        model: User,
        as: 'from_user',
      },
      {
        model: User,
        as: 'to_user',
      },
    ],
  });

  const mustCheck = [];
  toUser.forEach((messageToUser) => {
    fromUser.forEach((messageFromUser) => {
      if (
        messageToUser.from_user_id === messageFromUser.to_user_id &&
        messageToUser.to_user_id === messageFromUser.from_user_id
      ) {
        mustCheck.push([messageToUser.from_user_id, messageToUser.to_user_id]);
      }
    });
  });
  const mustAdd = [];
  let mustDelete = [];
  await Promise.all(
    mustCheck.map(async (check) => {
      const cases = await Message.findAll({
        where: {
          to_user_id: check,
          from_user_id: check,
        },
        order: [['createdAt', 'DESC']],
      });
      mustAdd.push(cases[0]);
      mustDelete = concat(mustDelete, cases);
    }),
  );
  let users = concat(fromUser, toUser);
  users = users.filter((value) => {
    let deleted = true;
    mustDelete.forEach((delet) => {
      if (value.id === delet.id) {
        deleted = false;
        return;
      }
    });
    return deleted;
  });
  users = concat(users, mustAdd);
  const respond = await Promise.all(
    users.map(async (message) => {
      const [lastMessage] = await Message.findAll({
        where: {
          to_user_id: message.to_user_id,
          from_user_id: message.from_user_id,
        },
        include: [
          {
            model: User,
            as: 'from_user',
          },
          {
            model: User,
            as: 'to_user',
          },
        ],
        order: [['createdAt', 'DESC']],
        limit: 1,
      });
      const unSeen = await Message.count({
        where: {
          read: false,
          to_user_id: message.to_user_id,
          from_user_id: message.from_user_id,
        },
        distinct: true,
        col: 'id',
      });
      return {
        id: lastMessage.id,
        text: lastMessage.text,
        from_user: lastMessage.from_user,
        to_user: lastMessage.to_user,
        unSeen,
      };
      //console.log(respond);
    }),
  );
  return respondSuccess(respond);
};

exports.setSeenUserId = async (from_id, user) => {
  await Message.update(
    {
      read: true,
    },
    {
      where: {
        to_user_id: user.id,
        from_user_id: from_id,
        read: false,
      },
    },
  );
};

/**
 *
 * @param {import('socket.io').Socket} socket
 * @param {any} data
 */
exports.onNewMessage = async (socket, data) => {
  data.creator_id = socket.data.id;
  data.read = false;

  const [error, message] = await to(Message.create(data));

  if (error) {
    console.log('Error on  MessageService.onNewMessage', error);
    return;
  }

  const messagePlain = message.get({ plain: true });

  // socket.emit('response', response);
  // socket.broadcast.emit('response', { ...response, _type: 'notic' });

  socket.emit(commands.sendAck, messagePlain);
  socket.broadcast.emit(commands.new, messagePlain);
};

onConnection((socket) => {
  socket.on(commands.send, (data) => exports.onNewMessage(socket, data));
});
