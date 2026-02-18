module.exports = async function seedCharacters(prisma) {
  console.log('🐉 Sembrando Personajes...');

  const characters = [
    { name: 'Goblin', hp: 50, attack: 10, level: 1, minLevel: 1 },
    { name: 'Orco', hp: 120, attack: 25, level: 2, minLevel: 2 },
    { name: 'Mago Oscuro', hp: 80, attack: 150, level: 3, minLevel: 3 },
    { name: 'Dragón', hp: 500, attack: 80, level: 5, minLevel: 5 },
    { name: 'Rey Exánime', hp: 1000, attack: 200, level: 10, minLevel: 10 },
  ];

  for (const char of characters) {
    await prisma.character.upsert({
      where: { name: char.name },
      update: {},
      create: char,
    });
  }
  console.log('Personajes creados.');
};
