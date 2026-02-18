import { Test, TestingModule } from '@nestjs/testing';
import { CharactersService } from './characters.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  character: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('CharactersService', () => {
  let service: CharactersService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CharactersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CharactersService>(CharactersService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of characters', async () => {
      const result = [{ id: 1, name: 'Goblin', level: 1 }];
      prisma.character.findMany.mockResolvedValue(result);

      expect(await service.findAll()).toBe(result);
    });
  });

  describe('create', () => {
    it('should create a character', async () => {
      const dto = {
        name: 'Dragon',
        hp: 100,
        attack: 50,
        level: 10,
        minLevel: 5,
      };
      prisma.character.create.mockResolvedValue({ id: 1, ...dto });

      expect(await service.create(dto)).toEqual({ id: 1, ...dto });
      expect(prisma.character.create).toHaveBeenCalled();
    });
  });
});
