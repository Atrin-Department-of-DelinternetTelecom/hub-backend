import Cell from './Cell';
import Fix from './Fix';
import Internet from './Internet';
import { SERVICE } from '@api/constants/contracts';
import Subscription from './Subscription';
import Tv from './Tv';

const facades = {
  [SERVICE.FIX]: new Fix(),
  [SERVICE.CELL]: new Cell(),
  [SERVICE.TV]: new Tv(),
  [SERVICE.INTERNET]: new Internet(),
  [SERVICE.SUBSCRIPTION]: new Subscription(),
};

type Facades = typeof facades;

/**
 * Get the facade instance for the given service.
 */
export default function factory<T extends keyof Facades>(
  service: T,
): Facades[T] {
  return facades[service];
}

export const FacadeCell = factory<SERVICE.CELL>(SERVICE.CELL);
export const FacadeFix = factory<SERVICE.FIX>(SERVICE.FIX);
export const FacadeInternet = factory<SERVICE.INTERNET>(SERVICE.INTERNET);
export const FacadeTv = factory<SERVICE.TV>(SERVICE.TV);
export const FacadeSubscription = factory<SERVICE.SUBSCRIPTION>(
  SERVICE.SUBSCRIPTION,
);
