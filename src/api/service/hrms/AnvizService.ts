import { AnyModel, system } from '@models';
import {
  findAndDelete,
  findAndUpdate,
  getAllEntities,
} from '@utils/request-handler';

import {
  respondBadRequest,
  respondCreated,
  respondNotFound,
  respondSuccess,
} from '@utils/response';

import { AnvizRedis } from '@constants/anvizes';
import {
  Message,
  NewDeviceMessage,
  Publisher,
} from '@utils/anviz-redis-message-helper';
import { modelToJson } from '@utils/tools';
import UUID from 'uuid';

const ANVIZ_PUBLISH_CHANNEL = AnvizRedis.CHANNELS.PUBLISH;
const { Anviz, AnvizStaff, User, StaffFingerPrint } = system;

const { COMMANDS } = AnvizRedis;

export const deleteAnvizesId = async function (id: number) {
  return findAndDelete(id, Anviz);
};

export const deleteAnvizesStaffId = async function (anviz_id: number) {
  if ((await Anviz.findByPk(anviz_id)) === null) {
    return respondBadRequest('anviz not found');
  }

  //delete
  await AnvizStaff.destroy({
    where: {
      anviz_id,
    },
  });
  return respondSuccess('staffs deleted');
};

export const deleteAnvizesStaffsClear = async function (
  device_id: number,
  staff_id: number,
) {
  await AnvizStaff.destroy({
    where: {
      anviz_id: device_id,
      user_id: staff_id,
    },
  });
  //JOSE if u want to do anything place your code here
  return respondSuccess('staff deleted');
};

/**
 * Your GET endpoint
 * if we call this without id, we get all anvizes
 * and if we call this with id we get single anviz related to id
 *
 * returns Object
 **/
export const getAnvizes = async function (query: any) {
  return getAllEntities(query, Anviz);
};

/**
 * Your GET endpoint
 * get single anviz by id
 *
 * id String id of selected anviz
 * returns Object
 **/
export const getAnvizesId = async function (id: number) {
  const anviz = await Anviz.findByPk(id);
  if (!anviz) return respondNotFound('anviz not found');
  const fingerprints = await StaffFingerPrint.findAll({
    where: {
      anviz_id: id,
    },
    include: [
      {
        model: User,
        as: 'user',
      },
    ],
  });

  return respondSuccess({
    ...anviz.get({ plain: true }),
    fingerprints,
  });
};

/**
 * Your GET endpoint
 * get staffs of selected anviz device
 *
 * id String id of selected anviz
 * returns Object
 **/
export const getAnvizesStaff = async function (id: number) {
  const staffs = await AnvizStaff.findAll({
    where: {
      anviz_id: id,
    },
    include: [
      {
        model: User,
        as: 'user',
      },
    ],
  });

  const staffsWithFinger: AnyModel[] = [];
  staffs.forEach(async (staff) => {
    const fingers = await StaffFingerPrint.findAll({
      where: {
        anviz_id: staff.anviz_id,
        user_id: staff.user_id,
      },
    });
    staffsWithFinger.push({
      ...modelToJson(staff),
      fingers: modelToJson(fingers),
    });
  });

  return respondSuccess(staffsWithFinger, {
    userCount: await AnvizStaff.count({
      where: {
        anviz_id: id,
      },
    }),
    fingerPrintCount: await StaffFingerPrint.count({
      where: {
        anviz_id: id,
      },
    }),
  });
};

/**
 *
 * add an staff to selected device
 *
 * body Body add a user to a device
 * with hardware(staff and name)
 * information (optional)
 * returns Object
 **/

//JOSE: I add an staff to database by id of user
export const postAnvizesAddstaff = async function (
  body: any,
  creator_id: number,
) {
  if (
    typeof body.user_id == 'undefined' ||
    (await User.findByPk(body.user_id)) === null
  ) {
    return respondBadRequest('user not found');
  }

  if (
    typeof body.anviz_id == 'undefined' ||
    (await Anviz.findByPk(body.anviz_id)) === null
  ) {
    return respondBadRequest('anviz not found');
  }

  //JOSE if u want to do anything place your code here

  body.creator_id = creator_id;
  return respondCreated(await AnvizStaff.create(body));
};

/**
 *
 * save a post value
 *
 * body Body parameter needed to save
 * an anviz record (optional)
 * returns Object
 **/

export const postAnvizesId = async function (body: any, creator_id: number) {
  body.creator_id = creator_id;
  return respondCreated(await Anviz.create(body));
};

/**
 *
 * update an anviz record by id
 *
 * id String id of selected anviz
 * body Body in this example we want
 * to update name and username (optional)
 * returns Object
 **/
