import 'reflect-metadata';

import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';

import { AuthService } from './modules/auth/application/auth.service';
import { ApiExceptionFilter } from './common/http/api-exception.filter';
import { ApiEnvelopeInterceptor } from './common/http/api-envelope.interceptor';
import { ForcePasswordChangeGuard } from './common/auth/force-password-change.guard';
import { SessionGuard } from './common/auth/session.guard';
import { AppModule } from './app.module';

function resolveCorsOrigin():
  | true
  | string[]
  | ((origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void) {
  // En dev (sin CORS_ORIGIN seteada) reflejamos cualquier origen para no
  // pelear con localhost:4200, host.docker.internal, etc. En produccion
  // exigimos lista blanca explicita por env.
  const raw = process.env.CORS_ORIGIN?.trim();
  if (!raw) {
    return true;
  }
  if (raw === '*') {
    return true;
  }
  return raw.split(',').map((value) => value.trim()).filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    cors: {
      origin: resolveCorsOrigin(),
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
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
  const reflector = app.get(Reflector);
  app.useGlobalGuards(
    new SessionGuard(reflector, app.get(AuthService)),
    new ForcePasswordChangeGuard(reflector),
  );

  const port = Number(process.env.PORT ?? 3333);
  await app.listen(port);
  console.log(`Gentrix backend listening on http://localhost:${port}`);
}

void bootstrap();
