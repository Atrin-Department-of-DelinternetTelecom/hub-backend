interface Get {
  <T>(path: string): T;
  <T>(path: string, fallback: T): T;
}

export const get: Get;
export const isProduction: () => boolean;
export const isTest: () => boolean;
export const isLocal: () => boolean;
