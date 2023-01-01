// import { PdfInfo } from './types';

import { CachePackage, PartialCachePackage } from './types';
import { convertImageToThumb, convertPdf2Images } from './WkToPdfService';

export async function convertPartialPackToCompletePack(
  partial: PartialCachePackage,
): Promise<CachePackage> {
  const images = partial.images ?? (await convertPdf2Images(partial.pdf));
  const thumb = partial.thumb ?? (await convertImageToThumb(images[0]));

  return {
    pdf: partial.pdf,
    pdfName: partial.pdfName,
    hash: partial.hash,
    info: partial.info ?? {
      Pages: String(images.length),
    },
    images,
    thumb,
  };
}
