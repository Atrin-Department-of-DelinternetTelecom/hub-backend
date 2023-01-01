import { createRoute } from '@utils/controller-factory';
import * as Anviz from '@service/hrms/AnvizService';

export const deleteAnvizesId = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;
    return Anviz.deleteAnvizesId(id);
  },
});

export const deleteAnvizesStaffId = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;
    return Anviz.deleteAnvizesStaffId(id);
  },
});

export const deleteAnvizesStaffsClear = createRoute({
  async handler(req) {
    const device_id = req.swagger.params.device_id.value;
    const staff_id = req.swagger.params.staff_id.value;
    return Anviz.deleteAnvizesStaffsClear(device_id, staff_id);
  },
});

export const getAnvizes = createRoute({
  async handler(req) {
    return Anviz.getAnvizes(req.query);
  },
});

export const getAnvizesId = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;
    return Anviz.getAnvizesId(id);
  },
});

export const getAnvizesStaff = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;
    return Anviz.getAnvizesStaff(id);
  },
});

export const postAnvizesAddstaff = createRoute({
  async handler(req) {
    const body = req.swagger.params.body.value;
    return Anviz.postAnvizesAddstaff(body, req.user.id);
  },
});

export const postAnvizesId = createRoute({
  async handler(req) {
    const body = req.swagger.params.body.value;
    return Anviz.postAnvizesId(body, req.user.id);
  },
});

export const putAnvizesId = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;
    const body = req.swagger.params.body.value;
    return Anviz.putAnvizesId(id, body);
  },
});

export const postAnvizesRegisterFingerprintId = createRoute({
  async handler(req) {
    const body = req.swagger.params.body.value;
    return Anviz.postAnvizesRegisterFingerprintId(body.device_id, body.user_id);
  },
});

// ANVIZES HARDWARE DEVICES

export const newAnvizDevice = createRoute({
  async handler(req) {
    const body = req.swagger.params.body.value;

    const { request_id, id, ip, port, timeout, username, password } = body;

    return Anviz.newAnvizDevice({
      request_id,
      device_id: id,
      device_ip: ip,
      device_port: port,
      device_timeout: timeout,
      device_username: username,
      device_password: password,
    });
  },
});

export const enrollFingerPrint = createRoute({
  async handler(req) {
    const body = req.swagger.params.body.value;
    const { request_id, device_id, staff_id, backup_id } = body;
    return Anviz.enrollFingerPrint(request_id, device_id, staff_id, backup_id);
  },
});

export const ping = createRoute({
  async handler(req) {
    const body = req.swagger.params.body.value;
    const { request_id, device_id } = body;
    return Anviz.ping(request_id, device_id);
  },
});

export const registerNewStaff = createRoute({
  async handler(req) {
    const body = req.swagger.params.body.value;
    return Anviz.registerNewStaff({
      ...body,
      creator_id: req.user.id,
    });
  },
});

export const getRecordInformation = createRoute({
  async handler(req) {
    const { request_id, id } = req.swagger.params.body.value;
    return Anviz.getRecordInformation(request_id, id);
  },
});

export const getFingerprintTemplate = createRoute({
  async handler(req) {
    const body = req.swagger.params.body.value;
    return Anviz.getFingerprintTemplate(body);
  },
});
