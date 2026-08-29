import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger docs
  const config = new DocumentBuilder()
    .setTitle('Loyalty Platform API')
    .setDescription('Full-featured loyalty & rewards platform with gamification, ID verification, and facial recognition')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication & registration')
    .addTag('Users', 'User management')
    .addTag('Points', 'Points earning & redemption')
    .addTag('Rewards', 'Reward catalog & claims')
    .addTag('Gamification', 'Challenges, badges, leaderboards')
    .addTag('Identity', 'ID verification & facial recognition')
    .addTag('Webhooks', 'Webhook management')
    .addTag('Analytics', 'Dashboard analytics')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Loyalty Platform API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
