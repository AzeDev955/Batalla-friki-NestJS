import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';

interface PlayerStats {
  userId: number;
  characterId: number;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  socketId: string;
}

export interface ActiveBattle {
  id: string;
  player1: PlayerStats;
  player2: PlayerStats;
  turn: number;
  log: string[];
}

@Injectable()
export class BattlesService {
  private activeBattles: Map<string, ActiveBattle> = new Map();

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  async createBattle(
    player1Id: number,
    player1CharId: number,
    player2Id: number,
    player2CharId: number,
    socketId: string,
  ) {
    const char1 = await this.prisma.character.findUnique({
      where: { id: player1CharId },
    });
    const char2 = await this.prisma.character.findUnique({
      where: { id: player2CharId },
    });

    if (!char1 || !char2)
      throw new NotFoundException('Uno de los personajes no existe');

    const battleId = `battle-${Date.now()}`;

    const newBattle: ActiveBattle = {
      id: battleId,
      player1: {
        userId: player1Id,
        characterId: char1.id,
        name: char1.name,
        hp: char1.hp,
        maxHp: char1.hp,
        attack: char1.attack,
        socketId,
      },
      player2: {
        userId: player2Id,
        characterId: char2.id,
        name: char2.name,
        hp: char2.hp,
        maxHp: char2.hp,
        attack: char2.attack,
        socketId: '',
      },
      turn: player1Id,
      log: [`Batalla iniciada: ${char1.name} vs ${char2.name}`],
    };

    this.activeBattles.set(battleId, newBattle);
    return newBattle;
  }

  joinBattle(battleId: string, userId: number, socketId: string) {
    const battle = this.activeBattles.get(battleId);
    if (!battle) throw new NotFoundException('Batalla no encontrada');

    if (battle.player2.userId === userId) {
      battle.player2.socketId = socketId;
    } else if (battle.player1.userId === userId) {
      battle.player1.socketId = socketId;
    } else {
      throw new Error('No eres parte de esta batalla');
    }

    return battle;
  }

  async attack(battleId: string, userId: number) {
    const battle = this.activeBattles.get(battleId);
    if (!battle) throw new Error('Batalla no existe');

    if (battle.turn !== userId) throw new Error('No es tu turno');

    const attacker =
      battle.player1.userId === userId ? battle.player1 : battle.player2;
    const defender =
      battle.player1.userId === userId ? battle.player2 : battle.player1;

    const damage = Math.floor(
      attacker.attack + Math.random() * (attacker.attack * 0.1),
    );
    defender.hp = Math.max(0, defender.hp - damage);

    const msg = `${attacker.name} golpea a ${defender.name} causando ${damage} daño. (HP restante: ${defender.hp})`;
    battle.log.push(msg);

    if (defender.hp <= 0) {
      return this.endBattle(battle, attacker, defender);
    }

    battle.turn = defender.userId;

    return { status: 'ongoing', battle };
  }

  private async endBattle(
    battle: ActiveBattle,
    winner: PlayerStats,
    loser: PlayerStats,
  ) {
    await this.prisma.battle.create({
      data: {
        winnerId: winner.userId,
        loserId: loser.userId,
        log: battle.log,
      },
    });

    await this.usersService.addExperience(winner.userId, 10);
    this.activeBattles.delete(battle.id);

    return {
      status: 'finished',
      winner: winner.name,
      loser: loser.name,
      battle,
    };
  }
}
