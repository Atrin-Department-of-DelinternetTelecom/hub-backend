export function associateBy<T>(
  array: readonly T[],
  selector: (el: T) => string,
): Record<string, T>;

/**
 * Returns an array of unique elements, filtered by the given key or callback.
 *
 * @param arr - The array to filter.
 * @param keyOrCallback - The key or callback function to determine uniqueness.
 * @returns The filtered array of unique elements.
 */
export declare function unique<T>(
  arr: T[],
  keyOrCallback?: ((item: T) => unknown) | keyof T,
): T[];

/**
 * TypeScript Declaration for sortBy function.
 * @param {T[]} arr - The array to sort.
 * @param {(string | ((arg: T) => any))} keyOrCallback - The key or callback to use for sorting.
 * @returns {T[]} - The sorted array.
 * @template T
 */
export declare function sortBy<T>(
  arr: T[],
  keyOrCallback: string | ((arg: T) => any),
): T[];

/**
 * Plucks values from an array of objects and creates a new object where keys are derived from the specified key
 * and values are derived from the specified value. If multiple objects in the array have the same key value,
 * the last encountered value will be used in the result.
 *
 * @param array - The input array of objects from which values will be plucked.
 * @param value - The key used to extract the property whose value will become the value in the resulting object.
 * @param key - The key used to extract the property whose value will become the key in the resulting object. Default is the array index.
 * @returns A new object where keys are derived from the specified key and values are derived from the specified value.
 *
 * @example
 * const users = [
 *   { id: 1, name: 'John' },
 *   { id: 2, name: 'Jane' },
 *   { id: 3, name: 'Alice' },
 * ];
 *
 * const result = pluck(users, 'name', 'id');
 * Output: { 1: 'John', 2: 'Jane', 3: 'Alice' }
 */

export declare function pluck<T extends Record<string, any>, K extends keyof T>(
  array: T[],
  key: K,
): T[K][];
function pluck<
  T extends Record<string, any>,
  K extends keyof T,
  V extends keyof T,
>(
  array: T[],
  value: V,
  key?: K,
): K extends keyof T ? Record<T[K], T[V]> : V extends keyof T ? T[V][] : never;

/**
 * Flips the keys and values of an object.
 *
 * Note:
 * - The values of the input object must be strings or numbers.
 * - If duplicate values exist, later keys will overwrite earlier ones.
 *
 * Example:
 * ```ts
 * const input = { foo: 'a', bar: 'b' };
 * const result = flip(input); // { a: 'foo', b: 'bar' }
 * ```
 *
 * @param object - The input object whose keys and values should be flipped.
 * @returns A new object with keys and values reversed.
 */
export declare function flip<T extends Record<string, string | number>>(
  object: T,
): Record<string, string>;
