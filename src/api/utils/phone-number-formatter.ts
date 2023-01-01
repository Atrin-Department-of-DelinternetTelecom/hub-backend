/**
 * Format a phone number to the international format with a leading '+34'.
 * @param {string} phone - The input phone number.
 * @returns {string | false} - The formatted phone number or `false` if input is invalid.
 */
export const phoneNumberFormatter = (
  phone: string,
  prefix = '34',
): string | false => {
  if (!phone) return false;
  const str: string = phone.replace(/^\D+/g, '');

  if (str.length === 11 && str.substring(0, 2) === prefix) {
    return `+${str}`;
  }

  if (str.length === 9) {
    return `+${prefix}${str}`;
  }

  return false;
};
