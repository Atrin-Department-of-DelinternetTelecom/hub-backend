import { AnyModel, intranet } from '@api/models';
import { createFullEvent, getTaskByTrace } from './CrmTaskHelperService';

import { AireRequestLine } from './AireService';
import { GfContractDataCell } from '@api/models/intranet/intranet_gf_contract_data_cell';
import { RequestLine } from '@delinternet/sdk-aire';
import { Static } from '@lib/cache';
import { handle as SuspendContracts } from './Actions/SuspendContracts';
import assert from 'assert';
import { getSectionIdByCode } from './GfSectionService';
import { sendMessage } from './MessageService';
import { setDoneState } from './GfContractSectionStatusService';
import { tglExecute } from './CrmTaskService';

const { GfContractDataCellProviderComment, GfContract } = intranet;

interface CommentCreationParams {
  contractId: number;
  fecha: string;
  incidencia: string;
  raw: string;
  code: string;
}

/**
 * Get request-line from AIRE service for given request-code.
 */
export const getSolicitud = async function (
  codigo: string,
): Promise<RequestLine | null> {
  return AireRequestLine.findOne({
    codigo,
  });
};

export const syncStateChange = async (
  requestLine: RequestLine,
  dataCell: GfContractDataCell,
  userId = 0,
) => {
  if (dataCell.lastGetStateText !== requestLine.estado) {
    // store actualaire state on section
    await dataCell.update({ lastGetStateText: requestLine.estado });
  }

  if (requestLine.estado === 'PORTABILIDAD CANCELADA') {
    // portability failed
    await checkCancellationEvent(dataCell.contractId, userId);
  }

  if (requestLine.estado === 'ACTIVA') {
    await setDoneState(dataCell.contractId, await cellSectionId(), userId);
  }

  if (requestLine.estado === 'TERMINADA') {
    await SuspendContracts(
      await GfContract.findAll({ where: { id: dataCell.contractId } }),
      userId,
    );
  }
};

export const checkCancellationEvent = async (
  contractId: number,
  userId = 0,
) => {
  const event = await getTaskByTrace(
    `aire_requestLine_error_${contractId}_CELL`,
  );

  if (!event) {
    const createdEvent = await getTaskByTrace(
      `contractStateChanged/pendingSectionsReady_${contractId}_CELL`,
    );
    assert(createdEvent);

    await createFullEvent(
      'aire_requestLine_error',
      contractId,
      {
        motherTaskId: createdEvent.id,
        subject: 'Aire Error"',
        text: 'Som error has been occured on aire portability"',
        metadata: {},
      },
      'CELL',
      null,
      userId,
    );
  } else if (event.executed === 1) {
    // deexecute event
    await tglExecute(event.id, null, null, null, false, userId);
  }
};

export const syncComments = async (
  requestLine: RequestLine,
  dataCell: GfContractDataCell,
) => {
  const observations = requestLine.observaciones ?? [];
  if (observations.length === 0) return;

  const allComments = await GfContractDataCellProviderComment.findAll({
    where: { contractId: dataCell.contractId },
  });

  const commentCodes = allComments.map((comment) => comment.code);

  if (observations.length !== commentCodes.length) return;

  const createdEvent = await getTaskByTrace(
    `contractStateChanged/pendingSectionsReady_.${dataCell.contractId}_CELL`,
  );

  const comments = observations
    .filter((ob, key) => !commentCodes.includes(`${requestLine.cod}_${key}`))
    .map((ob, key) => ({
      contractId: dataCell.contractId,
      fecha: `${ob.fecha} ${ob.hora}`,
      incidencia: ob.incidencia,
      raw: JSON.stringify(ob),
      code: `${requestLine.cod}_${key}`,
    }));

  // if it's a "Ventana de cambio:" store on section
  // ex: Ventana de cambio: |25/06/2020
  await GfContractDataCellProviderComment.bulkCreate(comments);

  const mappCallback = async (comment: CommentCreationParams) => {
    if (String(comment.incidencia).startsWith('Ventana de cambio:')) {
      await dataCell.update({
        ventanaDeCambio: comment.incidencia,
      });
    }

    // add message from aire to event chat if exists
    if (createdEvent) {
      await sendMessage(
        `<b>Aire:</b> (<small>${comment.fecha}  </small>) <br>`,
        createdEvent.chatId,
        null,
        0,
      );
    }
  };

  await Promise.all(comments.map(mappCallback));
};

const cellSectionId = async () => {
  return Static.sear('SyncAireRequestLines:cellSectionId', async () => {
    return getSectionIdByCode('CELL');
  });
};
