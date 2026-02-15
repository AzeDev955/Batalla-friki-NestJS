import { Test, TestingModule } from '@nestjs/testing';
import { BattlesGateway } from './battles.gateway';
import { BattlesService } from './battles.service';

describe('BattlesGateway', () => {
  let gateway: BattlesGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BattlesGateway, BattlesService],
    }).compile();

    gateway = module.get<BattlesGateway>(BattlesGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
