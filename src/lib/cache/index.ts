import { get as config } from '@config';
import factory from '@del-internet/support-cache';

const Manager = factory(config('cache'));
const Static = Manager.driver('static');
const File = Manager.driver('file');
const S3 = Manager.driver('s3');
const Redis = Manager.driver('redis');

/**
 * @description https://gitlab.delinternet.com/zareismail/support-cache/-/blob/main/README.md
 * @summary https://gitlab.delinternet.com/zareismail/support-cache/-/blob/main/README.md
 */
export { Manager as default, Manager, Static, File, Redis, S3 };
