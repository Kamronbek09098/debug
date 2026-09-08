import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Samsung Galaxy A55' })
  @IsString()
  @MinLength(2)
  title: string;

  @ApiPropertyOptional({ example: 'O‘rta byudjet telefon' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 399 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 12 })
  @IsInt()
  @Min(0)
  stock: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  categoryId: number;
}
