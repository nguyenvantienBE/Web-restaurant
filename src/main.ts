import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const config = app.get(ConfigService);

    // Enable CORS
    app.enableCors({
        origin: config.get('frontend.url'),
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
