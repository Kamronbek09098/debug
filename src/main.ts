import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors();

  // ---------------------------------------------------------------
  // Global validation pipe — DTO larda yozilgan class-validator
  // qoidalari (@IsEmail, @MinLength, @Min, @IsNumber, ...) shu pipe
  // orqali ishlaydi. transform: true — query/param larni DTO dagi
  // tiplarga (number, boolean) o'giradi.
  // ---------------------------------------------------------------
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Debug Shop API')
    .setDescription(
      'Backend debugging mashqlari uchun API. Loyihada ataylab xatolar qoldirilgan.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Server:  http://localhost:${port}/api`);
  console.log(`Swagger: http://localhost:${port}/api/docs`);

}
bootstrap();
