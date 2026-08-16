import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema.ts';

const client = createClient({
  url: 'file:navbat.db',
});

export const rawClient = client;
export const db = drizzle(client, { schema });
