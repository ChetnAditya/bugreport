import 'dotenv/config';
import { PrismaClient } from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const [userCount, bugCount, teamCount] = await Promise.all([
      prisma.user.count(),
      prisma.bug.count(),
      prisma.team.count(),
    ]);
    console.log('✅ Connected.');
    console.log(`   users=${userCount}  bugs=${bugCount}  teams=${teamCount}`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error('❌ Connection failed:', e.message);
  process.exit(1);
});
