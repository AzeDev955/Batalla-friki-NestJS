import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsOptional,
  Min,
  IsUrl,
} from 'class-validator';

export class CreateCharacterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(1)
  hp: number; // Puntos de vida

  @IsInt()
  @Min(0)
  attack: number; // Puntos de ataque

  @IsInt()
  @Min(1)
  level: number; // Nivel de fuerza del monstruo

  @IsInt()
  @Min(1)
  @IsOptional()
  minLevel?: number;
}
