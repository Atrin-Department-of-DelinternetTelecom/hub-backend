import { intranet } from '@models';
const { GfAireCdr2, LemonCdrStatus } = intranet;

import { Op } from 'sequelize';

import moment from 'moment';

import {
  csvCdr,
  defs,
  cdr,
  file,
  serviceConverter,
  serviceType,
} from './types/LemonCdrType';

import JSZip from 'jszip';

import config from '@config';

import assert from 'assert';

import ftp from 'ftp';

import to from 'await-to-js';

import { bufferFromReadableWithoutSize } from '@lib/s3';

async function deleteLemonData(date: string) {
  await GfAireCdr2.destroy({
    where: {
      date: {
        [Op.between]: [
          moment(date).startOf('day').format('YYYY-MM-DD HH:mm:ss'),
          moment(date).endOf('day').format('YYYY-MM-DD HH:mm:ss'),
        ],
      },
      descripcion: { [Op.like]: '%(L) %' },
    },
  });
}

async function getFileThroughFtp(
  fileName: string,
  date: string,
): Promise<Buffer> {
  const host = config.get('index.lemon.ftp.host') as string;
  assert(host, 'lemon ftp config not set');

  const port = config.get('index.lemon.ftp.port') as string;
  assert(port, 'lemon ftp config not set');

  const username = config.get('index.lemon.ftp.username') as string;
  assert(username, 'lemon ftp config not set');

  const password = config.get('index.lemon.ftp.password') as string;
  assert(password, 'lemon ftp config not set');

  const client = new ftp();

  const ftpConfig: ftp.Options = {
    host,
    port: Number(port),
    user: username,
    password,
  };

  await new Promise<void>((resolve, reject) => {
    client.on('ready', resolve);
    client.on('error', reject);
    client.connect(ftpConfig);
  });

  const stream = await new Promise<NodeJS.ReadableStream>((resolve, reject) => {
    client.get(
      `${moment(date).format('YYYYMM')}/${fileName}`,
      (err, stream) => {
        if (err) reject(err);
        else resolve(stream);
      },
    );
  });
  const bufferedData = await bufferFromReadableWithoutSize(stream);

  client.end();

  return bufferedData;
}

async function extractFilesFromZip(zipFile: Buffer) {
  const zip = new JSZip();
  const zipFiles = await zip.loadAsync(zipFile);

  const fileAndBuffer: file[] = [];

  for (const [name, extractedZipFile] of Object.entries(zipFiles.files)) {
    const data = (await extractedZipFile.async('nodebuffer')).toString('utf-8');
    fileAndBuffer.push({ name, data });
  }

  return fileAndBuffer;
}

async function getCsvFiles(date: string): Promise<file[]> {
  const fileName = `cdr_${moment(date).format('YYYYMMDD')}_Delinternet.zip`;

  const zipFile = await getFileThroughFtp(fileName, date);

  return extractFilesFromZip(zipFile);
}

function convertCsvFileToListOfCDRs(strigifyedCsv: string): csvCdr[] {
  const [headerLine, ...bodyLines] = strigifyedCsv.split('\n');
  bodyLines.pop();

  const result = [];
  const headers = headerLine.split(';');
  for (const line of bodyLines) {
    const obj: Record<string, string> = {};
    const currentLine = line.split(';');

    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentLine[j];
    }
    result.push(obj);
  }
  return result as csvCdr[];
}

function createInsertableObject(csvCdr: csvCdr, serviceType: serviceType): cdr {
  return {
    date: csvCdr.day,
    serviceType,
    fecha: csvCdr.parseDate,
    segundos: Number(csvCdr.trafficUnits),
    importe: csvCdr.amountCharged,
    origen: csvCdr.msisdn,
    destino: csvCdr.destination,
    descripcion: `(L) ${defs[csvCdr.destinationPattern] ?? ''}`,
  };
}

function extractCDRsPerFile(fileInfo: file): cdr[] {
  const nameInfo = fileInfo.name.split('_');
  const serviceType = serviceConverter[`${nameInfo[1]}_${nameInfo[2]}`];
  const cdrs: cdr[] = [];
  if (serviceType) {
    const csvCdrs: csvCdr[] = convertCsvFileToListOfCDRs(
      fileInfo.data.toString(),
    );

    csvCdrs.reduce((acc, csvCdr) => {
      acc.push(createInsertableObject(csvCdr, serviceType as serviceType));
      return acc;
    }, cdrs);
  }
  return cdrs;
}

async function getLemonCdrStatus(date: string) {
  const [lemonCdrStatus, created] = await LemonCdrStatus.findOrCreate({
    where: {
      date: moment(date).startOf('day').format('YYYY-MM-DD'),
    },
    defaults: {
      status: 'pending',
      date: moment(date).startOf('day').format('YYYY-MM-DD'),
    },
  });

  return lemonCdrStatus;
}

async function extractCDRsProcess(date: string) {
  await deleteLemonData(date);

  const files = await getCsvFiles(date);

  const cdrs = files.reduce((acc, fileInfo) => {
    acc.push(...extractCDRsPerFile(fileInfo));
    return acc;
  }, [] as cdr[]);

  await GfAireCdr2.bulkCreate(cdrs);
}

export async function extractCDRs(date: string) {
  const lemonCdrStatus = await getLemonCdrStatus(date);

  if (lemonCdrStatus.state === 'started')
    throw new Error('lemon cdr status is already started');

  lemonCdrStatus.state = 'started';
  await lemonCdrStatus.save();

  const [error, result] = await to(extractCDRsProcess(date));

  if (error) {
    lemonCdrStatus.errorMessage = error.message;
    lemonCdrStatus.state = 'error';
    await lemonCdrStatus.save();
    throw new Error(error.message);
  }

  lemonCdrStatus.state = 'done';
  await lemonCdrStatus.save();

  return 'lemon cdrs imported successfully';
}
