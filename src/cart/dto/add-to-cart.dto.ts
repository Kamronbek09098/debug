import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({ example: 1, description: 'Mahsulot id si' })
  @IsInt()
  productId: number;

  @ApiPropertyOptional({ example: 2, description: 'Miqdori (default 1)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}
