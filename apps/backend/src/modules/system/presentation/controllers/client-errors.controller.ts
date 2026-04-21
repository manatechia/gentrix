import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Ip,
  Post,
} from '@nestjs/common';
import { IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { Public } from '../../../../common/auth/public.decorator';
import { AllowDuringForcedChange } from '../../../../common/auth/force-password-change.guard';

const SEVERITIES = ['warn', 'error', 'fatal'] as const;
type Severity = (typeof SEVERITIES)[number];

export class ClientErrorDto {
  @IsString()
  @MaxLength(2048)
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(8192)
  stack?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  userAgent?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  requestId?: string;

  @IsOptional()
  @IsIn(SEVERITIES)
  severity?: Severity;

  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;
}

// Token bucket en memoria por IP. 60 req/min — lo suficiente para cubrir
// error bursts sin inundar los logs si algo se vuelve loco.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    buckets.set(ip, { count: 1, windowStart: now });
    return false;
  }
  bucket.count += 1;
  return bucket.count > MAX_PER_WINDOW;
}

@Controller('api/client-errors')
@Public()
@AllowDuringForcedChange()
export class ClientErrorsController {
  constructor(
    @InjectPinoLogger(ClientErrorsController.name)
    private readonly logger: PinoLogger,
  ) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  report(@Body() body: ClientErrorDto, @Ip() ip: string): void {
    if (isRateLimited(ip)) {
      throw new HttpException('rate limited', HttpStatus.TOO_MANY_REQUESTS);
    }

    const severity: Severity = body.severity ?? 'error';
    const payload = {
      clientRequestId: body.requestId,
      clientUrl: body.url,
      userAgent: body.userAgent,
      stack: body.stack,
      extra: body.context,
    };

    if (severity === 'warn') {
      this.logger.warn(payload, body.message);
    } else if (severity === 'fatal') {
      this.logger.fatal(payload, body.message);
    } else {
      this.logger.error(payload, body.message);
    }
  }
}
