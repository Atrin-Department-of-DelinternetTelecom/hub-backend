import * as PackCache from './cache';

import { CachePackage, DocumentExtendedView, DocumentView } from './types';

import { CellPdfRenderer } from './renderers/CellPdfRenderer';
import { DocumentStorage } from './storages/Storage';
import { JsxRenderer } from './renderers/JsxRenderer';
import { URL } from 'url';
import { getDocumentForStorageType } from './documents';
import { loadStorage } from './storages';
import { getLatestSepaDoc } from '../intranet/GfClientSepa';
import { getDataProtectionDoc } from '../intranet/GfClientDataProtectionDoc';
import { getCellContractDocs } from '../intranet/GfContractDataCellService';
import { getInternetContractDoc } from '../intranet/GfContractDataInternetService';

export function normalizeId(_id: string | number): string {
  const id = String(_id);
  const [storageType, docId] = id.includes(':')
    ? id.split(':')
    : ['gf-doc', id];
  return storageType + ':' + docId;
}

export const getPackage = async function (
  id: string,
  { ignoreHashCheck }: { ignoreHashCheck: boolean },
): Promise<CachePackage> {
  const cache = await PackCache.get(id);
  if (cache && ignoreHashCheck) return cache;

  const storage = await loadStorage(id);
  const renderer = await loadRenderer(storage);

  if (cache) {
    const hash = await renderer.getRenderHash();
    if (hash === cache.hash) return cache;
  }

  const pack = await renderer.getRenderedPackage();
  // ignore await-ing this
  PackCache.set(id, pack);

  return pack;
};

async function loadRenderer(storage: DocumentStorage) {
  const document = getDocumentForStorageType(storage.type);
  const renderer = new document.Renderer(storage);
  await renderer.load();
  return renderer;
}

export async function reloadDocumentState(id: string) {
  const storage = await loadStorage(id);
  await loadRenderer(storage);
}

export async function getDocumentId(
  _id: string | number,
): Promise<DocumentExtendedView> {
  const id = normalizeId(_id);

  const storage = await loadStorage(id);
  const document = getDocumentForStorageType(storage.type);

  return {
    id,
    createdAt: storage?.createdAt,
    title: storage?.title,
    // REFACTOR(erfan): we should not expose storage type in public. but removing this is a breaking change
    type: document.storageType,
    documentType: document.type,
    signed: storage!.signed,
    baseDataComplete: storage!.baseDataComplete,
    baseDataCompleteInfo: storage!.baseDataCompleteInfo,
    isSignatureUploaded: storage!.allSignaturesUploaded,
    signatures: document.signatures,
    detail: await document.loadDetail(storage),
  };
}

export const getImage = async function (_id: string | number, page: number) {
  const id = normalizeId(_id);
  const { images } = await getPackage(id, { ignoreHashCheck: true });

  return {
    image: images[page - 1],
    fileName: `${id}-${page}.webp`,
  };
};

export const getImages = async function (
  _id: string | number,
  url: URL,
): Promise<string[] | null> {
  const id = normalizeId(_id);
  const { images } = await getPackage(id, { ignoreHashCheck: false });

  return images.map((e, i) => {
    const itemUrl = new URL(url.toString());
    itemUrl.pathname = `api/v1/docs/${id}/images/${i + 1}`;
    return itemUrl.toString();
  });
};

export const getThumbnail = async (_id: string | number) => {
  const id = normalizeId(_id);
  const { thumb } = await getPackage(id, { ignoreHashCheck: true });

  return {
    thumbnail: thumb,
    fileName: `${id}-thumb.webp`,
  };
};

export const getPdf = async function (_id: string | number) {
  const id = normalizeId(_id);
  const { pdf, pdfName } = await getPackage(id, { ignoreHashCheck: false });

  return {
    pdf: pdf,
    fileName: pdfName + '.pdf',
  };
};

/**
 * this method is just a tool for development purpose and should not be used in production
 */
export const getHtml = async function (_id: string): Promise<string> {
  const id = normalizeId(_id);
  const storage = await loadStorage(id);
  const renderer = await loadRenderer(storage);

  if (!(renderer instanceof JsxRenderer)) {
    throw new Error(`Document with id:${id} does not uses HtmlGenerator`);
  }

  return renderer.getHtml();
};

export const loadDocumentSignature = async function (
  _id: string,
  name: string,
): Promise<Buffer | null> {
  const id = normalizeId(_id);
  const storage = await loadStorage(id);
  return storage.getSignature(name);
};

export const loadDocumentSignatures = async function (
  _id: string,
): Promise<Record<string, Buffer | null>> {
  const id = normalizeId(_id);
  const storage = await loadStorage(id);
  return storage.getAllSignatures();
};

export const uploadSignatures = async function (
  _id: string,
  signatures: Record<string, Buffer>,
  userId: number,
  { uploadToAire }: { uploadToAire?: boolean } = {}, // this options is not required because now we will always uploadToAire
) {
  const id = normalizeId(_id);
  const storage = await loadStorage(id);

  for (const [name, sign] of Object.entries(signatures)) {
    await storage.setSignature(sign, name);
  }

  // ATTENTION: do not call loadRenderer before setSignature. because the old sign will be used on new doc
  const renderer = await loadRenderer(storage);
  const pack = await renderer.getRenderedPackage();
  await PackCache.set(id, pack);
  const { pdf, info } = pack;

  await storage.storePdfDocument({ file: pdf, info });
  await storage.update({
    signed: storage.allSignaturesUploaded,
  });

  if (renderer instanceof CellPdfRenderer) {
    await renderer.uploadToProvider(userId, pdf);
  }
};
export const setSigned = async function (_id: string) {
  const id = normalizeId(_id);
  const storage = await loadStorage(id);
  const renderer = await loadRenderer(storage);

  const pack = await renderer.getRenderedPackage();
  await PackCache.set(id, pack);
  const { pdf, info } = pack;

  await storage.storePdfDocument({ file: pdf, info });
  await storage.update({
    signed: true,
  });
};

export const setUnSigned = async function (_id: string) {
  const id = normalizeId(_id);
  const storage = await loadStorage(id);

  await storage.deletePdfDocument();
  await storage.update({
    signed: false,
  });
};

/**
 * Here we should just clear the local cache
 */
export const reload = async function (_id: string) {
  const id = normalizeId(_id);
  await PackCache.clear(id);
};

export const refreshBaseDataComplete = async function (_id: number | string) {
  const id = normalizeId(_id);
  const storage = await loadStorage(id);

  // loadRenderer will update baseDataComplete
  await loadRenderer(storage);
};

/**
 * Upload user document to aire.
 */
export const uploadToAire = async function (_id: string, userId: number) {
  const id = normalizeId(_id);
  const storage = await loadStorage(id);
  const renderer = await loadRenderer(storage);
  const { pdf } = await renderer.getRenderedPackage();

  if (!(renderer instanceof CellPdfRenderer)) {
    throw new Error(
      `Processor for: ${storage.type} doesn't have uploadToAire implemented`,
    );
  }
  await renderer.uploadToProvider(userId, pdf);
};

export const getDocsForOpero = async function (
  gfClientId: number,
  gfContractId: number,
) {
  const latestSepaDoc = await getLatestSepaDoc(gfClientId);
  const dataPrivacyDoc = await getDataProtectionDoc(gfClientId);
  const dataInternetDoc = await getInternetContractDoc(gfContractId!);
  return [latestSepaDoc, dataPrivacyDoc, dataInternetDoc].filter(
    (v) => !!v,
  ) as DocumentView[];
};
