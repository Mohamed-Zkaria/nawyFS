import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface Enveloped {
  data: unknown;
}

function isAlreadyEnveloped(value: unknown): value is Enveloped {
  return typeof value === 'object' && value !== null && 'data' in value;
}

// Services either return a plain payload (wrapped here as { data }) or an
// already-enveloped { data, meta } pagination result (passed through as-is).
// A handler returning nothing (204 responses) is left untouched.
@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      map((result: unknown) => {
        if (result === undefined) return result;
        if (isAlreadyEnveloped(result)) return result;
        return { data: result };
      }),
    );
  }
}
