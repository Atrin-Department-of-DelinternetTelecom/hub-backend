'use strict';

import axios, { AxiosError, AxiosResponse, Method } from 'axios';

import { Address6 } from 'ip-address';
import _ from 'lodash';
import assert from 'assert';
import config from '@config';
import crypto from 'crypto';
import isIp from 'is-ip';
import { serialize } from 'locutus/php/var';

interface InternalError {
  success: false;
  apiError: false;
  error: Error;
}
interface APIError {
  success: false;
  apiError: true;
  error: any;
}

interface Response<T> {
  success: true;
  data: T;
}

export interface PaginationItem {
  username: string;
  password: string;
  groupname: string;
  static_ip: string | null;
  ipv6_prefix: string | null;
  RadiusServer: string | null;
  First_connection: string | null;
  Last_up: string | null;
  Last_down: string | null;
  Active_connections: number;
  ClientSRC: string | null;
  ClientWAN: string | null;
  AcctSessionID: string | null;
  speed_up: string | null;
  speed_down: string | null;
  type: string | null;
}

export interface UserData {
  general: {
    username: string;
    password: string;
    groupname: string;
    static_ip: string | null;
    ipv6_prefix: string | null;
    speed_up: string;
    speed_down: string;
    type: string;
  };
  connection: {
    status: true;
    data: {
      RadiusServer: string;
      First_connection: string;
      Last_up: string;
      Last_down: string | null;
      Active_connections: string;
      ClientSRC: string;
      ClientWAN: string;
      AcctSessionID: string;
    };
  };
}

interface Meta {
  code: number;
  status: string;
  message: string;
}

class RadiusApiService {
  static instance: RadiusApiService | null = null;
  private conf: {
    server: string;
    key: string;
    headerTag: string;
    seed: string;
    readonly: boolean;
  };
  constructor() {
    this.conf = {
      server: config.get('index.radius.endpoint'),
      key: config.get('index.radius.key'),
      headerTag: config.get('index.radius.headerTag', 'X-ACCESS-TOKEN'),
      seed: config.get('index.radius.apiSeed'),
      readonly: config.get('index.radius.readOnly', true),
    };
  }

  static getInstance(): RadiusApiService {
    this.instance = this.instance || new RadiusApiService();
    return this.instance;
  }

  isConfigured() {
    return _.has(this.conf, 'server');
  }

  ensureIsConfigured() {
    assert(this.isConfigured(), 'Radius Not Configured');

    return this;
  }

