import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('cart')
@ApiBearerAuth()
@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Mening savatim' })
  getCart(@CurrentUser('id') userId: number) {
    return this.cartService.getCart(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Savatga mahsulot qo‘shish' })
  addItem(@CurrentUser('id') userId: number, @Body() dto: AddToCartDto) {
    return this.cartService.addItem(userId, dto);
  }

  @Delete(':itemId')
  @ApiOperation({ summary: 'Savatdan bitta elementni o‘chirish' })
  removeItem(
    @CurrentUser('id') userId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.cartService.removeItem(userId, itemId);
  }

  @Delete()
  @ApiOperation({ summary: 'Savatni butunlay tozalash' })
  clear(@CurrentUser('id') userId: number) {
    return this.cartService.clear(userId);
  }
}
