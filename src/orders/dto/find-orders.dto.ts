import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../../generated/prisma/client';

export class FindOrdersDto {
  @ApiPropertyOptional({ enum: OrderStatus, example: 'PENDING' })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({
    example: '2026-09-07',
    description: 'Shu kunda berilgan buyurtmalar (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString()
  date?: string;
}
