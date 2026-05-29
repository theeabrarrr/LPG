/**
 * Minimal bootstrap seed.
 * Creates NOTHING user-specific — all users/tenants created via POST /auth/setup
 * This seed only runs in dev to create a blank-slate DB with no fake data.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Running minimal bootstrap seed (no fake data)...');

  // Check if any tenant exists — if so, skip entirely
  const existingTenants = await prisma.tenant.count();
  if (existingTenants > 0) {
    console.log(`Database already has ${existingTenants} tenant(s). Skipping seed.`);
    console.log('To reset completely: npx prisma migrate reset --force');
    return;
  }

  console.log('Database is empty and ready for first-time setup.');
  console.log('Open the web app and complete the "Setup Your Company" wizard to get started.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
