import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FindProductsDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'iphone', description: 'Nomi bo‘yicha qidiruv' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1, description: 'Kategoriya id si' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;
}
