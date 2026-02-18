import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findOne(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async registerWin(userId: number) {
    const user = await this.findOne(userId);
    if (!user) return;

    let newXp = user.xp + 10;
    let newLevel = user.level;

    if (newXp >= 100) {
      newLevel++;
      newXp = newXp - 100;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        wins: { increment: 1 },
        xp: newXp,
        level: newLevel,
      },
    });
  }

  async registerLoss(userId: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        losses: { increment: 1 },
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({ where: { id }, data: updateUserDto });
  }

  remove(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }
}
