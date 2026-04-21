import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { Global, Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

import type { RequestWithSession } from '../auth/session.guard';

const isProd = process.env.NODE_ENV === 'production';

// Nest emite muchos logs de bootstrap (InstanceLoader, RouterExplorer, etc.).
// En prod los silenciamos para no saturar los logs de Render.
const NOISY_BOOTSTRAP_CONTEXTS = new Set([
  'InstanceLoader',
  'RouterExplorer',
  'RoutesResolver',
  'NestFactory',
  'NestApplication',
]);

function readRequestIdHeader(req: IncomingMessage): string | undefined {
  const raw = req.headers['x-request-id'];
  if (typeof raw === 'string') {
    return raw.trim() || undefined;
  }
  if (Array.isArray(raw) && raw.length > 0) {
    return raw[0]?.trim() || undefined;
  }
  return undefined;
}

@Global()
@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
        transport: isProd
          ? undefined
          : {
              target: 'pino-pretty',
              options: {
                singleLine: true,
                colorize: true,
                translateTime: 'SYS:HH:MM:ss.l',
                ignore: 'pid,hostname,req,res,responseTime',
                messageFormat:
                  '{context}{if req} {req.method} {req.url} -> {res.statusCode} ({responseTime}ms){end} {msg}',
              },
            },
        genReqId: (req: IncomingMessage, res: ServerResponse) => {
          const incoming = readRequestIdHeader(req);
          const id = incoming ?? randomUUID();
          res.setHeader('x-request-id', id);
          return id;
        },
        customProps: (req) => {
          const session = (req as IncomingMessage & RequestWithSession).authSession;
          return {
            userId: session?.user?.id ?? null,
            role: session?.user?.role ?? null,
          };
        },
        serializers: {
          req: (req: { id?: string; method?: string; url?: string }) => ({
            id: req.id,
            method: req.method,
            url: req.url,
          }),
          res: (res: { statusCode?: number }) => ({
            statusCode: res.statusCode,
          }),
        },
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.headers["x-forwarded-for"]',
            'req.headers["set-cookie"]',
          ],
          remove: true,
        },
        autoLogging: {
          ignore: (req) => req.url === '/health' || req.url === '/health/',
        },
        // En prod descartamos los logs ruidosos de bootstrap de Nest.
        hooks: isProd
          ? {
              logMethod(args, method) {
                const first = args[0];
                const ctx =
                  typeof first === 'object' && first !== null
                    ? (first as { context?: unknown }).context
                    : undefined;
                if (typeof ctx === 'string' && NOISY_BOOTSTRAP_CONTEXTS.has(ctx)) {
                  return;
                }
                return method.apply(this, args);
              },
            }
          : undefined,
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
