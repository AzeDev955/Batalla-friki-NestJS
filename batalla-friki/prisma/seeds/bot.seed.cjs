const bcrypt = require('bcrypt');

module.exports = async function seedBot(prisma) {
  console.log('Sembrando la CPU (Bot)...');

  const botPass = await bcrypt.hash('bot123', 10);

  await prisma.user.upsert({
    where: { email: 'bot@batalla.com' },
    update: {},
    create: {
      email: 'bot@batalla.com',
      password: botPass,
      name: 'CPU Master',
      role: 'USER',
      level: 999,
      xp: 0,
      wins: 0,
    },
  });
  console.log('   ✅ Bot creado.');
};
