require('dotenv').config();

const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const path = require('path');
const bcrypt = require('bcrypt');

const { PrismaClient } = require('../../generated/prisma2');

async function main() {
  console.log('🌱 Iniciando Seeding...');

  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const characters = [
      { name: 'Goblin', hp: 50, attack: 10, level: 1, minLevel: 1 },
      { name: 'Orco', hp: 120, attack: 25, level: 2, minLevel: 2 },
      { name: 'Dragón', hp: 500, attack: 80, level: 5, minLevel: 5 },
      { name: 'Mago Oscuro', hp: 80, attack: 150, level: 3, minLevel: 3 },
    ];

    console.log('🧙‍♂️ Creando personajes...');
    for (const char of characters) {
      await prisma.character.upsert({
        where: { name: char.name },
        update: {},
        create: {
          name: char.name,
          hp: char.hp,
          attack: char.attack,
          level: char.level,
          minLevel: char.minLevel,
        },
      });
    }

    // --- USUARIO ADMIN ---
    console.log('👑 Creando Admin...');
    const password = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
      where: { email: 'admin@batalla.com' },
      update: {},
      create: {
        email: 'admin@batalla.com',
        password,
        name: 'Admin',
        level: 99,
        xp: 1000,
        wins: 100,
        role: 'ADMIN',
      },
    });

    try {
      const adminRole = await prisma.role.upsert({
        where: { name: 'ADMIN' },
        update: {},
        create: { name: 'ADMIN' },
      });

      await prisma.role.upsert({
        where: { name: 'USER' },
        update: {},
        create: { name: 'USER' },
      });

      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: admin.id,
            roleId: adminRole.id,
          },
        },
        update: {},
        create: {
          userId: admin.id,
          roleId: adminRole.id,
        },
      });
    } catch (error) {
      console.log(
        '⚠️ Saltando creación de tabla Roles (probablemente usas Enum en User).',
      );
    }

    console.log('✅ Seeding completado con éxito.');
  } catch (e) {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
