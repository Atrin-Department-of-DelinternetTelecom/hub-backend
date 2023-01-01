import axios, { Method } from 'axios';
import { trimEnd, trimStart } from 'lodash';

import FormData from 'form-data';
import { get as config } from '@config';
import { errors } from '@api/http/http_errors';

export const configureAntena = async (params: Record<string, unknown>) => {
  return request('api.php', params, 'POST');
};

const request = async (path: string, params = {}, method: Method = 'GET') => {
  const { token, endpoint } = config('config-bot');

  const url: string = trimEnd(endpoint, '/') + '/' + trimStart(path, '/');
  const query = { ...params, token };
  const formData = new FormData();

  // Append all parameters to FormData
  Object.entries(query).forEach(([key, value]) => {
    formData.append(key, String(value));
  });

  try {
    const response = await axios({
      method,
      url,
      headers: formData.getHeaders(),
      ...(method === 'GET' ? { params: query } : { data: formData }),
    });

    return response.data;
  } catch (error) {
    console.error(
      `[ConfigBot][request][${method}][${JSON.stringify(query)}]: ${
        error.message
      }`,
    );

    throw error.response?.status !== 400
      ? new errors.InternalServerError(error.message)
      : new errors.BadRequest(error.response?.data?.error ?? error.message);
  }
};
