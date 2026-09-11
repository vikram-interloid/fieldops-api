import { json, urlencoded } from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Images arrive base64-encoded in a JSON body, which blows past Express's
  // 100kb default. Kept a little above the 5MB decoded cap in
  // upload.constants.ts so the API returns the friendly 413 rather than
  // Express's raw "entity too large".
  const bodyLimit = process.env.BODY_LIMIT ?? '8mb';
  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ extended: true, limit: bodyLimit }));

  // CORS: reflect any origin by default (works with credentials, unlike a
  // literal '*'). Set CORS_ORIGIN to a comma-separated allow-list to lock down;
  // '*' or unset means "allow all origins".
  const corsOrigin = process.env.CORS_ORIGIN;
  app.enableCors({
    origin:
      !corsOrigin || corsOrigin === '*'
        ? true
        : corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
