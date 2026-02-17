import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const characters = [
    { name: 'Goblin', hp: 50, attack: 10, level: 1, minLevel: 1 },
    { name: 'Orco', hp: 120, attack: 25, level: 2, minLevel: 2 },
    { name: 'Dragón', hp: 500, attack: 80, level: 10, minLevel: 5 },
    { name: 'Mago Oscuro', hp: 80, attack: 150, level: 5, minLevel: 3 },
  ];

  for (const char of characters) {
    await prisma.character.upsert({
      where: { name: char.name },
      update: {},
      create: char,
    });
  }

  const password = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@batalla.com' },
    update: {},
    create: {
      email: 'admin@batalla.com',
      password,
      name: 'Admin Supremo',
      role: 'ADMIN',
      level: 99,
    },
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
