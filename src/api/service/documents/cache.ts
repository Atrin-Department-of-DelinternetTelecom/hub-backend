import { CachePackage, CachePackageBson } from './types';

import { Binary } from 'bson';
import { S3 } from '@lib/cache';

const CACHE_TTL = 100 * 24 * 60 * 60; // in seconds
const ENABLE_CACHE = true; // only for development purpose. should be always true in production

function serializePack({
  thumb,
  pdf,
  images,
  ...rest
}: CachePackage): CachePackageBson {
  return {
    ...rest,
    pdf: new Binary(pdf),
    thumb: new Binary(thumb),
    images: images.map((e) => new Binary(e)),
  };
}

function deserializePack({
  thumb,
  pdf,
  images,
  ...rest
}: CachePackageBson): CachePackage {
  return {
    ...rest,
    pdf: pdf.buffer,
    thumb: thumb.buffer,
    images: images.map((e) => e.buffer),
  };
}

export async function get(key: string): Promise<CachePackage | null> {
  if (!ENABLE_CACHE) return null;
  const _cache: CachePackageBson | null = await S3.get(key);

  if (!_cache) {
    console.debug('Cache missed for document with id:', key);
  } else {
    console.debug('reading document from cache for id:', key);
  }

  return _cache ? deserializePack(_cache) : null;
}

export async function cached(key: string) {
  return S3.has(key);
}

export async function set(key: string, pack: CachePackage): Promise<void> {
  if (!ENABLE_CACHE) return;
  await S3.forever(key, serializePack(pack));
}

export function clear(key: string) {
  return S3.forget(key);
}
