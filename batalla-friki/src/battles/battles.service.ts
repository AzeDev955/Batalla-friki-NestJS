import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class BattlesService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  async create(data: {
    player1Id: number;
    player1CharId: number;
    player2Id: number;
    player2CharId: number;
  }) {
    const char1 = await this.prisma.character.findUnique({
      where: { id: data.player1CharId },
    });
    const char2 = await this.prisma.character.findUnique({
      where: { id: data.player2CharId },
    });

    if (!char1 || !char2)
      throw new NotFoundException('Personaje no encontrado');

    const battle = await this.prisma.battle.create({
      data: {
        mode: 'PVP',
        status: 'IN_PROGRESS',
        initiatorUserId: data.player1Id,
        initiatorCharacterId: data.player1CharId,
        initiatorCurrentHp: char1.hp, // HP Inicial

        opponentUserId: data.player2Id,
        opponentCharacterId: data.player2CharId,
        opponentCurrentHp: char2.hp, // HP Inicial

        nextTurn: 'INITIATOR',
        log: [`Batalla iniciada: ${char1.name} vs ${char2.name}`],
      },
      include: {
        initiatorCharacter: true,
        opponentCharacter: true,
        initiatorUser: true,
        opponentUser: true,
      },
    });

    return this.mapBattleToDto(battle);
  }

  async processTurn(battleId: number, userId: number) {
    const battle = await this.prisma.battle.findUnique({
      where: { id: battleId },
      include: {
        initiatorCharacter: true,
        opponentCharacter: true,
        initiatorUser: true,
        opponentUser: true,
      },
    });

    if (!battle) throw new NotFoundException('Batalla no encontrada');
    if (battle.status !== 'IN_PROGRESS')
      throw new BadRequestException('La batalla ha terminado');

    const isInitiator = battle.initiatorUserId === userId;
    const isOpponent = battle.opponentUserId === userId;

    if (!isInitiator && !isOpponent)
      throw new BadRequestException('No estás en esta batalla');

    const isMyTurn =
      (battle.nextTurn === 'INITIATOR' && isInitiator) ||
      (battle.nextTurn === 'OPPONENT' && isOpponent);

    if (!isMyTurn) throw new BadRequestException('No es tu turno');

    const attackerChar = isInitiator
      ? battle.initiatorCharacter
      : battle.opponentCharacter;
    const damage = Math.floor(
      attackerChar.attack * (0.9 + Math.random() * 0.2),
    );

    let newInitiatorHp = battle.initiatorCurrentHp;
    let newOpponentHp = battle.opponentCurrentHp;

    if (isInitiator) {
      newOpponentHp = Math.max(0, newOpponentHp - damage);
    } else {
      newInitiatorHp = Math.max(0, newInitiatorHp - damage);
    }

    const opponentDied = newOpponentHp <= 0;
    const initiatorDied = newInitiatorHp <= 0;
    const isGameOver = opponentDied || initiatorDied;

    let winnerId = null;
    let loserId = null;

    const logMsg = `⚔️ ${isInitiator ? battle.initiatorUser.name : battle.opponentUser.name} (${attackerChar.name}) atacó e hizo ${damage} de daño!`;
    const newLogs = [...battle.log, logMsg];

    if (isGameOver) {
      winnerId = initiatorDied ? battle.opponentUserId : battle.initiatorUserId;
      loserId = initiatorDied ? battle.initiatorUserId : battle.opponentUserId;
      newLogs.push(
        `🏆 ¡Batalla terminada! Ganador: ${initiatorDied ? battle.opponentUser.name : battle.initiatorUser.name}`,
      );

      if (winnerId) await this.usersService.registerWin(winnerId);
      if (loserId) await this.usersService.registerLoss(loserId);
    }

    const updatedBattle = await this.prisma.battle.update({
      where: { id: battleId },
      data: {
        initiatorCurrentHp: newInitiatorHp,
        opponentCurrentHp: newOpponentHp,
        log: newLogs,
        status: isGameOver ? 'FINISHED' : 'IN_PROGRESS',
        winnerUserId: winnerId,
        nextTurn: isGameOver
          ? battle.nextTurn
          : battle.nextTurn === 'INITIATOR'
            ? 'OPPONENT'
            : 'INITIATOR',
      },
      include: {
        initiatorCharacter: true,
        opponentCharacter: true,
        initiatorUser: true,
        opponentUser: true,
      },
    });

    return this.mapBattleToDto(updatedBattle);
  }
  private mapBattleToDto(battle: any) {
    return {
      id: battle.id,
      mode: battle.mode,
      status: battle.status,
      player1: {
        userId: battle.initiatorUserId,
        name: battle.initiatorUser?.name || 'Jugador 1',
        characterId: battle.initiatorCharacterId,
        charName: battle.initiatorCharacter.name,
        hp: battle.initiatorCurrentHp,
        maxHp: battle.initiatorCharacter.hp,
        attack: battle.initiatorCharacter.attack,
      },
      player2: {
        userId: battle.opponentUserId,
        name: battle.opponentUser?.name || 'Jugador 2',
        characterId: battle.opponentCharacterId,
        charName: battle.opponentCharacter.name,
        hp: battle.opponentCurrentHp,
        maxHp: battle.opponentCharacter.hp,
        attack: battle.opponentCharacter.attack,
      },
      turn:
        battle.nextTurn === 'INITIATOR'
          ? battle.initiatorUserId
          : battle.opponentUserId,
      log: battle.log,
      winnerUserId: battle.winnerUserId,
    };
  }

  async createPve(data: { playerId: number; playerCharId: number }) {
    const playerChar = await this.prisma.character.findUnique({
      where: { id: data.playerCharId },
    });
    if (!playerChar) throw new NotFoundException('Personaje no encontrado');

    const botUser = await this.prisma.user.findUnique({
      where: { email: 'bot@batalla.com' },
    });
    if (!botUser)
      throw new NotFoundException('El Bot no ha sido creado en el seed');

    const battle = await this.prisma.battle.create({
      data: {
        mode: 'PVE',
        status: 'IN_PROGRESS',

        initiatorUserId: data.playerId,
        initiatorCharacterId: data.playerCharId,
        initiatorCurrentHp: playerChar.hp,

        opponentUserId: botUser.id,
        opponentCharacterId: playerChar.id,
        opponentCurrentHp: playerChar.hp,

        nextTurn: 'INITIATOR',
        log: [
          `Batalla PVE iniciada: ${playerChar.name} vs ${playerChar.name} (CPU)`,
        ],
      },
      include: {
        initiatorCharacter: true,
        opponentCharacter: true,
        initiatorUser: true,
        opponentUser: true,
      },
    });

    return this.mapBattleToDto(battle);
  }
}
