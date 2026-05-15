import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';
import { PrismaPg } from '@prisma/adapter-pg';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
    async adapter() {
      const { Pool } = await import('pg');
      const pool = new Pool({ connectionString: env('DATABASE_URL') });
      return new PrismaPg(pool);
    },
  },
});
