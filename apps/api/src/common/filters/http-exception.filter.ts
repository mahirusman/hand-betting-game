import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

interface CodedError {
  code?: string;
  message?: string | string[];
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = exception instanceof HttpException ? exception.getResponse() : {};
    const coded = typeof payload === 'object' && payload !== null ? (payload as CodedError) : {};
    const message = Array.isArray(coded.message)
      ? coded.message.join(', ')
      : coded.message ?? 'Unexpected server error.';

    response.status(status).json({
      success: false,
      error: {
        code: coded.code ?? (status === 400 ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR'),
        message,
      },
      timestamp: new Date().toISOString(),
    });
  }
}
