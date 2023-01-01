import '../init-tests';
import { getNotiIdsByUniqueIdLike } from '@service/intranet/NotificationService';
import { initDb } from 'tests/test-utils';

describe('Notification Service', () => {
  it('should getNotiIdsByUniqueIdLike', async () => {
    await initDb({
      GlobalNotificationsHistory: [],
    });

    const result = await getNotiIdsByUniqueIdLike('test');
    expect(result).toEqual([]);
  });
});
