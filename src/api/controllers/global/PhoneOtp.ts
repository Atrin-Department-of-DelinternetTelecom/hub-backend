import { createRoute } from '@api/utils/controller-factory';
import * as PhoneOtpService from '@service/global/PhoneOtpService';

export const sendOTPMessage = createRoute({
  async handler(req) {
    const phone = req.body.phone;

    await PhoneOtpService.sendOTPMessage(phone);
  },
});

export const info = createRoute({
  async handler(req) {
    const phone = req.swagger.params.phone.value;

    return PhoneOtpService.info(phone);
  },
});

export const verify = createRoute({
  async handler(req) {
    await PhoneOtpService.verify(req.body);
    return {
      ok: true,
    };
  },
});
