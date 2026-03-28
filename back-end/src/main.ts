import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

const JSON_BODY_LIMIT = '15mb';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  app.use(json({ limit: JSON_BODY_LIMIT }));
  app.use(urlencoded({ extended: true, limit: JSON_BODY_LIMIT }));

  const config = app.get(ConfigService);

  const frontendRaw = config.get<string>('frontend.url') || 'http://localhost:3001';
  const corsOrigins = [
    ...frontendRaw.split(',').map((s) => s.trim()),
    'http://localhost:3001',
    'http://localhost:5173',
    'http://127.0.0.1:3001',
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Restaurant Ordering API')
    .setDescription('Production-grade restaurant ordering system backend')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication')
    .addTag('Users')
    .addTag('Menu Items')
    .addTag('Categories')
    .addTag('Tables')
    .addTag('Orders')
    .addTag('Kitchen')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  const port = config.get('port') || 3000;
  await app.listen(port);

  console.log('\n🚀 Restaurant Ordering Backend is running!');
  console.log(`📍 Server: http://localhost:${port}`);
  console.log(`📚 Swagger: http://localhost:${port}/api`);
  console.log(`🔌 WebSocket: ws://localhost:${port}`);
  console.log('\n');
}

bootstrap();
