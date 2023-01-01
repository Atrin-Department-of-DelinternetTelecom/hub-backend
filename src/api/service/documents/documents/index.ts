import AireLineTermination from './AireLineTermination';
import AltaFix from './AltaFix';
import AltaInternet from './AltaInternet';
import AltaSubscription from './AltaSubscription';
import AltaTv from './AltaTv';
import CellContract from './CellContract';
import CellPortability from './CellPortability';
import ChangeAireHolder from './ChangeAireHolder';
import ChangeHolder from './ChangeHolder';
import ChangeIban from './ChangeIban';
import ClientAgreement from './ClientAgreement';
import DataProtection from './DataProtection';
import { Document } from '../document';
import FixPortability from './FixPortability';
import GrantPermission from './GrantPermission';
import InstallationReport from './InstallationReport';
import LeaveRequest from './LeaveRequest';
import MaterialDelivery from './MaterialDelivery';
import Sepa from './Sepa';
import Vacation from './Vacation';
import assert from 'assert';

const list: readonly Document[] = [
  CellContract,
  CellPortability,
  AltaFix,
  AltaInternet,
  AltaSubscription,
  AltaTv,
  ChangeHolder,
  ChangeAireHolder,
  ChangeIban,
  FixPortability,
  GrantPermission,
  InstallationReport,
  LeaveRequest,
  MaterialDelivery,
  Sepa,
  Vacation,
  DataProtection,
  ClientAgreement,
  AireLineTermination,
];

const mappedByStorageType = Object.fromEntries(
  list.map((d) => [d.storageType, d]),
);

export const getDocumentForStorageType = (storageType: string): Document => {
  const document = mappedByStorageType[storageType];
  assert(document, `Document not found for ${storageType}`);

  return document;
};
