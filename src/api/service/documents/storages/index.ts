import type { DocumentStorage } from './Storage';
import { GfDocStorage } from './GfDocStorage';
import { DelinternetStorage } from './DelinternetStorage';
import { errors } from '@api/http/http_errors';

const STORAGES: Record<
  string,
  { load(docId: number): Promise<DocumentStorage> }
> = {
  'gf-doc': GfDocStorage,
  del: DelinternetStorage,
} as const;

const parseIdParts = (id: string): [string, number] => {
  const [storageType, _docId] = id.split(':');
  const docId = Number(_docId);

  if (!storageType || !docId) {
    throw new errors.NotFound(`doc with id:${id} not found`);
  }

  const storageTypes = Object.keys(STORAGES);

  if (!storageTypes.includes(storageType)) {
    throw new Error(
      `id: ${id} has invalid storageType. should be prefixed with ${storageTypes.join(
        ' or ',
      )}`,
    );
  }

  return [storageType, docId];
};

export async function loadStorage(id: string) {
  const [storageType, docId] = parseIdParts(id);
  const StorageClass = STORAGES[storageType];
  const storage = await StorageClass.load(docId);

  return storage;
}
