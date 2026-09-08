import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'yangi@shop.uz' })
  @IsEmail({}, { message: 'Email formati noto‘g‘ri' })
  email: string;

  @ApiProperty({ example: 'parol123', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Parol kamida 6 ta belgidan iborat bo‘lsin' })
  password: string;

  @ApiProperty({ example: 'Yangi Foydalanuvchi' })
  @IsString()
  @MinLength(3)
  fullName: string;
}