  /** 
    {
        success: true,
        data: {
            meta: { code: 200, status:'Success', message: 'ok'},
            data: {
                general: {
                    username:'DeltFustesMauri',
                    password: 'eutimio',
                    groupname: '1000MP',
                    static_ip: null,
                    ipv6_prefix: null,
                    speed_up: '1000',
                    speed_down: '1000',
                    type: 'private'
                },
                connection: {
                    status: true,
                    data: {
                        RadiusServer:'10.36.255.80',
                        First_connection: '2019-05-22 18:33:14',
                        Last_up: '2021-12-23 07:29:36',
                        Last_down: null,
                        Active_connections: m1,
                        ClientSRC: 'c0:bf:c0:e9:0d:62',
                        ClientWAN: '100.64.30.63',
                        AcctSessionID: 'RouCPE8002010100000004992c6AAAAAS'
                    }
                }
            }
        }
    }

    {
        success: false,
        error: {
            data: {
                meta: {
                    code: 422,
                    status: "Unprocessable Entity",
                    message: "This user not exists.",
                },
                data: {
                    user: "This user not exists.",
                }
            }
        }
    }
    */
  static async getUserData(
    radiusName: string,
  ): Promise<
    APIError | InternalError | Response<{ data: UserData; cached: boolean }>
  > {
    const api = this.getInstance();
    radiusName = radiusName.trim();
    const res = await api.#_go<{ data: UserData; cached: boolean }>(
      '/user/' + encodeURIComponent(radiusName),
      {},
      'GET',
    );
    if (!res.success) {
      return res;
    }
    const _res = { ...res.data };
    _res.cached = true;
    return res;
  }

  /**
     * Return list of users that their radius name are 
     * like givven pattern
     * 
     * @param {String} pattern 
     * @returns response of api call
     * 
     * 
    {
        success: true,
        data: {
            meta: {
                code: 200,
                status: "Success",
                message: "ok",
            },
            data: {
                limit: 5,
                found: 2,
                users: [
                    {
                        general: {
                            username: "RiuMauri",
                            password: "jordi",
                            groupname: "17MP",
                            static_ip: null,
                            ipv6_prefix: null,
                            speed_up: "5",
                            speed_down: "17",
                            type: "private",
                        },
                        connection: {
                            status: true,
                            data: {
                                RadiusServer: "10.36.255.70",
                                First_connection: "2019-10-03 22:07:05",
                                Last_up: "2022-01-11 14:29:03",
                                Last_down: null,
                                Active_connections: 1,
                                ClientSRC: "10.140.25.111",
                                ClientWAN: "100.64.28.51",
                                AcctSessionID: "81686a12",
                            },
                        },
                    },
                ],
            }
        },
    }
    */

  static async getUserLike(pattern: string) {
    const api = this.getInstance();
    pattern = pattern.trim();
    return api.#_go('/user/magic/' + encodeURIComponent(pattern), {}, 'GET');
  }

  /**
     * 
     * (1): need to be destroyed last static ip and set again?
     * 
     {
        success: true,
        data: {
            meta: {
                code: 200,
                status: "Success",
                message: "ok",
            },
            data: {
                username: "N-C5245",
                ip: "93.114.249.222",
            },
        },
     }
    */
  static async setStaticIP(radiusName: string, ip: string) {
    if (!isIp(ip)) {
      throw new Error('IP is not valid');
    }
    const api = this.getInstance();
    radiusName = radiusName.trim();

    await this.destroyIP(radiusName);

    const res = await api.#_go(
      '/ip/' + encodeURIComponent(radiusName) + '/' + ip,
      {},
      'POST',
    );

    return res;
  }

  /**
     * Remove an static ip from 
     * @param {String} radiusName
     * @returns {Promise<any>} response of api call
     * 
        {
            success: true,
            data: {
                meta: {
                    code: 200,
                    status: "Success",
                    message: "ok",
                },
                data: {
                    status: true,
                    data: {
                        username: "N-C5245:: destroy",
                    },
                },
            },
        }
    */
  static async destroyIP(radiusName: string) {
    const api = this.getInstance();
    radiusName = radiusName.trim();
    return api.#_go('/ip/' + encodeURIComponent(radiusName), {}, 'DELETE');
  }

  static async setIpv6(radiusName: string, ipv6: string) {
    if (!new Address6(ipv6).isCorrect()) {
      throw new Error('IP is not valid IPV6');
    }

    const api = this.getInstance();
    radiusName = radiusName.trim();

    await this.destroyIPv6(radiusName);

    const res = await api.#_go(
      '/ip6/' + encodeURIComponent(radiusName) + '/' + ipv6,
      {},
      'POST',
    );

    return res;
  }

  /**
     * Remove an ipv6 from 
     * @param {String} radiusName
     * @returns {Promise<any>} response of api call
     * 
        {
            success: true,
            data: {
                meta: {
                    code: 200,
                    status: "Success",
                    message: "ok",
                },
                data: {
                    status: true,
                    data: {
                        username: "N-C5245:: destroy",
                    },
                },
            },
        }
    */
  static async destroyIPv6(radiusName: string) {
    const api = this.getInstance();
    radiusName = radiusName.trim();
    return api.#_go('/ip6/' + encodeURIComponent(radiusName), {}, 'DELETE');
  }

  static async getUsers() {
    const api = this.getInstance();
    const res = await api.#_go('/users', {}, 'GET');
    return res;
  }

  static async paginate(
    perPage = 50,
    page = 1,
  ): Promise<{
    success: boolean;
    data: {
      meta: {
        code: number;
        status: string;
        message: string;
      };
      data: {
        items: PaginationItem[];
        total: number;
      };
    };
  }> {
    const api = this.getInstance();
    const res = await api.#_go<{
      meta: {
        code: number;
        status: string;
        message: string;
      };
      data: {
        items: PaginationItem[];
        total: number;
      };
    }>('/users/paginate', { perPage, page }, 'GET');

    if (res.success === false) {
      throw res.error;
    }

    return res;
  }

  /**
     * Create new user on radius server
     * 
     * (1): for setting static ip we have to change
     * the profile to public - normal users profile 
     * are private back to ngNAT in network structure
     * 
     * 
    {
        success: true,
        data: {
            meta: {
                code: 200,
                status: "Success",
                message: "ok",
            },
            data: {
                general: {
                    username: "NInternet-C987-C123",
                    password: "N-C5245_R",
                    groupname: "1000MP",
                    static_ip: null,
                    ipv6_prefix: null,
                    speed_up: "1000",
                    speed_down: "1000",
                    type: "private",
                },
                connection: {
                    status: false,
                    data: {
                       acct: "This user is not registred never in server XXX",
                    },
                },
            },
        },
    }

    {
        success: false,
        error: {
            meta: {
                code: 422,
                status: "Unprocessable Entity",
                message: "This user exists in database",
            },
            data: {
                user: "This user exists in database",
            }
        }
    }
    */
  static async createUser(data: {
    radiusName: string;
    password: string;
    up: string;
    down: string;
    isPrivate?: boolean;
  }) {
    const api = this.getInstance();
    data.radiusName = data.radiusName?.trim();
    return api.#_go(
      '/user',
      {
        username: data.radiusName,
        password: data.password,
        speed_up: data.up,
        speed_down: data.down,
        type: data.isPrivate ? 'Private' : 'Public',
      },
      'POST',
    );
  }

  /**
     * 
     * @param {String} radiusName 
     * @param {int} up upload speed
     * @param {int} down download speed
     * @param {boolean} isPrivate (1)
     * @param {string} password (2)
     * @returns {Object} response of api call
     * 
     * (1): profile is public or private 
     * - static ip requires public profile
     * 
     * (2): new password that needs to be changed 
     * - if no password has been passed old one will be set
     * 
     * 
    {
        success: true,
        data: {
            meta: {
                code: 200,
                status: "Success",
                message: "ok",
            },
            data: {
                general: {
                    username: "N-C5245",
                    password: "N-C5245_P",
                    groupname: "1000M",
                    static_ip: "93.114.249.222",
                    ipv6_prefix: null,
                    speed_up: "1000",
                    speed_down: "1000",
                    type: "public",
                },
                connection: {
                    status: true,
                    data: {
                        RadiusServer: "10.36.255.80",
                        First_connection: "2020-03-15 19:57:27",
                        Last_up: "2021-12-01 10:51:38",
                        Last_down: null,
                        Active_connections: 1,
                        ClientSRC: "80:d4:a5:34:2a:8d",
                        ClientWAN: "100.64.19.39",
                        AcctSessionID: "RouCPE800201010000000fc7d42AAACTf",
                    },
                },
            },
        },
    }
    */
  static async setUserSpeed(
    radiusName: string,
    up: string,
    down: string,
    isPrivate = true,
    password: string,
  ) {
    const api = this.getInstance();
    radiusName = radiusName.trim();
    const userData = await this.getUserData(radiusName);
    if (!_.has(userData, 'success') && !userData.success) {
      return userData;
    }
    return api.#_go(
      '/user/' + encodeURIComponent(radiusName),
      {
        //TODO what the fuck is going here! password passed as boolean but here
        //will be set instead of password
        password: !_.isUndefined(password)
          ? password
          : _.get(userData, 'data.data.general.password'),
        speed_up: up,
        speed_down: down,
        type: isPrivate ? 'Private' : 'Public',
      },
      'PUT',
    );
  }

  /**
     * Delete a user from radius server
     * 
     * @param {string} radiusName 
     * @returns response of api call
     * 
     * 
     * Next object result is not success but in 
     * fact the user has been deleted and only 
     * result of coa was not successfull to disconnect 
     * the user from radius server
    {
        success: false,
        error: {
            meta: {
                code: 422,
                status: "Unprocessable Entity",
                message: "Problems with radius acct",
            },
            data: {
                reason: "This user is not registred never in server XXX",
            }
        },
        url: "/user/NInternet-C987-C123[DELETE]",
    }
    */
  static async delete(radiusName: string) {
    const api = this.getInstance();
    radiusName = radiusName.trim();
    const res = await api.#_go(
      '/user/' + encodeURIComponent(radiusName),
      {},
      'DELETE',
    );
    return res;
  }

  /**
   * COA is router disconnection signal
   * find last connection and request to
   * radius of that special connection
   * then disconnect all connection
   *
   * @param {String} radiusName
   * @returns response of api call
   *
   *
   */
  static async coa(radiusName: string) {
    const api = this.getInstance();
    radiusName = radiusName.trim();
    return api.#_go('/user/coa/' + encodeURIComponent(radiusName), {}, 'POST');
  }

  /**
     * Block the user and disconnect the connection
     * 
     * @param {string} radiusName 
     * @returns response of api call
     * 
     * 
     {
        success: true,
        data: {
            meta: {
                code: 200,
                status: "Success",
                message: "ok",
            },
            data: {
                general: {
                    username: "NInternet-C987-C123",
                    password: "N-C5245_R",
                    groupname: "IMPAGAT",
                    static_ip: null,
                    ipv6_prefix: null,
                    speed_up: "0",
                    speed_down: "0",
                    type: "private",
                },
                connection: {
                    status: false,
                    data: {
                        acct: "This user is not registred never in server XXX",
                    }
                }
            }
        },
    }
    */
  static async block(radiusName: string) {
    const api = this.getInstance();
    radiusName = radiusName.trim();
    return api.#_go(
      '/user/block/' + encodeURIComponent(radiusName),
      {},
      'POST',
    );
  }

  static ksort<T extends Record<string, unknown>>(obj: T): T {
    const keys = Object.keys(obj).sort() as (keyof T)[];
    const sortedObj: T = {} as T;

    for (const key of keys) {
      sortedObj[key] = obj[key];
    }

    return sortedObj;
  }
  async #_go<T extends Record<string, any>>(
    command: string,
    in_params: Record<string, unknown> = {},
    method: Method,
  ): Promise<InternalError | APIError | Response<T>> {
    if (this.conf.readonly && method.toUpperCase() !== 'GET') {
      console.warn(`RadiusClient is readonly. can not call '${method}'`);
      throw new Error(`RadiusClient is readonly. can not call '${method}'`);
    }

    const seed = this.conf.seed;
    in_params.timestamp = Math.floor(Date.now() / 1000);
    let params: Record<string, unknown> = {};
    _.forOwn(in_params, (value, key) => {
      params[key] = String(value);
    });
    params = RadiusApiService.ksort(params);
    const serialized = serialize(params);
    const hash = crypto
      .createHash('sha256')
      .update(serialized + seed)
      .digest('hex');
    params.signature = hash;
    const res = await this.#go(command, params, method);
    if (axios.isAxiosError(res)) {
      if (!res.response || res.response.status >= 500) {
        console.error(`RadiusClientError`, new Error().stack, {
          command,
          params,
          request: {
            path: `${res.config.method}: ${res.config.url}`,
            headers: res.config.headers,
          },
          response: {
            status: res.response?.status,
            data: res.response?.data,
          },
        });
      }

      return {
        success: false,
        apiError: true,
        error: res.response?.data,
      };
    } else if (res instanceof Error) {
      return {
        success: false,
        apiError: false,
        error: res,
      };
    }
    return { success: true, data: res.data };
  }

  async #go(
    endPoint: string,
    params = {},
    method: Method,
  ): Promise<AxiosResponse | Error | AxiosError> {
    const url = this.conf.server + endPoint;

    const config = {
      timeout: 30 * 1000, //wait for 30 seconds
      headers: {
        [this.conf.headerTag]: this.conf.key,
        Accept: 'application/json',
      },
    };

    let data = {};
    switch (method) {
      case 'GET':
        data = { params: { ...params } };
        break;
      case 'POST':
      case 'PUT':
      case 'DELETE':
        data = { data: { ...params } };
        break;
    }
    try {
      return await axios.request({
        method,
        url,
        ...config,
        ...data,
        //when you are on development
        //enviroment you have to use
        //proxy server that has access
        //to radius-server api
        // ,
        // proxy: {
        //     protocol: 'http',
        //     host: 'localhost',
        //     port: 8787
        // }
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return error;
    }
  }
}

export default RadiusApiService;
