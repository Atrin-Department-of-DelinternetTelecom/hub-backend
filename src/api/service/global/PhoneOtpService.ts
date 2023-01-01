import { errors } from '@api/http/http_errors';
import { PhoneOtp } from '@api/models/global/global_phone_otp';
import { sendSingle } from '@api/utils/smspubli';
import { Op } from 'sequelize';

const TTL = 5 * 60 * 1000; // 5 minutes

class WRONG_OTP_CODE extends errors.BadRequest {
  type = 'WRONG_OTP_CODE';
}

class OTP_ALREADY_SENT extends errors.BadRequest {
  type = 'OTP_ALREADY_SENT';
}

class PHONE_NOT_FOUND extends errors.NotFound {
  type = 'PHONE_NOT_FOUND';
}

class OTP_NOT_FOUND extends errors.NotFound {
  type = 'OTP_NOT_FOUND';
}

async function findUnverifiedOTPByPhone(
  phone: string,
): Promise<PhoneOtp | null> {
  const otp = await PhoneOtp.findOne({
    where: {
      phone,
      verified: false,
      createdAt: {
        [Op.gte]: new Date(Date.now() - TTL),
      },
    },
  });
  return otp;
}

function generateRandomCode(): string {
  const codeLength = 6;
  const min = Math.pow(10, codeLength - 1);
  const max = Math.pow(10, codeLength) - 1;
  const randomCode = Math.floor(Math.random() * (max - min + 1)) + min;
  return randomCode.toString();
}

const formatPhone = (phone: string) => phone.replace(/[^\d]/g, '');
const renderMessage = (code: string) =>
  [
    'Benvingut a Delinternet!',
    '',
    `El teu codi d'autenticació és: ${code}.`,
    '',
    'Si no has sol·licitat aquest codi, ignora aquest missatge.',
    '',
    'Gràcies,',
    'Equip Delinternet',
  ].join('\n');

export async function sendOTPMessage(_phone: string): Promise<void> {
  const phone = formatPhone(_phone);
  const existingOTP = await findUnverifiedOTPByPhone(phone);

  if (existingOTP) {
    throw new OTP_ALREADY_SENT();
  }

  const code = generateRandomCode();

  await sendSingle({
    to: phone,
    text: renderMessage(code),
  });

  await PhoneOtp.create({ phone, code });
}

export async function info(_phone: string) {
  const phone = formatPhone(_phone);

  const otp = await findUnverifiedOTPByPhone(phone);
  if (!otp) throw new OTP_NOT_FOUND();

  return {
    expireAt: new Date(otp.createdAt.getTime() + TTL),
  };
}

export async function verify({
  phone: _phone,
  code,
}: {
  phone: string;
  code: string;
}): Promise<void> {
  const phone = formatPhone(_phone);

  const otp = await findUnverifiedOTPByPhone(phone);
  if (!otp) throw new PHONE_NOT_FOUND();
  if (otp.code !== code) throw new WRONG_OTP_CODE();

  await otp.update({
    verified: true,
  });
}
