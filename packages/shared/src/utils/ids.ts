import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';

export type IdType = 'UUID' | 'NANOID';

export function createId(type: IdType = 'UUID') {
  if (type === 'UUID') return uuidv4();
  if (type === 'NANOID') return nanoid(10);
  throw new Error('Invalid ID type');
}
