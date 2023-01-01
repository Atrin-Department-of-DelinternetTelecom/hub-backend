export const isComparableField = (key: string): boolean => key[0] !== '_';

export const getFieldKey = (key: string): string => {
  return key.indexOf('.') !== -1 ? `$${key}$` : key;
};

export const getEqualOp = (
  key: string,
  value: string,
): Record<string, unknown> => {
  return { [key]: getFieldValue(value) };
};

export const getFieldValue = (
  value: string,
): null | number | string | Array<string | number> => {
  const matches = value.replace(/\s+/, '').match(/\[(.*)\]/);

  return value === null || matches === null
    ? normalizeValue(value)
    : matches[1].split(',');
};

export const normalizeValue = (value: string): string | null => {
  if (typeof value !== 'string') {
    return value;
  }

  return ['null'].includes(value.toLowerCase()) ? null : value;
};
