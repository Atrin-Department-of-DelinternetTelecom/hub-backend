import { downloadFile, uploadFile } from '@api/service/file/fileService';

import { GfContractDataInternet } from '@api/models/intranet/intranet_gf_contract_data_internet';
import sharp from 'sharp';

interface Params {
  resources: number[];
  userId?: number;
  page: number;
  pageSize: number;
}

export default async function compressDataInternetImages(
  params: Params,
): Promise<void> {
  const resources = await getResources(params);
  const log = `[COMPRESS] Compress data internet images [date: ${new Date().toString()}] for resources: [${resources
    .map(({ id }) => id)
    .join(',')}]`;
  console.time(log);
  const images = Array.from({ length: 13 });
  const bucketName = GfContractDataInternet.bucket;

  for (const resource of resources) {
    const results = await Promise.allSettled(
      images.map(async (_, index) => {
        const imageNumber = index + 1;
        // check if converted before
        if (
          !resource.getImage(imageNumber) ||
          resource.getImage(imageNumber).match(/\.webp$/)
        ) {
          return false;
        }
        const { data: buffer } = await downloadFile(
          resource.getImage(imageNumber),
          bucketName,
        );

        const convertedImage = await sharp(buffer).webp();
        const { filename } = await uploadFile(bucketName, {
          data: await convertedImage.toBuffer(),
          mimetype: 'image/webp',
        });
        const imageName = GfContractDataInternet.imageName(imageNumber);
        resource.set({ [imageName]: filename });

        return true;
      }),
    );
    const ignores: number[] = [];
    const success: number[] = [];
    const fails: number[] = [];
    results.forEach((result, image) => {
      const imageNumber = image + 1;
      if (result.status === 'fulfilled' && result.value === false) {
        fails.push(imageNumber);
      } else if (result.status === 'fulfilled') {
        success.push(imageNumber);
      } else {
        fails.push(imageNumber);
      }
    });

    console.warn(
      `[COMPRESS][ID:${resource.id}][SUCCESS:${ignores.join(
        ',',
      )}][IGNORED:${ignores.join(',')}][FAILS:${fails.join(',')}]`,
    );

    await resource.save();
  }
  console.timeEnd(log);
}

async function getResources(params: Params) {
  const attributes = [
    'id',
    'image1',
    'image2',
    'image3',
    'image4',
    'image5',
    'image6',
    'image7',
    'image8',
    'image9',
    'image10',
    'image11',
    'image12',
    'image13',
  ];
  return GfContractDataInternet.findAll(
    params.resources.length > 0
      ? { where: { id: params.resources }, attributes }
      : {
          attributes,
          limit: params.pageSize,
          offset: (params.page - 1) * params.pageSize,
        },
  );
}
