// // @ts-check
// 'use strict';

// const { User, Anviz } = require('@models').system;
// const {
//   postTimeRecordByDeviceId,
//   putTimeRecordsSetexit,
//   getTodayTimerecordsByUserId,
// } = require('@service/hrms/TimeRecordService');
// const { AnvizRedis } = require('@constants/anvizes');
// const { client } = require('@lib/redis');

// const { REDIS_MESSAGE_KYES, WEB_SOCKER } = AnvizRedis;

// client.subscribe(AnvizRedis.CHANNELS.SUBSCRIBE, (channel, message) => {
//   if (channel == AnvizRedis.CHANNELS.SUBSCRIBE) {
//     let msg = JSON.parse(message);
//     newDeviceMessage(msg, socket);
//     msg = realTimeHandler(msg, socket);
//     parseResponse(msg);
//     socket.emit(channel, msg);
//   }
// });

// const event = AnvizRedis.WEB_SOCKER.EMIT_TIMERECORD;

// let socket = null;

// // Initializer function

// /**
//  * Ensure those properties that are undefined
//  * @returns Obj
//  */
// const ensureProperties = (data) => {
//   const string = JSON.stringify(data, function (k, v) {
//     return typeof v === 'undefined' ? null : v;
//   });
//   return JSON.parse(string);
// };

// /**
//  * Get a timerecord related user by pk.
//  * @param {*} user_id
//  * @returns Object
//  */
// const getTimerecordUser = async (user_id) => {
//   const user = await User.findByPk(user_id);
//   return user;
// };

// /**
//  * Update a timerecord exit and emit an event.
//  * @param {Object} record - timerecord
//  * @param {Object} user - related user
//  * @param {*} socket - socket instance to emit.
//  */
// const handleOnUpdateRecord = async (record, user, socket) => {
//   const { id: timeRecord_id } = record;
//   const updated = (await putTimeRecordsSetexit({ timeRecord_id })).get({
//     plain: true,
//   });
//   const finalPayload = ensureProperties({ ...updated, user });
//   socket.emit(event, { cmd: 'update', payload: finalPayload });
// };

// /**
//  * Register/Create a new timerecord and emit it into an event.
//  * @param {*} body - needed body to create a new Rimerecord
//  * @param {Object} user - related user
//  * @param {*} socket - socket instance to emit.
//  */
// const handleOnNewRecord = async (body, user, socket) => {
//   const created = (await postTimeRecordByDeviceId(body, null)).get({
//     plain: true,
//   });
//   const finalPayload = ensureProperties({ ...created, user });
//   socket.emit(event, { cmd: 'push', payload: finalPayload });
// };

// /**
//  * Middleware function that check if message come from
//  * redis is a 'realtime' response, if so, apply
//  * logic for persist activity and emit an event by socket.
//  *
//  * always return the same message.
//  *
//  * @param {*} msg - msg come from redis.
//  * @param {*} socket - socket instance to emit.
//  * @returns same massage that was pass as input.
//  */
// const realTimeHandler = (msg, socket) => {
//   const { command } = msg;

//   if (command && command === 'realtime') {
//     const { deviceId: anviz_id, payload } = msg;
//     const { user_id, time } = payload;

//     getTodayTimerecordsByUserId({ user_id }).then(async (records = []) => {
//       const withoutExit = records.find((record) => record.exit === null);
//       const user = await getTimerecordUser(user_id);

//       if (withoutExit) {
//         await handleOnUpdateRecord(withoutExit, user, socket);
//       } else {
//         const payloadAux = { anviz_id, user_id, enter: time };
//         await handleOnNewRecord(payloadAux, user, socket);
//       }
//     });
//   }
//   return msg;
// };

// const newDeviceMessage = async (msg, socket) => {
//   const { command } = msg;
//   const event = AnvizRedis.WEB_SOCKER.EMIT_RESPONSES;
//   const cmd = AnvizRedis.COMMANDS.DEVICE.NEW_DEVICE;

//   if (cmd === command) {
//     const { type, status, deviceId } = msg;
//     const where = { device_id: deviceId };

//     if (type === 'response') {
//       if (status === 'ok') {
//         await Anviz.update({ is_enable: true }, { where });
//       } else if (status === 'error') {
//         await Anviz.update({ is_enable: false }, { where });
//       }
//     }

//     // Anviz

//     socket.emit(event, msg);
//   }

//   return msg;
// };

// const parseResponse = (message) => {
//   const { REQUEST_ID } = REDIS_MESSAGE_KYES;
//   const reqId = message[REQUEST_ID];

//   if (reqId) {
//     WEB_SOCKER;
//     socket.emit(WEB_SOCKER.EMIT_RESPONSES, reqId);
//   }

//   return message;
// };
