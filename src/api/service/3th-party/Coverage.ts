import axios, { AxiosError, AxiosResponse, Method } from 'axios';
import { trimEnd, trimStart } from 'lodash';

import { get as config } from '@config';
import { createHash } from 'crypto';
import { errors } from '@api/http/http_errors';
import moment from 'moment';
import to from 'await-to-js';

export const addresses = async (searchParams: Record<string, string>) => {
  return request('coverage/hub', {
    ...searchParams,
    location: `${searchParams.lat},${searchParams.long}`,
  });
};

export const cities = async (search: string) => {
  return request('coverage/hub', { municipality_query: search }, 'POST');
};

export const roads = async (search: string, city: string) => {
  return request(
    'coverage/hub',
    { municipality_id: city, road_query: search },
    'POST',
  );
};

const request = async (path: string, params = {}, method: Method = 'GET') => {
  const url: string =
    trimEnd(config('xarxa.api', 'localhost'), '/') + '/' + trimStart(path, '/');

  const [error, response] = await to(
    axios({
      method,
      url,
      params: { ...params, _token: token() },
    }),
  );

  if (error) {
    console.error(`[Coverage][request]: ${error.message}`);
  }

  return error ? [] : response.data.data;
};

export const token = () => {
  const secret = config('xarxa.secret', '');

  return createHash('md5')
    .update(`${secret}_${moment().startOf('hour').utc().unix()}`)
    .digest('hex');
};
