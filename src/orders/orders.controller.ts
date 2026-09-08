import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../generated/prisma/client';
import { OrdersService } from './orders.service';
import { FindOrdersDto } from './dto/find-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Savatdagi mahsulotlardan buyurtma yaratish' })
  create(@CurrentUser('id') userId: number) {
    return this.ordersService.create(userId);
  }

  @Get()
  @ApiOperation({ summary: 'Mening buyurtmalarim' })
  findAll(@CurrentUser('id') userId: number, @Query() query: FindOrdersDto) {
    return this.ordersService.findAll(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta buyurtma' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.ordersService.findOne(id, user);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Buyurtma holatini o‘zgartirish (faqat ADMIN)' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }
}
