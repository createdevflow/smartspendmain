import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

// Maps Prisma error codes to HTTP status codes with user-friendly messages
const PRISMA_ERROR_MAP: Record<string, { status: number; message: string; code: string }> = {
  P2002: { status: HttpStatus.CONFLICT, message: 'A record with this information already exists', code: 'DUPLICATE_ENTRY' },
  P2025: { status: HttpStatus.NOT_FOUND, message: 'The requested resource was not found', code: 'NOT_FOUND' },
  P2003: { status: HttpStatus.BAD_REQUEST, message: 'Invalid reference — related resource does not exist', code: 'INVALID_REFERENCE' },
  P2014: { status: HttpStatus.BAD_REQUEST, message: 'This operation would violate a required relationship', code: 'RELATION_VIOLATION' },
  P2016: { status: HttpStatus.NOT_FOUND, message: 'Required record not found', code: 'RECORD_NOT_FOUND' },
  P2022: { status: HttpStatus.BAD_REQUEST, message: 'Invalid database column reference', code: 'INVALID_COLUMN' },
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';
    let code: string = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as any;
        message = resp.message || exceptionResponse;
        code = resp.code || resp.error || 'HTTP_ERROR';
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Map known Prisma error codes — never expose Prisma internals to client
      const mapped = PRISMA_ERROR_MAP[exception.code];
      if (mapped) {
        status = mapped.status;
        message = mapped.message;
        code = mapped.code;
      } else {
        // Unknown Prisma error — log internally, return generic 500
        this.logger.error(`Unhandled Prisma error [${exception.code}]: ${exception.message}`, exception.stack);
        message = 'A database error occurred. Please try again.';
        code = 'DATABASE_ERROR';
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid data provided';
      code = 'VALIDATION_ERROR';
      this.logger.warn(`Prisma validation error: ${exception.message}`);
    } else if (exception instanceof Error) {
      // Don't expose internal errors to client
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
    }

    // Log all 5xx errors
    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url} → ${status}: ${JSON.stringify(message)}`);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      error: { code, message },
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
