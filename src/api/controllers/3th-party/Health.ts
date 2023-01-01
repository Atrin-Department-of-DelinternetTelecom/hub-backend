import { Aire } from '@lib/sdk';
import Client from 'ssh2-sftp-client';
import { GfClient } from '@api/models/intranet/intranet_gf_clients';
import { GoogleMail } from '@api/service/google/Gmail';
import OperadorIvozService from '@api/service/intranet/OperadorIvozService';
import RadiusApiService from '@api/service/intranet/RadiusApiService';
import { Redis } from '@lib/cache';
import { createRoute } from '@api/utils/controller-factory';
import { get } from '@config';
import { lemon } from '@lib/lemon';
import moment from 'moment';
import { resolveBankData } from '@api/service/intranet/IbanService';
import { upload } from '@lib/s3';

const checkSftpHealth = async () => {
  const sftp = new Client();
  const { remotePath, ...connection } = get<Record<string, string>>('sftp');

  await sftp.connect(connection);
  // Check if we can list the remote directory
  await sftp.list(remotePath || '/');

  try {
    await sftp.end();
  } catch (error) {
    console.warn('[Healchcehck][sftp][end]', error);
  }
};

const checkGmailHealth = async () => {
  const gmail = new GoogleMail();

  await gmail.getListOfMessages(
    `from:caixaguissona@caixaguissona.com AND has:attachment`,
  );
};
const services = () => [
  {
    name: 'AIRE',
    check: () => Aire.RequestLine.count({}),
  },
  {
    name: 'LEMON',
    check: () => lemon.fee.getProductoDisponable(),
  },
  {
    name: 'REDIS',
    check: () => Redis.sear('health-check', 'health-check', 100, true),
  },
  {
    name: 'IBAN',
    check: () => resolveBankData('DE89370400440532013000'),
  },
  {
    name: 'IVOZ',
    check: () => OperadorIvozService.getNumbers(),
  },
  {
    name: 'RADIUS',
    check: () => RadiusApiService.paginate(1),
  },
  {
    name: 'SFTP',
    check: () => checkSftpHealth(),
  },
  {
    name: 'GMAIL',
    check: () => checkGmailHealth(),
  },
  {
    name: 'SEQUELIZE',
    check: () => GfClient.findOne(),
  },
  {
    name: 'S3',
    check: () =>
      upload(get('cache.drivers.s3.bucket'), 'health.txt', Buffer.from('OK')),
  },
];

export const getServiceStatus = createRoute({
  async handler(req, res) {
    const filteredService = req.query?.service;

    const servicesToCheck = filteredService
      ? services().filter((s) => s.name === filteredService.toUpperCase())
      : services();

    const requests = await Promise.allSettled(
      servicesToCheck.map((s) => s.check()),
    );

    const dependencies = servicesToCheck.map((s, i) => ({
      name: s.name,
      status: requests[i].status === 'fulfilled' ? 'OK' : 'NOK',
      reason: requests[i].status === 'fulfilled' ? null : requests[i].reason,
    }));

    if (dependencies.find(({ status }) => status === 'NOK')) {
      console.error(dependencies);
    }

    res.status(200).json({
      service: 'hub',
      status: dependencies.every(({ status }) => status == 'OK') ? 'OK' : 'NOK',
      date: moment().toISOString(),
      dependencies,
    });
  },
});
