import {
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AllExceptionsFilter } from './http-exception.filter';
import type { ArgumentsHost } from '@nestjs/common';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
  });

  function mockHost(statusJson: jest.Mock): ArgumentsHost {
    return {
      switchToHttp: () => ({
        getResponse: () => ({
          status: jest.fn().mockReturnValue({ json: statusJson }),
        }),
      }),
    } as unknown as ArgumentsHost;
  }

  it('debe retornar el status y message de una HttpException', () => {
    const json = jest.fn();
    const host = mockHost(json);
    const exception = new BadRequestException('Email inválido');

    filter.catch(exception, host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'Email inválido',
      }),
    );
  });

  it('debe retornar 500 para errores no controlados', () => {
    const json = jest.fn();
    const host = mockHost(json);

    filter.catch(new Error('Algo salió mal'), host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Error interno del servidor',
      }),
    );
  });

  it('debe incluir errors si la HttpException los provee', () => {
    const json = jest.fn();
    const host = mockHost(json);
    const details = { errors: [{ field: 'email', message: 'invalid' }] };
    const exception = new HttpException(
      { message: 'Validation failed', errors: details.errors },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );

    filter.catch(exception, host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 422,
        message: 'Validation failed',
        errors: details.errors,
      }),
    );
  });

  it('debe incluir timestamp en la respuesta', () => {
    const json = jest.fn();
    const host = mockHost(json);
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

    filter.catch(exception, host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        timestamp: expect.any(String),
      }),
    );
  });
});
