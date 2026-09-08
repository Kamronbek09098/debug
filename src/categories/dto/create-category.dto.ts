import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Planshetlar' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'planshetlar' })
  @IsString()
  @MinLength(2)
  slug: string;
}
