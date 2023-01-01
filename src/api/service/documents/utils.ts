import { createHash } from 'crypto';

/**
 * @see https://github.com/kevva/is-pdf/blob/master/index.js
 */
export function isValidPdf(buf: Buffer): boolean {
  if (!buf || buf.length < 4) {
    return false;
  }

  return (
    buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46
  );
}

const moneyFormatter = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatter = new Intl.DateTimeFormat('es-ES', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export const format = (date: Date | null | undefined) =>
  date ? formatDate(date) : '';

const formatDate = (date: Date) => formatter.format(date);

export const formatValue = (value: any) => {
  if ([null, '', undefined].includes(value)) {
    return '-';
  }

  return value instanceof Date ? format(value) : value;
};

export const md5 = (v: Buffer | string) => {
  return createHash('md5').update(v).digest('hex');
};

export const formatMoney = (
  value: number | string | null | undefined,
): string => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const numeric =
    typeof value === 'number'
      ? value
      : parseFloat(String(value).replace(',', '.'));

  if (Number.isNaN(numeric)) {
    return '-';
  }

  return moneyFormatter.format(numeric); // e.g. 59 -> "59,00"
};
