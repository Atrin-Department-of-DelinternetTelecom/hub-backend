// This module is browser compatible.

export interface Deferred<T> extends Promise<T> {
  readonly state: 'pending' | 'fulfilled' | 'rejected';
  resolve(value?: T | PromiseLike<T>): void;
  // deno-lint-ignore no-explicit-any
  reject(reason?: any): void;
}

/**
 * Creates a Promise with the `reject` and `resolve` functions placed as methods
 * on the promise object itself.
 *
 * @example
 * ```typescript
 * import { deferred } from "https://deno.land/std@$STD_VERSION/async/deferred.ts";
 *
 * const p = deferred<number>();
 * // ...
 * p.resolve(42);
 * ```
 */
export function deferred<T>(): Deferred<T> {
  let methods;
  let state = 'pending';
  const promise = new Promise<T>((resolve, reject) => {
    methods = {
      async resolve(value: T | PromiseLike<T>) {
        await value;
        state = 'fulfilled';
        resolve(value);
      },
      // deno-lint-ignore no-explicit-any
      reject(reason?: any) {
        state = 'rejected';
        reject(reason);
      },
    };
  });
  Object.defineProperty(promise, 'state', { get: () => state });
  return Object.assign(promise, methods) as Deferred<T>;
}
