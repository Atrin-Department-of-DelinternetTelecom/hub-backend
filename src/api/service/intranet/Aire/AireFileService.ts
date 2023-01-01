import { GfAireContract } from '@api/models/intranet/intranet_gf_aire_contracts';
import { Line } from '@delinternet/sdk-aire';
import { Static } from '@lib/cache';

export const getLineas = async function (): Promise<Line[]> {
  return Static.sear(
    'AireFileService.getLineas',
    async () => {
      const contracts = await GfAireContract.findAll({ group: 'number' });

      return contracts
        .filter((contract) => contract.active && contract.aireData)
        .map((activecontract) => {
          return {
            ...activecontract.getAireData()!,
            history: contracts
              .filter((contract) => {
                return (
                  contract.aireData &&
                  !contract.active &&
                  contract.number == activecontract.number
                );
              })
              .map((contract) => contract.getAireData()!),
          };
        });
    },
    1200,
  );
};

export const getLineasByNumber = async (number: string) => {
  const lineas = (await getLineas()) ?? [];

  return lineas.find((line) => line.telefono === number);
};
