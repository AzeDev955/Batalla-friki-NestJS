const bcrypt = require('bcrypt');

module.exports = async function seedUsers(prisma) {
  console.log('Sembrando Usuarios Humanos...');
  const adminPass = await bcrypt.hash('admin', 10);
  await prisma.user.upsert({
    where: { email: 'admin@batalla.com' },
    update: {},
    create: {
      email: 'admin@batalla.com',
      password: adminPass,
      name: 'Super Admin',
      role: 'ADMIN',
      level: 99,
      xp: 9999,
      wins: 100,
    },
  });

  console.log('Admin creado.');
};
