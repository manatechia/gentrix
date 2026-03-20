import 'reflect-metadata';

import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';

import { AuthService } from './modules/auth/application/auth.service';
import { ApiExceptionFilter } from './common/http/api-exception.filter';
import { ApiEnvelopeInterceptor } from './common/http/api-envelope.interceptor';
import { SessionGuard } from './common/auth/session.guard';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    cors: {
      origin: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
  });

  app.use(json({ limit: '12mb' }));
  app.use(urlencoded({ extended: true, limit: '12mb' }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalInterceptors(new ApiEnvelopeInterceptor());
  app.useGlobalGuards(new SessionGuard(app.get(Reflector), app.get(AuthService)));

  const port = Number(process.env.PORT ?? 3333);
  await app.listen(port);
  console.log(`Gentrix backend listening on http://localhost:${port}`);
}

void bootstrap();
