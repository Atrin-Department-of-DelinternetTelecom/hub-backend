import axios, { Method } from 'axios';
import { get as config, isLocal } from '@config';

import { Redis } from '@lib/cache';

class Client {
  constructor(
    protected config: {
      username: string;
      password: string;
      endpoint: string;
    },
  ) {
    //
  }
  async updateUser(
    users: Array<{
      email: string;
      username: string;
      password: string;
      user_id: number;
      enable: number;
    }>,
  ) {
    return this.post('/api/resources/users/actions/import-hub-users', {
      users,
    });
  }

  async findUser(id: number) {
    const { data } = await this.get(`/api/resources/users/${id}`);

    return data.fields;
  }

  protected post(uri: string, data = {}) {
    return this.request(uri, 'POST', data);
  }

  protected get(uri: string) {
    return this.request(uri, 'GET');
  }

  protected async request(uri: string, method: Method, payload = {}) {
    const token = await this.attempt();
    const { data } = await axios({
      url: this.url(uri),
      method,
      data: payload,
      timeout: 10000,
      headers: {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    return data;
  }

  protected async attempt(): Promise<string> {
    const { data } = await axios.post(
      this.url('api/login'),
      { email: this.config.username, password: this.config.password },
      {
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      },
    );

    return data.data.token;
  }

  protected url(uri: string): string {
    return `${this.config.endpoint.replace(/\/+$/, '')}/${uri.replace(
      /^\/+/,
      '',
    )}`;
  }
}

export const Axes = new Client({
  endpoint: config('auth.api.endpoint'),
  username: config('auth.api.username'),
  password: config('auth.api.password'),
});

export default Axes;
