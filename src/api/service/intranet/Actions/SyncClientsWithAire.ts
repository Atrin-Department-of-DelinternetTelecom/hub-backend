import * as models from '@api/models';

import { firstPopulated, isPopulated } from '@api/utils/helpers';

import { AireCustomer } from '../AireService';
import { Customer } from '@delinternet/sdk-aire';

const {
  intranet: { GfDocumentType, GfSubscriberType, GfMarketingConsentType },
} = models;

/**
 * Synchronizes the local client data with the corresponding data from the Aire service.
 * This function updates the local client data to include any missing or outdated information
 * from the Aire service, without overwriting any existing data that is more recent or complete.
 */
export const handle = async (clients: models.AnyModel[]) => {
  return Promise.allSettled(clients.map(syncClientWithAire));
};

const syncClientWithAire = async (client: models.AnyModel) => {
  const aireClient = await AireCustomer.findOne({
    fiscalId: client.fiscalId,
  });
  // nothing to do when clinet not found on the AIRE
  if (aireClient === null) {
    return;
  }
  // possible update keys
  const attributes = Object.keys(client.get({ plain: true }));

  for (const key in aireClient) {
    const newValue = aireClient[key as keyof Customer];
    // to prevent update exists local data or invalid data
    // because AIRE return invalid '0' value for many cases
    if (
      attributes.includes(key) &&
      !isPopulated(client.get(key)) &&
      isPopulated(newValue) &&
      newValue !== '0'
    ) {
      client.set(key, newValue);
    }
  }

  const documentType = await GfDocumentType.findOne({
    where: {
      aireNetworksCode: aireClient.documentType,
    },
  });

  if (documentType !== null) {
    client.set('documentTypeId', documentType.id);
  }

  const contactDocumentType = await GfDocumentType.findOne({
    where: {
      aireNetworksCode: aireClient.contactDocumentType,
    },
  });

  if (contactDocumentType !== null) {
    client.set('contactDocumentTypeId', contactDocumentType.id);
  }

  const subscriberType = await GfSubscriberType.findOne({
    where: {
      aireNetworksCode: aireClient.subscriberType,
    },
  });

  if (subscriberType !== null) {
    client.set('subscriberTypeId', subscriberType.id);
  }

  const marketingConsentType = await GfMarketingConsentType.findOne({
    where: {
      aireNetworksCode: aireClient.marketingConsent,
    },
  });

  if (marketingConsentType !== null) {
    client.set('marketingConsentTypeId', marketingConsentType.id);
  }

  client.set(
    'aireCode',
    firstPopulated([aireClient.cod, client.aireCode], null),
  );

  client.set(
    'name',
    firstPopulated([
      client.name,
      [client.contactName, client.contactFamilyName1, client.contactFamilyName2]
        .filter((val) => val)
        .join(' '),
    ]),
  );

  await client.save();
};
