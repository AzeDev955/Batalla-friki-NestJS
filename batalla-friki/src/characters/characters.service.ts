import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CharactersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCharacterDto: CreateCharacterDto) {
    const { minLevel = 1, ...data } = createCharacterDto;

    return await this.prisma.character.create({
      data: {
        ...data,
        minLevel,
      },
    });
  }

  async findAll() {
    return await this.prisma.character.findMany({
      orderBy: { level: 'asc' },
    });
  }

  async findOne(id: number) {
    const character = await this.prisma.character.findUnique({
      where: { id },
    });

    if (!character) {
      throw new NotFoundException(`Personaje con ID ${id} no encontrado`);
    }

    return character;
  }

  async update(id: number, updateCharacterDto: UpdateCharacterDto) {
    await this.findOne(id);

    return await this.prisma.character.update({
      where: { id },
      data: updateCharacterDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return await this.prisma.character.delete({
      where: { id },
    });
  }
}
