import {
  MovilData,
  MovilPortabilityData,
  ProductData,
  USAGE_STATUS,
  UsageData,
} from '@del-internet/lemon';
import { associateBy, pluck } from '@api/utils/collections';

import { LemonLine } from '@api/models/intranet/intranet_lemon_line';
import { Op } from 'sequelize';
import { handle as RevisionLemonContracts } from './Actions/RevisionLemonContracts';
import assert from 'assert';
import { firstPopulated } from '@api/utils/helpers';
import { lemon } from '@lib/lemon';
import moment from 'moment';
import pLimit from 'p-limit';
import to from 'await-to-js';

export const revisionClient = async (fiscalId: string, userId = 0) => {
  assert(fiscalId, `Invalid fiscal id [${fiscalId}]`);
  const [error, lines] = await to(lemon.cell.getCellByFiscalId(fiscalId));

  if (error === null) {
    assert(lines?.data, `Failed revision LEMON lines for client [${fiscalId}]`);
    // inactive lines that not found in the api
    await LemonLine.update(
      { active: 0, termination_date: moment().toISOString() },
      {
        where: {
          fiscal_id: fiscalId,
          number: { [Op.notIn]: pluck(lines.data, 'numero') },
        },
      },
    );
    // first revision our local data about the founded lines
    await revisionLemonLines(lines?.data);
  } else if (error.code === 404) {
    await LemonLine.update(
      { active: 0, termination_date: moment().toISOString() },
      { where: { fiscal_id: fiscalId } },
    );
  } else {
    throw error;
  }

  // then update contracts
  return RevisionLemonContracts(
    await LemonLine.findAll({ where: { fiscal_id: fiscalId } }),
    userId,
  );
};

export const revisionNumber = async (number: string, userId = 0) => {
  assert(number, `Invalid number [${number}]`);
  // update lines
  const { data } = await lemon.cell.getLines();
  const possibles = data.filter(({ numero }) => number == numero);
  // first revision our local data about lines
  if (possibles.length) {
    // update data if line found
    await revisionLemonLines(possibles);
  } else {
    // it means the line are suspended or not exists on the lemon
    await LemonLine.update(
      { active: 0, termination_date: moment().toISOString() },
      { where: { number } },
    );
  }
  // then update contracts
  return RevisionLemonContracts(
    await LemonLine.findAll({ where: { number } }),
    userId,
  );
};

export const revisionClientLocal = async (fiscalId: string, userId = 0) => {
  assert(fiscalId, `Invalid fiscal id [${fiscalId}]`);

  const localLines = await LemonLine.findAll({
    where: { fiscal_id: fiscalId },
  });

  // Optional guard: avoid wiping/altering contracts if local is empty
  assert(
    localLines.length > 0,
    `No local LemonLine data found for client [${fiscalId}]`,
  );

  return RevisionLemonContracts(localLines, userId);
};

export const revisionNumberLocal = async (number: string, userId = 0) => {
  assert(number, `Invalid number [${number}]`);

  const localLines = await LemonLine.findAll({ where: { number } });

  assert(
    localLines.length > 0,
    `No local LemonLine data found for number [${number}]`,
  );

  return RevisionLemonContracts(localLines, userId);
};

export const revisionLemonLines = async (lines: MovilData[]) => {
  const [reviewedLines, filteredLines] = await Promise.all([
    getReviewedLines(pluck(lines, 'numero')),
    getFilteredLinesByUsage(lines ?? []),
  ]);
  // limit concurrency to 5
  const limit = pLimit(5);
  const tasks = filteredLines.map(({ line, usage, product, portability }) => {
    return limit(async () => {
      const reviewedLine = reviewedLines[generateLineKey(line)];
      if (reviewedLine) {
        await updateLineUsage(usage, product, reviewedLine, line);
      } else {
        await createLineUsage(usage, product, line, portability);
      }
    });
  });

  await Promise.all(tasks);
  await checkTerminatedLines(lines.filter((line) => line.termination_date));
};

const checkTerminatedLines = async (lines: MovilData[]) => {
  await Promise.all(
    lines.map(async (line) => {
      if (isTerminated(line)) {
        return LemonLine.update(
          {
            termination_date: moment(line.termination_date).toISOString(),
            active: false,
          },
          { where: { number: line.numero, creation_date: line.creation_date } },
        );
      }
    }),
  );
};

const isTerminated = (line: MovilData) => {
  if (!line.termination_date) {
    return false;
  }

  return moment(line.termination_date).isBefore(moment());
};

const getReviewedLines = async (numbers: string[]) => {
  const lines = await LemonLine.findAll({
    where: { number: numbers },
    attributes: ['id', 'number', 'fiscal_id', 'creation_date'],
    raw: true,
  });

  return associateBy(lines, generateLineKey);
};

const generateLineKey = ({
  number,
  numero,
  fiscal_id,
  creation_date,
}: LemonLine | MovilData) => {
  return `${number ?? numero}-${fiscal_id}-${creation_date}`;
};

const getFilteredLinesByUsage = async (lines: MovilData[]) => {
  const filteredLines = [];

  for (const line of lines) {
    const [error, detail] = await to(getLemonDetail(line.numero));

    if (error) {
      console.error(
        `[LemonRevisionService][revisionLemonLines] Error getting detail for line [${line.numero}]`,
        error,
      );
      continue;
    }

    filteredLines.push({ line, ...detail });
  }

  return filteredLines;
};

const getLemonDetail = async (number: string) => {
  const [usage, product, portability] = await Promise.allSettled([
    lemon.cell.getCellUsageByNumber(number),
    lemon.fee.getPackageIdCell(number),
    lemon.cell.getPortabilityByNumber(number),
  ]);
  const detail = {
    usage: {} as UsageData,
    product: {} as ProductData,
    portability: [] as MovilPortabilityData[],
  };
  // set usage
  if (usage.status === 'rejected') {
    console.error(
      `Failed to retrieve line ${number} usage because of ${usage.reason}`,
    );
  } else {
    detail.usage = usage.value.data;
  }
  // set package
  if (product.status === 'rejected') {
    console.error(
      `Failed to retrieve  line ${number} package detail because of ${product.reason}`,
    );
  } else {
    detail.product = product.value.data;
  }
  // set portability
  if (portability.status === 'rejected') {
    console.error(
      `Failed to retrieve line ${number} portability status because of ${portability.reason}`,
    );
  } else {
    detail.portability = portability.value.data;
  }

  return detail;
};

const updateLineUsage = async (
  usage: UsageData,
  product: ProductData,
  targetLine: LemonLine,
  line: MovilData,
) => {
  await LemonLine.update(
    {
      active: isActiveOrPending(usage.status) && !isTerminated(line),
      data: usage,
      package: product,
    },
    { where: { id: targetLine.id } },
  );
};

const createLineUsage = async (
  usage: UsageData,
  product: ProductData,
  line: MovilData,
  portability: MovilPortabilityData[] = [],
) => {
  await LemonLine.create({
    number: line.numero,
    fiscal_id: line.fiscal_id,
    active: isActiveOrPending(usage.status) && !isTerminated(line),
    creation_date: firstPopulated([line.creation_date]),
    termination_date: firstPopulated([line.termination_date]),
    portable: portability.length > 0,
    package: product,
    data: usage,
  });
};

const isActiveOrPending = (status: USAGE_STATUS) => {
  return [USAGE_STATUS.ACTIVE, USAGE_STATUS.PENDING].includes(status);
};
