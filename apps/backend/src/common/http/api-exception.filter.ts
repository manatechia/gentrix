import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Response } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { toIsoDateString } from '@gentrix/shared-utils';

@Catch()
@Injectable()
export class ApiExceptionFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(ApiExceptionFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const request = host.switchToHttp().getRequest<{
      method?: string;
      url?: string;
      id?: string;
    }>();
    const response = host.switchToHttp().getResponse<Response>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Unexpected server error.';

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const candidate = (exceptionResponse as { message?: string | string[] })
          .message;

        message = Array.isArray(candidate)
          ? candidate.join(', ')
          : candidate ?? message;
      }
    } else if (exception instanceof Error && process.env.NODE_ENV !== 'production') {
      message = exception.message;
    }

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        {
          err: exception instanceof Error
            ? { name: exception.name, message: exception.message, stack: exception.stack }
            : { value: exception },
          method: request.method,
          url: request.url,
          statusCode,
          reqId: request.id,
        },
        'Unhandled request error',
      );
    } else if (statusCode >= HttpStatus.BAD_REQUEST) {
      // 4xx: loguear a warn para ver validación fallida / auth / forbidden
      // sin inundar con stack traces. No incluye 404 de assets del SPA.
      this.logger.warn(
        {
          method: request.method,
          url: request.url,
          statusCode,
          reqId: request.id,
          message,
        },
        'Client-facing request error',
      );
    }

    response.status(statusCode).json({
      data: {
        message,
      },
      meta: {
        generatedAt: toIsoDateString(new Date()),
        domain: 'gentrix',
      },
    });
  }
}
