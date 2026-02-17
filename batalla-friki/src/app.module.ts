import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CharactersModule } from './characters/characters.module';
import { BattlesModule } from './battles/battles.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [AuthModule, UsersModule, CharactersModule, BattlesModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
