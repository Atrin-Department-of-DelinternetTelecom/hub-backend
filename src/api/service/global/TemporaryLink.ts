/**
 * The goal of this service is to create temporary *public* links for a file
 */

import { client } from '@lib/redis';
import _random from 'crypto-random-string';

export interface CreateParams {
  pathname: string;
  ttl: number; // in seconds
}

const random = () => _random({ type: 'url-safe', length: 10 });

export async function create({ pathname, ttl }: CreateParams) {
  const token = random();

  await client.set(`tmp/${token}`, pathname, {
    EX: ttl,
  });

  return token;
}

export function get(key: string): Promise<string | null> {
  return client.get(`tmp/${key}`);
}
