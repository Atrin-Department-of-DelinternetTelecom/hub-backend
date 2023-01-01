import { getBucket, guessBucketName } from '@lib/minIO';

import { File } from '@utils/controller-factory';
import assert from 'assert';
import { bufferFromReadable } from '@lib/s3';
import { get as config } from '@config';
import { errors } from '@api/http/http_errors';
import mime from 'mime-types';
import to from 'await-to-js';
import { v4 } from 'uuid';

const getBucketURL = (bucketName: string) => {
  const bucket: string = config(`index.minIoBuckets.${bucketName}`);
  assert(bucket, `Bucket [${bucketName}] is not configured`);

  return bucket;
};

export const downloadFile = async function (filename: string, bucket: string) {
  const bucketURL = getBucketURL(bucket);
  const bucketName = guessBucketName(bucketURL);
  const minioClient = await getBucket(bucketURL);

  const [statErr, stat] = await to(
    minioClient.statObject(bucketName, filename),
  );
  const [err, readable] = await to(minioClient.getObject(bucketName, filename));
  if (err || statErr) {
    throw new errors.InternalServerError('could not download file');
  }

  const data = await bufferFromReadable(stat.size, readable);

  return {
    filename,
    data,
  };
};

export interface Uploadable {
  data: Buffer;
  mimetype: string;
  name: string;
}

export const uploadFile = async function (
  bucket: string,
  file: Uploadable,
  useV4FileName = true,
) {
  // check if the file is valid
  if (!file) throw new errors.NotFound(`invalid file`);
  // prepare the bucket and filename
  const bucketURL = getBucketURL(bucket);
  const filename = useV4FileName ? filenameFromUploadable(file) : file.name;
  const minioClient = await getBucket(bucketURL);
  // move to the bucket
  await minioClient.putObject(guessBucketName(bucketURL), filename, file.data);
  // return the file name
  return { filename };
};

export const filenameFromUploadable = function (file: Uploadable) {
  return `${v4()}.${mime.extension(
    file.mimetype ?? mime.contentType(file.name),
  )}`;
};

export const deleteFile = async function (filename: string, bucket: string) {
  const bucketURL = getBucketURL(bucket);
  const bucketName = guessBucketName(bucketURL);
  const minioClient = await getBucket(bucketURL);
  await minioClient.removeObject(bucketName, filename);
};

export const getListOfObjects = async function (bucket: string) {
  const bucketURL = getBucketURL(bucket);
  const bucketName = guessBucketName(bucketURL);
  const minioClient = await getBucket(bucketURL);
  const readable = await minioClient.listObjects(bucketName, '', true);
  const objectArray: any = [];
  readable.on('data', (obj) => {
    objectArray.push(obj);
  });

  await new Promise((resolve, reject) => {
    readable.on('end', resolve);
    readable.on('error', reject);
  });

  return objectArray.map((obj: any) => obj.name);
};
