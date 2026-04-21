import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { ForcePasswordChangeGuard } from './common/auth/force-password-change.guard';
import { SessionGuard } from './common/auth/session.guard';
import { ApiEnvelopeInterceptor } from './common/http/api-envelope.interceptor';
import { AuthService } from './modules/auth/application/auth.service';

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
    bufferLogs: true,
    cors: {
      origin: resolveCorsOrigin(),
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
      exposedHeaders: ['x-request-id'],
    },
  });

  app.useLogger(app.get(Logger));

  app.use(json({ limit: '12mb' }));
  app.use(urlencoded({ extended: true, limit: '12mb' }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new ApiEnvelopeInterceptor());
  const reflector = app.get(Reflector);
  app.useGlobalGuards(
    new SessionGuard(reflector, app.get(AuthService)),
    new ForcePasswordChangeGuard(reflector),
  );

  const port = Number(process.env.PORT ?? 3333);
  await app.listen(port);
  app.get(Logger).log(`Gentrix backend listening on :${port}`, 'Bootstrap');
}

void bootstrap();
