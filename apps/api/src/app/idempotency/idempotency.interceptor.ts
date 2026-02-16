import {
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, from, of, switchMap, catchError, tap, throwError } from 'rxjs';
import { IdempotencyService } from './idempotency.service';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly idempotency: IdempotencyService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse();

    if (req.method.toUpperCase() !== 'POST') {
      return next.handle();
    }

    const keyRaw = req.headers['idempotency-key'];
    const key = Array.isArray(keyRaw) ? keyRaw[0] : keyRaw;
    if (!key) {
      return next.handle();
    }

    const path = `${req.baseUrl}${req.path}`;
    const userId = (req as { user?: { sub?: string } }).user?.sub ?? 'anonymous';
    const requestHash = this.idempotency.stableHash({ body: req.body ?? null });

    return from(this.idempotency.cleanupExpired()).pipe(
      switchMap(() => from(this.idempotency.find(key, req.method, path, userId))),
      switchMap((existing) => {
        if (existing) {
          if (existing.request_hash !== requestHash) {
            throw new ConflictException('Idempotency key reuse with different payload');
          }
          if (existing.response_status !== null) {
            const body = existing.response_body ? JSON.parse(existing.response_body) : null;
            res.status(existing.response_status);
            return of(body);
          }
          throw new ConflictException('Idempotency key is already in progress');
        }

        return from(this.idempotency.create(key, req.method, path, userId, requestHash)).pipe(
          switchMap(() =>
            next.handle().pipe(
              tap((body) => {
                void this.idempotency.saveResponse(
                  key,
                  req.method,
                  path,
                  userId,
                  res.statusCode,
                  body
                );
              }),
              catchError((err) =>
                from(this.idempotency.delete(key, req.method, path, userId)).pipe(
                  switchMap(() => throwError(() => err))
                )
              )
            )
          )
        );
      })
    );
  }
}
