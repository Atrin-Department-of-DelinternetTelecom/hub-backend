'use strict';
/**
 * Transforms the given array into a Record, extracting the key of each element using the given selector.
 * If the selector produces the same key for multiple elements, the latest one will be used (overriding the
 * ones before it).
 *
 * Example:
 *
 * ```ts
 *
 * const users = [
 *     { id: 'a2e', userName: 'Anna' },
 *     { id: '5f8', userName: 'Arnold' },
 *     { id: 'd2c', userName: 'Kim' },
 * ]
 * const usersById = associateBy(users, it => it.id)
 *
 * assertEquals(usersById, {
 *     'a2e': { id: 'a2e', userName: 'Anna' },
 *     '5f8': { id: '5f8', userName: 'Arnold' },
 *     'd2c': { id: 'd2c', userName: 'Kim' },
 * })
 * ```
 */
exports.associateBy = (array, selector) => {
  const ret = {};

  for (const element of array) {
    const selectedValue = selector(element);

    ret[selectedValue] = element;
  }

  return ret;
};

/**
 * Filters an array of values and returns only the unique ones.
 * The uniqueness can be determined by a callback function or a key
 * that is used to compare the values.
 *
 * @param {Array} arr - The array of values to filter.
 * @param {Function|string} [callbackOrKey] - The callback function or key
 * to determine the uniqueness of the values. If a callback function is used,
 * it should return a value that will be used to compare the values. If a key is
 * used, it should be a string representing the property name or object path to use
 * to compare the values.
 *
 * @returns {Array} An array containing only the unique values.
 */
exports.unique = (arr, callbackOrKey = null) => {
  const set = new Set();
  const uniqueValues = [];

  for (const item of arr) {
    const value =
      typeof callbackOrKey === 'function'
        ? callbackOrKey(item)
        : item[callbackOrKey];
    if (!set.has(value)) {
      set.add(value);
      uniqueValues.push(item);
    }
  }

  return uniqueValues;
};

/**
 * Sorts an array of objects based on the value returned by a key or callback.
 * @param {Array} arr - The array to sort.
 * @param {string | function} keyOrCallback - The key or callback to use for sorting.
 * @returns {Array} - The sorted array.
 */
exports.sortBy = (arr, keyOrCallback) => {
  return arr.sort((a, b) => {
    const aVal =
      typeof keyOrCallback === 'function' ? keyOrCallback(a) : a[keyOrCallback];
    const bVal =
      typeof keyOrCallback === 'function' ? keyOrCallback(b) : b[keyOrCallback];
    if (aVal < bVal) {
      return -1;
    } else if (aVal > bVal) {
      return 1;
    }
    return 0;
  });
};

/**
 * Plucks values from an array of objects and creates a new object where keys are derived from the specified key
 * and values are derived from the specified value. If multiple objects in the array have the same key value,
 * the last encountered value will be used in the result.
 *
 * @param {Object[]} array - The input array of objects from which values will be plucked.
 * @param {string} value - The key used to extract the property whose value will become the value in the resulting object.
 * @param {string} [key] - The key used to extract the property whose value will become the key in the resulting object. Default is the array index.
 * @returns {Object} A new object where keys are derived from the specified key and values are derived from the specified value.
 *
 * @example
 * const users = [
 *   { id: 1, name: 'John' },
 *   { id: 2, name: 'Jane' },
 *   { id: 3, name: 'Alice' },
 * ];
 *
 * const result = pluck(users, 'name', 'id');
 * // Output: { 1: 'John', 2: 'Jane', 3: 'Alice' }
 */
exports.pluck = (array, value, key) => {
  return array.reduce(
    (result, item) => {
      if (key) {
        result[item[key]] = item[value];
      } else {
        result.push(item[value]);
      }

      return result;
    },
    key ? {} : [],
  );
};

/**
 * Flips keys and values of an object.
 * @param {Object} object - The input object with string or number values.
 * @returns {Object} A new object with flipped keys and values.
 */
module.exports.flip = (object) => {
  return Object.fromEntries(
    Object.entries(object).map(([key, value]) => [String(value), key]),
  );
};
