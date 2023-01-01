import { Client } from 'minio';
import assert from 'assert';

const buckets: Record<string, Client> = {};

export const parseBucketUri = (bucketURI: string) => {
  const minioUrl = new URL(bucketURI);
  return {
    hostname: minioUrl.hostname,
    port: minioUrl.port,
    username: minioUrl.username,
    password: minioUrl.password,
    protocol: minioUrl.protocol,
  };
};

export const newClient = (bucketURI: string) => {
  assert(bucketURI, 'minIO is not defined');
  const { hostname, port, username, password, protocol } =
    parseBucketUri(bucketURI);

  return new Client({
    endPoint: hostname,
    port: Number(port ?? 9000),
    useSSL: protocol.startsWith('https'),
    accessKey: decodeURIComponent(username),
    secretKey: decodeURIComponent(password),
  });
};

export const guessBucketName = (bucketURI: string) => {
  const { pathname } = new URL(bucketURI);
  return pathname?.replace('/', '');
};
/**
 * @alias guessBucketName
 */
export const bucketName = (bucketURI: string) => {
  return guessBucketName(bucketURI);
};

export const findOrCreateBucket = async (bucketURI: string) => {
  const client = newClient(bucketURI);
  const exists = await client.bucketExists(bucketName(bucketURI));

  if (!exists) {
    await client.makeBucket(bucketName(bucketURI));
  }

  return client;
};

export const getBucket = async (bucketAddress: string) => {
  if (!buckets[bucketAddress]) {
    buckets[bucketAddress] = await findOrCreateBucket(bucketAddress);
  }

  return buckets[bucketAddress];
};
