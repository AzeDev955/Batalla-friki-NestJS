import { Test, TestingModule } from '@nestjs/testing';
import { BattlesService } from './battles.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

const mockPrismaService = {
  character: { findUnique: jest.fn() },
  user: { findUnique: jest.fn() },
  battle: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockUsersService = {
  registerWin: jest.fn(),
  registerLoss: jest.fn(),
};

describe('BattlesService', () => {
  let service: BattlesService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BattlesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<BattlesService>(BattlesService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create (PVP)', () => {
    it('should create a battle correctly', async () => {
      prisma.character.findUnique
        .mockResolvedValueOnce({ id: 1, hp: 100, attack: 10, name: 'C1' })
        .mockResolvedValueOnce({ id: 2, hp: 120, attack: 12, name: 'C2' });

      const mockBattle = {
        id: 1,
        status: 'IN_PROGRESS',
        mode: 'PVP',
        initiatorUserId: 1,
        opponentUserId: 2,
        initiatorCharacterId: 1,
        opponentCharacterId: 2,
        initiatorCurrentHp: 100,
        opponentCurrentHp: 120,
        nextTurn: 'INITIATOR',
        log: [],
        winnerUserId: null,

        initiatorCharacter: { id: 1, name: 'C1', hp: 100, attack: 10 },
        opponentCharacter: { id: 2, name: 'C2', hp: 120, attack: 12 },
        initiatorUser: { id: 1, name: 'P1' },
        opponentUser: { id: 2, name: 'P2' },
      };

      prisma.battle.create.mockResolvedValue(mockBattle);

      const result = await service.create({
        player1Id: 1,
        player1CharId: 1,
        player2Id: 2,
        player2CharId: 2,
      });

      expect(prisma.battle.create).toHaveBeenCalled();
      expect(result.id).toBe(1);
      expect(result.player1.charName).toBe('C1');
    });
  });

  describe('processTurn', () => {
    it('should process damage and update battle', async () => {
      const battleState = {
        id: 1,
        status: 'IN_PROGRESS',
        mode: 'PVP',
        initiatorUserId: 1,
        opponentUserId: 2,
        nextTurn: 'INITIATOR',
        initiatorCurrentHp: 100,
        opponentCurrentHp: 100,
        initiatorCharacter: { attack: 20, name: 'Hero' },
        opponentCharacter: { attack: 20, name: 'Villain' },
        initiatorUser: { name: 'P1' },
        opponentUser: { name: 'P2' },
        log: [],
      };

      prisma.battle.findUnique.mockResolvedValue(battleState);

      prisma.battle.update.mockResolvedValue({
        ...battleState,
        opponentCurrentHp: 80,
        nextTurn: 'OPPONENT',
        initiatorCharacter: battleState.initiatorCharacter,
        opponentCharacter: battleState.opponentCharacter,
        initiatorUser: battleState.initiatorUser,
        opponentUser: battleState.opponentUser,
      });

      const result = await service.processTurn(1, 1);

      expect(prisma.battle.update).toHaveBeenCalled();
      expect(result.turn).toBe(2);
    });
  });
});
