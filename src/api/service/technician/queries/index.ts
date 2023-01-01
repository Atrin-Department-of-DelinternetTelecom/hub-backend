import { query as assistance } from './incidence/assistance';
import { query as simDeliveries } from './incidence/sim_delivery';
import { query as internet } from './installation/internet';

export const queries = {
  installation: {
    internet,
  },
  incidence: {
    assistance,
    simDeliveries,
  },
};
