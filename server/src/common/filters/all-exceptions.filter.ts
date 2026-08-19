import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { ErrorCode } from '@/common/constants/error-codes';

interface PostgresDriverError {
  code?: string;
  constraint?: string;
}

interface ResolvedError {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
}

const DEFAULT_CODE_BY_STATUS: Record<number, string> = {
  400: ErrorCode.BAD_REQUEST,
  401: ErrorCode.UNAUTHORIZED,
  403: ErrorCode.FORBIDDEN,
  404: ErrorCode.NOT_FOUND,
  409: ErrorCode.CONFLICT,
  429: ErrorCode.TOO_MANY_REQUESTS,
  503: ErrorCode.SERVICE_UNAVAILABLE,
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const resolved = this.resolve(exception);

    if (resolved.statusCode >= 500) {
      this.logger.error(
        exception instanceof Error ? exception.stack : exception,
      );
    }

    response.status(resolved.statusCode).json({
      statusCode: resolved.statusCode,
      error: {
        code: resolved.code,
        message: resolved.message,
        details: resolved.details,
        requestId: request.headers['x-request-id'],
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }

  private resolve(exception: unknown): ResolvedError {
    if (exception instanceof QueryFailedError) {
      const driverError = (exception as { driverError?: PostgresDriverError })
        .driverError;

      if (driverError?.code === '23505') {
        const isUnitConflict =
          driverError.constraint === 'uq_apartments_project_unit';
        return {
          statusCode: 409,
          code: isUnitConflict
            ? ErrorCode.UNIT_ALREADY_EXISTS
            : ErrorCode.CONFLICT,
          message: isUnitConflict
            ? 'A unit with this number already exists in this project'
            : 'Resource already exists',
        };
      }
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === 'object' && body !== null) {
        const record = body as Record<string, unknown>;

        // ValidationPipe throws BadRequestException with `message: string[]`.
        if (Array.isArray(record.message)) {
          return {
            statusCode,
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Validation failed',
            details: record.message,
          };
        }

        return {
          statusCode,
          code:
            typeof record.code === 'string'
              ? record.code
              : (DEFAULT_CODE_BY_STATUS[statusCode] ??
                ErrorCode.INTERNAL_SERVER_ERROR),
          message:
            typeof record.message === 'string'
              ? record.message
              : exception.message,
        };
      }

      return {
        statusCode,
        code:
          DEFAULT_CODE_BY_STATUS[statusCode] ?? ErrorCode.INTERNAL_SERVER_ERROR,
        message: exception.message,
      };
    }

    return {
      statusCode: 500,
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }
}
