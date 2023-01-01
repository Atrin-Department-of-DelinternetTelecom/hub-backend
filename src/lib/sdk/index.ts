import { AireClient } from '@delinternet/sdk-aire';
import Auth from '@del-internet/sdk-auth';
import acs from '@del-internet/sdk-cpe';
import { get as config } from '@config';

/**
 * The ACS service connector.
 */
export const ACS = acs({ endpoint: config('index.cpe.endpoint') });
/**
 * The auth service connector.
 */
export const Gate = new Auth(config('auth.redis')).debugUsing(console.debug);
/**
 * The AIRE service connector.
 */
export const Aire = new AireClient({
  endpoint: config('index.aire.endpoint'),
  token: config('index.aire.token'),
  user: config('index.aire.user'),
  pass: config('index.aire.pass'),
  readonly: config('index.aire.readOnly', false),
  // 'endPoint': _.get(config, 'aire.key', 'http://[::1]:8005'),
});
