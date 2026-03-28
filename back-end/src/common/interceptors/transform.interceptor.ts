import { Injectable, NestInterceptor, ExecutionContext, CallHandler, StreamableFile } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
  meta?: any;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        if (data instanceof StreamableFile) {
          return data as unknown as Response<T>;
        }
        // If data already has the format { data, meta }, return as is
        if (data && typeof data === 'object' && 'data' in data) {
          return data;
        }
        // Otherwise wrap it
        return { data };
      }),
    );
  }
}
