//@ts-check
'use strict';
const Action = require('@lib/crud/Action');
const ID = require('@lib/crud/Fields/ID');
const { syncStateChange } = require('@service/intranet/AireSolicitudeService');
const { AireRequestLine } = require('@api/service/intranet/AireService');
const { CELL_PROVIDER_CODE, SERVICE } = require('@api/constants/contracts');
const assert = require('assert');
const { SECTION_STATUS } = require('@api/constants/statuses');
const { handle } = require('@api/service/intranet/Actions/SuspendContracts');
const {
  setDoneState,
  setErrorState,
  execute,
} = require('@api/service/intranet/GfContractSectionStatusService');
const { GfSection } = require('@api/models/intranet/intranet_gf_sections');
const { FacadeCell } = require('@api/service/intranet/Contract/Facades');

const { GfContractSectionStatus } = require('@models').intranet;

const sycnWithAire = async (dataCell, userId, state, stateText, reason) => {
  const requestLine = await AireRequestLine.findOne({
    codigo: dataCell.providerRequestCode,
    telefono: dataCell.number,
  });

  assert(
    requestLine,
    `AireRequestLine with codigo:${dataCell.providerRequestCode} and telefono:${dataCell.number} not found`,
  );

  // check if state has changed
  await syncStateChange(requestLine, dataCell, userId);
};

const sycnWithLemon = async (dataCell, userId, state, stateText, reason) => {
  if (state === SECTION_STATUS.SUSPENDED) {
    await handle([await dataCell.getContract()], userId);
  }

  if (state === SECTION_STATUS.DONE) {
    const section = await GfSection.findByCode(SERVICE.CELL);
    assert(section);
    await setDoneState(dataCell.contractId, section.id, userId);
  }

  if (state === SECTION_STATUS.ERROR) {
    const section = await GfSection.findByCode(SERVICE.CELL);
    assert(section);
    await setErrorState(dataCell.contractId, section.id, reason, userId);
  }

  await dataCell.update({ lastGetStateText: stateText });
};

module.exports = class SyncAireState extends Action {
  /**
   * Preapre field for json.
   *
   * @param {any} request
   * @param {unknown[]} models
   * @param {Object} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    const resource = await request.findResourceOrFail();
    const { lastGetStateText, contractId } = resource.resource;
    const { state, stateText, provider, reason } = await FacadeCell.getState(
      contractId,
    );

    if (stateText !== lastGetStateText || state === SECTION_STATUS.SUSPENDED) {
      const method =
        provider === CELL_PROVIDER_CODE.AIRE ? sycnWithAire : sycnWithLemon;
      await method(
        resource.resource,
        request.user.userId,
        state,
        stateText,
        reason,
      );
    }

    const sectionStatus = await GfContractSectionStatus.findOne({
      where: { contractId },
    });

    if (
      sectionStatus.state === SECTION_STATUS.ERROR &&
      state !== SECTION_STATUS.ERROR
    ) {
      const section = await GfSection.findByCode(SERVICE.CELL);
      assert(section);
      await execute(contractId, section.id, request.user.userId);
    }

    const { attributes } = await resource.serializeForDetail(request);

    return attributes;
  }

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return [new ID()];
  }

  /**
   * Request path.
   *
   * @return {string}
   */
  swaggerRoute() {
    return this.uriKey();
  }

  /**
   * Get the uri key.
   *
   * @return {string}
   */
  uriKey() {
    return `{id}/sync-state`;
  }
};
