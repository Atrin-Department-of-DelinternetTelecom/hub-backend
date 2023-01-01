import assert from 'assert';
import { errors } from '@api/http/http_errors';
import { validateIBAN as fastIban } from 'fast-iban';
import { get } from '@config';
import { validateIBAN as ibanTools } from 'ibantools';
import { isValid } from 'iban';
import { respondSuccess } from '@utils/response';

export const validationEndpoint = (iban: string) => {
  return get<string>('index.ibanValidator').replace('__IBAN__', iban);
};

export const resolveBankData = async (iban: string) => {
  const response = await fetch(validationEndpoint(iban));

  if (response.ok) {
    return response.json();
  }

  throw new Error(response.statusText);
};

export const validateIban = async (iban: string) => {
  assert(
    isValid(iban) && ibanTools(iban) && fastIban(iban),
    new errors.BadRequest('The IBAN entered is invalid.'),
  );

  try {
    return respondSuccess(await resolveBankData(iban));
  } catch (error) {
    console.error(error);
  }

  return respondSuccess({ bic: '', bank: '' });
};
