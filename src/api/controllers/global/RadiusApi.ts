import { createRoute } from '@api/utils/controller-factory';
import { getUserData } from '@api/service/intranet/RadiusService';
import to from 'await-to-js';

export const password = createRoute({
  async handler(req, res) {
    const [error, radiusData] = await to(
      getUserData(req.swagger.params.username.value),
    );

    res.status(200).json({
      success: error === null && radiusData.success === true,
      password: radiusData?.data?.general?.password ?? null,
    });
  },
});
