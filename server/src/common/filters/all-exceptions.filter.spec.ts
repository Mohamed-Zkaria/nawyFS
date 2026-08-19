import {
  ArgumentsHost,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { AllExceptionsFilter } from '@/common/filters/all-exceptions.filter';
import { ApartmentNotFoundException } from '@/common/exceptions/domain.exceptions';

function createHost(): {
  host: ArgumentsHost;
  json: jest.Mock;
  status: jest.Mock;
} {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const request = { url: '/api/v1/apartments/abc', headers: {} };
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;
  return { host, json, status };
}

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  it('maps a domain not-found exception to 404 with its machine-readable code', () => {
    const { host, json, status } = createHost();

    filter.catch(new ApartmentNotFoundException('abc'), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        error: expect.objectContaining({ code: 'APARTMENT_NOT_FOUND' }),
      }),
    );
  });

  it('maps ValidationPipe array messages to VALIDATION_ERROR with details', () => {
    const { host, json, status } = createHost();

    filter.catch(
      new BadRequestException(['page must be a positive integer']),
      host,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          details: ['page must be a positive integer'],
        }),
      }),
    );
  });

  it('falls back to a generic 500 with no internal detail leaked', () => {
    const { host, json, status } = createHost();

    filter.catch(new Error('boom: leaked secret detail'), host);

    expect(status).toHaveBeenCalledWith(500);
    const body = json.mock.calls[0][0] as {
      error: { code: string; message: string };
    };
    expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(body.error.message).not.toContain('boom');
  });

  it('assigns a default code to a bare built-in HttpException', () => {
    const { host, json, status } = createHost();

    filter.catch(new NotFoundException('not here'), host);

    expect(status).toHaveBeenCalledWith(404);
    const body = json.mock.calls[0][0] as { error: { code: string } };
    expect(body.error.code).toBe('NOT_FOUND');
  });
});
