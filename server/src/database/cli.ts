import 'reflect-metadata';
import { AppDataSource } from '@/database/data-source';
import { runSeed } from '@/database/seeds/seed';

async function main(): Promise<void> {
  const command = process.argv[2];
  if (command !== 'migrate' && command !== 'seed') {
    console.error('Usage: node cli.js <migrate|seed>');
    process.exit(1);
  }

  await AppDataSource.initialize();

  try {
    if (command === 'migrate') {
      const applied = await AppDataSource.runMigrations();
      console.log(`Applied ${applied.length} migration(s).`);
    } else {
      await runSeed(AppDataSource);
      console.log('Seed complete.');
    }
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
