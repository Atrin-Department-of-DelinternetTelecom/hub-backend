import assert from 'assert';
import { get as config } from '@config';
import { download } from '@lib/s3';

const signatures: Record<string, Buffer | undefined> = {
  delinternet: undefined,
  aire: undefined,
};

export async function getDelSignature(): Promise<Buffer> {
  if (signatures.delinternet === undefined) {
    signatures.delinternet = await getSignature('signatureDel.png');
  }

  return signatures.delinternet;
}

export async function getAireSignature(): Promise<Buffer> {
  if (signatures.aire === undefined) {
    signatures.aire = await getSignature('AireSignature.png');
  }

  return signatures.aire;
}

export async function getSignature(signature: string): Promise<Buffer> {
  const file = await download(
    config('delinternet.bucketName'),
    `${config('delinternet.signatures')}/${signature}`,
  );

  assert(file, `Signature file [${signature}] not found`);

  return file;
}
