import { AireLine, AireRequestLine } from './AireService';
import { Line, RequestLine } from '@delinternet/sdk-aire';

import { AireRequest } from '@api/models/global/global_aire_requests';
import { GfAireContract } from '@api/models/intranet/intranet_gf_aire_contracts';
import { handle as RevisionCellContracts } from './Actions/RevisionCellContracts';
import assert from 'assert';
import { serialize } from 'locutus/php/var';

export const revisionClient = async (fiscalId: string, userId = 0) => {
  assert(fiscalId, `Invalid fiscal id [${fiscalId}]`);
  // update request
  await revisionAireRequests(await AireRequestLine.findAll({ fiscalId }));
  // update lines
  const aireContracts = await revisionAireLines(
    await AireLine.findAll({ fiscalId }),
  );
  // then update contracts
  await RevisionCellContracts(
    await GfAireContract.findAll({
      where: { id: aireContracts.map(({ id }) => id) },
    }),
    userId,
  );
};

export const revisionNumber = async (telefono: string, userId = 0) => {
  assert(telefono, `Invalid number [${telefono}]`);
  // update request
  await revisionAireRequests(await AireRequestLine.findAll({ telefono }));
  // update lines
  const aireContracts = await revisionAireLines(
    await AireLine.findAll({ telefono }),
  );
  // then update contracts
  await RevisionCellContracts(
    await GfAireContract.findAll({
      where: { id: aireContracts.map(({ id }) => id) },
    }),
    userId,
  );
};

export const revisionAireLines = async (rows: Line[]) => {
  const aireContracts = await GfAireContract.findAll({
    where: { id_linea: rows.map(({ id_linea }) => id_linea) },
    attributes: ['id', 'id_linea'],
    raw: true,
  });
  // destroy invalid rows
  await GfAireContract.destroy({ where: { id_linea: null } });
  // update or create rows
  return GfAireContract.bulkCreate(
    rows.map((aireLine) => {
      const row: Record<string, string | number | boolean> = {
        id_linea: aireLine.id_linea,
        number: aireLine.telefono.trim(),
        active: aireLine.activo === 'SI',
        siglas: aireLine.tarifa[0]?.siglas,
        aireData: serialize(aireLine),
      };

      const aireContract = aireContracts.find(
        ({ id_linea }) => aireLine.id_linea === id_linea,
      );

      if (aireContract !== undefined) {
        row.id = aireContract.id;
      }

      return row;
    }),
    {
      updateOnDuplicate: ['active', 'siglas', 'aireData'],
    },
  );
};

export const revisionAireRequests = async (rows: RequestLine[]) => {
  const aireRequests = await AireRequest.findAll({
    where: { code: rows.map(({ cod }) => cod) },
    attributes: ['id', 'code'],
    raw: true,
  });
  // update or create rows
  return AireRequest.bulkCreate(
    rows.map((requestLine) => {
      const row: Record<string, string | number | boolean> = {
        code: requestLine.cod,
        number: requestLine.telefono.trim(),
        fiscal_id: requestLine.fiscalId.trim(),
        request: JSON.stringify(requestLine),
      };

      const aireRequest = aireRequests.find(
        ({ code }) => requestLine.cod === code,
      );

      if (aireRequest !== undefined) {
        row.id = aireRequest.id;
      }

      return row;
    }),
    {
      updateOnDuplicate: ['request'],
    },
  );
};
