import { clickHouse } from '../clickhouse/client';

const result = await clickHouse.ping();

console.log(result);
