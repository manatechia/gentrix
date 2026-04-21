import 'reflect-metadata';

import { ConsoleLogger, ValidationPipe } from '@nestjs/common';
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

  const logger = app.get(Logger);

  // Red de seguridad para errores que no pasan por ApiExceptionFilter
  // (setTimeout, promesas sin catch, EventEmitters sin listener de error,
  // etc.). Si llegamos acá el proceso quedó en estado inconsistente —
  // logueamos y dejamos que Render nos recicle.
  process.on('uncaughtException', (err) => {
    logger.error(
      { err: { name: err.name, message: err.message, stack: err.stack } },
      'process.uncaughtException',
    );
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    const err =
      reason instanceof Error
        ? { name: reason.name, message: reason.message, stack: reason.stack }
        : { value: reason };
    logger.error({ err }, 'process.unhandledRejection');
  });

  app.enableShutdownHooks();
  for (const signal of ['SIGTERM', 'SIGINT'] as const) {
    process.once(signal, () => {
      logger.log(`Received ${signal}, shutting down...`, 'Bootstrap');
    });
  }

  const port = Number(process.env.PORT ?? 3333);
  await app.listen(port);
  logger.log(`Gentrix backend listening on :${port}`, 'Bootstrap');
}

bootstrap().catch((err: unknown) => {
  // Fallamos antes de que el logger de la app esté disponible: Prisma no
  // conecta, un módulo no levanta, etc. Usamos ConsoleLogger (lo que Render
  // ya captura por stdout) para no perder el stack en silencio.
  const fallback = new ConsoleLogger('Bootstrap');
  fallback.error(err instanceof Error ? (err.stack ?? err.message) : String(err));
  process.exit(1);
});
