import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, type Observable } from 'rxjs';

import type { ApiEnvelope } from '@gentrix/shared-types';
import { toIsoDateString } from '@gentrix/shared-utils';

@Injectable()
export class ApiEnvelopeInterceptor<T>
  implements NestInterceptor<T, ApiEnvelope<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiEnvelope<T>> {
    return next.handle().pipe(
      map((data) => ({
        data,
        meta: {
          generatedAt: toIsoDateString(new Date()),
          domain: 'gentrix' as const,
        },
      })),
    );
  }
}
