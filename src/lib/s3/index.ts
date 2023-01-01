import {
  DeleteObjectCommand,
  GetObjectCommand,
  GetObjectCommandOutput,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import config from '@config';
import assert from 'assert';
import to from 'await-to-js';
import mime from 'mime-types';
import type { Readable } from 'stream';

interface S3Error extends Error {
  Code: string;
}

const accessKeyId = config.get('index.s3.accessKeyId', null);
const secretAccessKey = config.get('index.s3.secretAccessKey', null);
const endpoint = config.get('index.s3.endpoint', null);

export function bufferFromReadable(
  length: number,
  stream: Readable,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const b = Buffer.alloc(length);
    let i = 0;

    stream.on('data', (data) => {
      b.set(data, i);
      i += data.length;
    });

    stream.once('error', (error) => reject(error));
    stream.once('end', () => resolve(b));
  });
}

export function bufferFromReadableWithoutSize(
  stream: NodeJS.ReadableStream,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const b: Uint8Array[] = [];
    let i = 0;

    stream.on('data', (data) => {
      b.push(data);
      i += data.length;
    });

    stream.once('error', (error) => reject(error));
    stream.once('end', () => resolve(Buffer.concat(b)));
  });
}

const client = new S3Client({
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  region: 'us',
  endpoint,
  forcePathStyle: true,
});

export const upload = async (bucketName: string, key: string, data: Buffer) => {
  const res = await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: data,
      ContentType: mime.contentType(key) as string,
    }),
  );
  return res;
};

export const download = async (bucketName: string, key: string) => {
  const [error, response] = await to<GetObjectCommandOutput, S3Error>(
    client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      }),
    ),
  );

  if (error) {
    if (error.Code === 'NoSuchKey') return null;
    throw error;
  }

  assert(
    typeof response.ContentLength === 'number',
    'Content-Length in s3 respond not found',
  );
  return bufferFromReadable(response.ContentLength, response.Body as Readable);
};

export const remove = async (bucketName: string, key: string) => {
  await client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
};
