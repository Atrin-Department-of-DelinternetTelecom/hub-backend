// @ts-check
import { InfluxDB, Point } from '@influxdata/influxdb-client';

const { MEMORY_USAGE_INFLUXDB_BUCKET_URL } = process.env;

export function init() {
  if (MEMORY_USAGE_INFLUXDB_BUCKET_URL) {
    const url = new URL(MEMORY_USAGE_INFLUXDB_BUCKET_URL);
    const client = new InfluxDB({
      url: url.origin,
      token: decodeURIComponent(url.password),
    });
    const writeApi = client.getWriteApi(
      decodeURIComponent(url.username),
      decodeURIComponent(url.pathname).replace('/', ''),
    );

    const warn = (e: unknown) => console.warn(e);

    setInterval(async () => {
      const mem = process.memoryUsage();

      const point = new Point('process.memoryUsage')
        .tag('app_name', 'delinternet-hub')
        .intField('rss', mem.rss)
        .intField('heap_used', mem.heapUsed)
        .intField('heap_total', mem.heapTotal)
        .intField('external', mem.external)
        .intField('array_buffers', mem.arrayBuffers);

      writeApi.writePoint(point);

      // Flush the write API to ensure data is sent to InfluxDB
      await writeApi.flush().catch(warn);
    }, 5000);
  }
}
