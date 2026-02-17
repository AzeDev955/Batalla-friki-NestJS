import { Module } from '@nestjs/common';
import { BattlesService } from './battles.service';
import { BattlesGateway } from './battles.gateway';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  providers: [BattlesGateway, BattlesService],
  imports: [PrismaModule, UsersModule],
})
export class BattlesModule {}
