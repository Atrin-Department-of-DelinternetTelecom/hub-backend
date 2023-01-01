import { AireUploadHistory } from '@api/models/intranet/intranet_aire_upload_history';
import { DocumentStorage } from '../../storages/Storage';
import { Op } from 'sequelize';
import assert from 'assert';
import { assertGfStorage } from '../../storages/GfDocStorage';
import { intranet } from '@api/models';

const { GfContract, GfFeeGroup, GfFee, GfSection, GfContractDataCell } =
  intranet;

export async function loadDetail(storage: DocumentStorage) {
  assertGfStorage(storage);
  const { gfDoc } = storage;

  const contractId = gfDoc.contractId!;
  const contract = await GfContract.findByPk(contractId, {
    include: [
      {
        model: GfFeeGroup,
        as: 'fee_group',
        include: [
          {
            model: GfSection,
            as: 'sections',
            required: true,
          },
        ],
        required: true,
      },
      {
        model: GfContractDataCell,
        as: 'dataCell',
        required: true,
      },
    ],
  });
  assert(contract, `Contract with id:${contractId} not found`);
  const section = contract.fee_group?.sections[0];

  const lastUpdateHistory = await AireUploadHistory.findOne({
    where: {
      success: 1,
      document_id: gfDoc.id,
      uploaded_at: {
        // to ensure uploaded signed version of document
        [Op.gte]: storage.signatureUploadedDate,
      },
    },
    order: [['uploaded_at', 'DESC']],
  });

  return {
    clientId: storage.gfDoc.clientId,
    contract: {
      id: contract.id,
      reference: contract.reference,
      type: section.code,
    },
    number: contract.dataCell.number,
    uploadedToProvider: Boolean(lastUpdateHistory),
  };
}
