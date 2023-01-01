import axios from 'axios';
import config from '@config';
import D from 'debug';
import sharp from 'sharp';

const debug = D('wk-to-pdf');

const is2xx = (status: number) => status >= 200 && status < 300;

// const convertPngToWebp = (image: Buffer) =>

const convertPngImagesToWebp = (images: string[]) => {
  return Promise.all(
    images.map((image) =>
      sharp(Buffer.from(image, 'base64')).toFormat('webp').toBuffer(),
    ),
  );
};

class DetailedError extends Error {
  detail: any;
  constructor(message: string, detail: any) {
    super(message);
    this.detail = detail;
  }
}

/**
 * Get info from binary PDF.
 *
 * @param  {Buffer} pdf
 * @return {Promise<any>}
 */
export async function getPdfInfo(pdf: { toString: (arg0: string) => any }) {
  const response = await post('pdf/info', {
    pdf: pdf.toString('base64'),
  });

  return response.data?.data;
}

/**
 *
 * @param  {Buffer} pdf
 * @return {Promise<Buffer[]>}
 */
export async function convertPdf2Images(pdf: Buffer) {
  const response = await post('pdf/images', {
    pdf: pdf.toString('base64'),
  });

  const { images } = response.data;

  return convertPngImagesToWebp(images);
}

/**
 *
 * @param  {Buffer} html
 * @return {Promise<{ pdf: Buffer, images: Buffer[], pages: number; }>}
 */
export async function convertHtml2Package(html: string) {
  const response = await post('html/package', {
    html,
  });

  const { pdf, images: _images, pages } = response.data;

  const images = await convertPngImagesToWebp(_images);

  return {
    pdf: Buffer.from(pdf, 'base64'),
    images,
    pages,
  };
}

/**
 * Convert HTML to PDF.
 *
 * @param {string} html
 * @return {Promise<Buffer>}
 */
export async function convertHtmlToPdf(
  html: string,
  callback?: { url: string; name: string; fileName: string },
) {
  const response = await post('html/pdf', { html, callback });
  return Buffer.from(response.data?.base64 ?? '', 'base64');
}

export function convertImageToThumb(image: Buffer) {
  return sharp(image)
    .resize({
      width: 250,
      fit: sharp.fit.outside,
    })
    .toFormat('webp')
    .toBuffer();
}

async function request(path: any, params: any, method: 'get' | 'post') {
  const response = await axios({
    url: `${config.get('index.pdf2.endpoint')}/${path}`,
    method: method,
    data: params ?? {},
    headers: {
      Authorization: `Bearer ${config.get('index.pdf2.token')}`,
    },
    // do not reject when status is not 2xx
    validateStatus: () => true,
  });

  debug(response.data);
  const isErrorBody = response.data?.code && !is2xx(response.data.code);

  if (!is2xx(response.status) || isErrorBody) {
    const error = new DetailedError(
      `Request failed with status code ${response.status}:${response?.data?.code}`,
      response.data,
    );
    throw error;
  }
  return response;
}

function post(path: string, params = {}) {
  return request(path, params, 'post');
}
