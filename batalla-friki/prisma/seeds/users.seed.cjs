const bcrypt = require('bcrypt');

module.exports = async function seedUsers(prisma) {
  const userPass = await bcrypt.hash('123456', 10);
  const users = [
    { email: 'jugador1@test.com', name: 'NoobMaster69', level: 1, xp: 0 },
    { email: 'jugador2@test.com', name: 'ProGamer_X', level: 5, xp: 500 },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        password: userPass,
        name: u.name,
        role: 'USER',
        level: u.level,
        xp: u.xp,
      },
    });
  }
};
