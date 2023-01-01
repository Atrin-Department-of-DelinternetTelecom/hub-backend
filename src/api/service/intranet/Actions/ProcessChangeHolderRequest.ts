import { AnyModel, intranet } from '@models';
import { CELL_PROVIDER_CODE, SERVICE } from '@api/constants/contracts';
import {
  CHNAGE_HOLDER_STATE,
  CHNAGE_HOLDER_STATE_OPTION,
} from '@api/constants/statuses';
import {
  ServiceRecord,
  findOrFail,
} from './Caches/GfContractSectionStatusCaches';

import { Aire } from '@lib/sdk';
import { Document } from '@api/models/global/global_document';
import assert from 'assert';
import { errors } from '@api/http/http_errors';
import { generateNextSchedulesLine } from '../Invoice_GfPointerService';
import { genericDocs } from '@api/service/documents/GfDocumentService';
import { getPdf } from '@api/service/documents/DocumentService';
import { getTargetClient } from './ChangeHolder';
import { infoChangeHolder } from '../CrmChangeHolderService';
import moment from 'moment';
import { onHolderChanged } from '../GfDiscountsExecuteService';
import { provider } from '../Contract/helpers';
import { updateAllFromClient } from '../GfDiscountsPendingService';

const { GfContract, GfContractDocument, GfScheduledInvoiceLine, transaction } =
  intranet;

/**
 * Second step, search for documentation and if done consolide change
 */
export const handle = async (changeHolder: AnyModel, userId: number) => {
  await ensureOfDocument(changeHolder);
  const serviceRecord = await findOrFail(changeHolder.contractId);

  return serviceRecord.type === SERVICE.CELL
    ? handleCellChangeHolder(changeHolder, serviceRecord, userId)
    : handleLocalChangeHolder(changeHolder, serviceRecord, userId);
};

export const handleCellChangeHolder = async (
  changeHolder: AnyModel,
  serviceRecord: ServiceRecord,
  userId: number,
) => {
  const { contract } = serviceRecord;
  // first step cell holder change
  const cellProvider = await provider(contract.id);

  if (cellProvider === CELL_PROVIDER_CODE.LEMON) {
    return handleLocalChangeHolder(changeHolder, serviceRecord, userId);
  }

  const targetClient = await getTargetClient(changeHolder.toClientId);
  const { pdf, fileName } = await getPdf(`del:${changeHolder.docId}`);
  // first we had to upload the signed document to AIRE service
  await Aire.uploadDocument({
    subscriberType: targetClient.subscriberType!.aireNetworksCode,
    fiscalId: targetClient.fiscalId,
    aireRequestCode: changeHolder.provider_tracking_code,
    documentType: 'CONTRATO',
    fileName,
    file: pdf,
  });
  // then mark process as waiting for provider
  await changeHolder.update({
    state: CHNAGE_HOLDER_STATE.DONE,
    stateOption: CHNAGE_HOLDER_STATE_OPTION.WAITFOR_PROVIDER,
    changeDate: moment().format('YYYY-MM-DD HH:mm:ss'),
  });
  // change changeHolder done
  await infoChangeHolder(changeHolder.id, userId);
};

export const handleLocalChangeHolder = async (
  changeHolder: AnyModel,
  serviceRecord: ServiceRecord,
  userId: number,
) => {
  // document found
  // start transaction
  // set contract to new client
  await transaction(async () => {
    await GfContract.update(
      {
        clientId: changeHolder.toClientId,
        invoiceProfileId: null, // reset invoiceProfileId,
      },
      { where: { id: changeHolder.contractId } },
    );
    // cancel discounts for old client
    await onHolderChanged(
      changeHolder,
      moment().format('YYYY-MM-DD HH:mm:ss'),
      userId,
    );
    // update discounts
    await updateAllFromClient(
      changeHolder.toClientId,
      undefined,
      undefined,
      false,
      userId,
    );
    await updateAllFromClient(
      changeHolder.fromClientId,
      undefined,
      undefined,
      false,
      userId,
    );

    await ensureOfInvoiceLine(changeHolder.contractId, changeHolder.toClientId);

    await changeHolder.update({
      state: CHNAGE_HOLDER_STATE.DONE,
      stateOption: CHNAGE_HOLDER_STATE_OPTION.DEFAULT,
      changeDate: moment().format('YYYY-MM-DD HH:mm:ss'),
    });

    // change changeHolder done
    await infoChangeHolder(changeHolder.id, userId);

    // create invoice pointer for new changeHolder
    await generateNextSchedulesLine(changeHolder.contractId);

    await genericDocs(serviceRecord.contract, serviceRecord);
  });
};

/**
 * Ensure that user uploaded/signed docuemnt for the change holder proccess.
 */
const ensureOfDocument = async (changeHolder: AnyModel) => {
  const externalDocument = await GfContractDocument.findOne({
    where: { usedFor: 'changeHolder', usedForId: changeHolder.id },
  });

  if (externalDocument !== null) {
    return;
  }

  const document = await Document.findOne({
    where: { id: changeHolder.docId },
  });

  assert(document?.signed, new errors.BadRequest('Document not signed yet!'));

  return document!;
};

/**
 * Ensure that contract has invoice line after chage holder.
 */
const ensureOfInvoiceLine = async (contractId: number, clientId: number) => {
  // duplicate invoice scheduled line for the new client
  const invoiceScheduled = await GfScheduledInvoiceLine.findOne({
    where: { contractId: contractId, procesed: 0 },
  });

  const invoiceLine =
    invoiceScheduled === null
      ? new GfScheduledInvoiceLine({ contractId, clientId, procesed: 0 })
      : invoiceScheduled.duplicate({ clientId });

  await invoiceLine.save();
};