export const putAnvizesId = async function (id: number, body: any) {
  return findAndUpdate(id, body, Anviz);
};

export const postAnvizesRegisterFingerprintId = async function (
  device_id: number,
  user_id: number,
) {
  const anviz = await Anviz.findByPk(device_id);
  if (anviz === null) {
    return respondBadRequest('anviz not found');
  }
  const user = await User.findByPk(user_id);
  if (user === null) {
    return respondBadRequest('user not found');
  }
  //check this user is inside device or no
  if (!(await isUserInsideDevice(device_id, user_id))) {
    return respondBadRequest('user is not inside device');
  }

  return respondSuccess('NOT IMPLEMENTED');
};

const isUserInsideDevice = async (anviz_id: number, user_id: number) => {
  const staff = await AnvizStaff.findOne({
    where: {
      anviz_id,
      user_id,
    },
  });

  return staff === null ? false : true;
};

// Anviz Commands

/**
 * This function create a new device in the
 * redis queue.
 *
 * Is important to call this function to create a new device
 * for aafter can run any cmd, otherwise this wont work.
 *
 *
 * @param {*} reqId
 * @param {*} deviceId
 * @param {*} ip
 * @param {*} port
 * @param {*} timeout
 * @param {*} username
 * @param {*} password
 * @return {string} cmd.
 *
 */
export const newAnvizDevice = (
  _message: Omit<NewDeviceMessage, 'command' | 'params'>,
) => {
  const message: NewDeviceMessage = {
    command: COMMANDS.DEVICE.NEW_DEVICE,
    params: [],
    ..._message,
    request_id: _message.request_id ?? UUID.v4(),
  };

  Publisher.publish(ANVIZ_PUBLISH_CHANNEL, message);

  return respondSuccess(message);
};

/**
 * Register a staff fingerprint.
 *
 * A staff just can register two finger.
 *
 * @param deviceId - device id to operate over.
 * @param staffId - staff id.
 * @param backupId - finger time. 1 = 1er finger, 2 = 2do finger.
 */
export const enrollFingerPrint = (
  reqId: string,
  deviceId: number,
  staffId: number,
  backupId: number,
) => {
  const message: Message = {
    device_id: deviceId,
    command: AnvizRedis.COMMANDS.FINGERPRINT.ENROLL_FINGERPRINT,
    params: [staffId, backupId],
    request_id: reqId ?? UUID.v4(),
  };

  Publisher.publish(ANVIZ_PUBLISH_CHANNEL, message);

  return respondSuccess(message);
};

/**
 * Ping a given device.
 */
export const ping = (reqId: string, deviceId: number) => {
  const message: Message = {
    device_id: deviceId,
    command: AnvizRedis.COMMANDS.DEVICE.PING,
    params: [],
    request_id: reqId ?? UUID.v4(),
  };

  Publisher.publish(ANVIZ_PUBLISH_CHANNEL, message);
  return respondSuccess(message);
};

/**
 * @param staff - {device_id:number, staff_id:number, staff_name:string, backup_id:number}
 */
export const registerNewStaff = (staff: any) => {
  const { request_id, device_id, staff_id, staff_name, backup_id, creator_id } =
    staff;

  const message: Message = {
    device_id,
    command: AnvizRedis.COMMANDS.STAFF.REGISTER_NEW_STAFF,
    params: [staff_id, staff_name, backup_id, creator_id],
    request_id: request_id ?? UUID.v4(),
  };

  Publisher.publish(ANVIZ_PUBLISH_CHANNEL, message);
  return respondSuccess(message);
};

export const getRecordInformation = async (requestId: string, id: number) => {
  const anviz = (await Anviz.findByPk(id))?.get({
    plain: true,
  });

  const message: Message = {
    device_id: anviz.device_id,
    command: AnvizRedis.COMMANDS.DEVICE.GET_RECORD_INFORMATION,
    params: [],
    request_id: requestId ?? UUID.v4(),
  };

  Publisher.publish(ANVIZ_PUBLISH_CHANNEL, message);
  return respondSuccess(message);
};

export const getFingerprintTemplate = (body: any) => {
  const { request_id, device_id, staff_id, backup_id } = body;

  const message: Message = {
    device_id,
    command: AnvizRedis.COMMANDS.FINGERPRINT.GET_FINGERPRINT_TEMPLATE,
    params: [staff_id, backup_id],
    request_id: request_id ?? UUID.v4(),
  };

  Publisher.publish(ANVIZ_PUBLISH_CHANNEL, message);
  return respondSuccess(message);
};
