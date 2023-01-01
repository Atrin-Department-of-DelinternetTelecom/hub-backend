'use strict';

const SYSTEM_PREFIX = '90_delinternet_redis_anviz';

exports.AnvizRedis = {
  CHANNELS: {
    PUBLISH: `${SYSTEM_PREFIX}_command`,
    SUBSCRIBE: `${SYSTEM_PREFIX}_response`,
  },
  WEB_SOCKER: {
    EMIT_TIMERECORD: `anviz_timerecord`,
    EMIT_RESPONSES: `anviz_cmd_responses`,
  },
  REDIS_MESSAGE_KYES: {
    COMMAND: 'command',
    REQUEST_ID: 'request_id',
    PARAMS: 'params',
    DEVICE_ID: 'device_id',
    DEVICE_IP: 'device_ip',
    DEVICE_PORT: 'device_port',
    DEVICE_TIMEOUT: 'device_timeout',
    DEVICE_USERNAME: 'device_username',
    DEVICE_PASSWORD: 'device_password',
  },
  COMMANDS: {
    // TODO : Reconnect device. build or consult to mostafa
    // TODO refresh info, talk to mostafa. I dont remember this command.
    // TODO : export info: what type of info? talk with Mostafa.
    DEVICE: {
      PING: 'ping',
      NEW_DEVICE: 'new_anviz_device',
      GET_DEVICE_ID: 'getDeviceId',
      GET_ALL_ATENDANCE_RECORDS: 'getAllAttendanceRecords',
      DOWNLOAD_ATTENDANCE_RECORDS: 'downloadAttendanceRecords',
      GET_ATTENDANCE_RECORDS: 'getAttendanceRecords',
      ERASE_ALL_ATENDANCE_RECORDS: 'eraseAllRecords',
      SET_ADVANCED_SETTINGS: 'setAdvancedSetting',
      SET_DEVICE_INFORMATION1: 'setInformation1',
      GET_INFORMATION1: 'getInformation1',
      GET_ADVANCED_SETTING: 'getAdvancedSetting',
      GET_DEVICE_MODEL_CODE: 'getDeviceModelCode',
      RESTART: 'delete_anviz_device',
      DELETE_USER_DATA: 'deleteUserData',
      GET_RECORD_INFORMATION: 'getRecordInformation',
    },
    FINGERPRINT: {
      ENROLL_FINGERPRINT: 'enrollFingerPrint',
      GET_FINGERPRINT_TEMPLATE: 'getFingerprintTemplate',
      GET_ALL_FINGERPRINT_TEMPLATES: 'getAllFingerPrintTemplates',
      UPLOAD_FINGERPRINT_TEMPLATE: 'uploadFingerprintTemplate',
    },
    STAFF: {
      REGISTER_NEW_STAFF: 'registerNewStaff',
      DELETE_ALL_STAFF_DATA: 'deleteAllStaffData',
      DOWNLOAD_ALL_STAFFS: 'downloadAllStaffs',
      UPLOAD_STAFF: 'uploadStaff',
      COPY_ALL_STAFFS: 'copyAllStaffs',
      CLEAR_ALL_STAFFS_FROM_DEVICE: 'clearAllStaffs',
      DELETE_STAFF_FINGERPRINT2: 'deleteStaffFingerprint2',
      DELETE_STAFF_FINGERPRINT1: 'deleteStaffFingerprint1',
    },
    REAL_TIME_RECORDS: 'realTimeRecord',
  },
};
