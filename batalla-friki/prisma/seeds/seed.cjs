// prisma/seeds/seed.cjs
require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../../generated/prisma2');

// Importamos los sub-seeders
const seedCharacters = require('./characters.seed.cjs');
const seedUsers = require('./users.seed.cjs');
const seedBot = require('./bot.seed.cjs');

async function main() {
  console.log('INICIANDO SEED MASIVO');

  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    await seedCharacters(prisma);
    await seedUsers(prisma);
    await seedBot(prisma);

    console.log('SEED COMPLETADO CON ÉXITO');
  } catch (e) {
    console.error('Error fatal en el seed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
