import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

import { toIsoDateString } from '@gentrix/shared-utils';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const request = host.switchToHttp().getRequest<{
      method?: string;
      url?: string;
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
      const label = [request.method, request.url].filter(Boolean).join(' ');

      this.logger.error(
        label || 'Unhandled request error',
        exception instanceof Error ? exception.stack : JSON.stringify(exception),
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
