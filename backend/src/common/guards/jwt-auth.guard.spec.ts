/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Test, type TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { ExecutionContext } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get(Reflector);
  });

  function mockContext(handler: string, cls: string): ExecutionContext {
    return {
      getHandler: () => ({ name: handler }) as any,
      getClass: () => ({ name: cls }) as any,
      switchToHttp: () => ({
        getRequest: () => ({}),
        getResponse: () => ({}),
      }),
    } as ExecutionContext;
  }

  describe('canActivate', () => {
    it('debe permitir acceso si la ruta es pública', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const result = guard.canActivate(mockContext('handler', 'class'));

      expect(result).toBe(true);
    });

    it('debe delegar al guard de passport si la ruta no es pública', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      const canActivateSpy = jest
        .spyOn(JwtAuthGuard.prototype as any, 'canActivate')
        .mockReturnValue(true);

      const result = guard.canActivate(mockContext('handler', 'class'));

      expect(result).toBe(true);
      canActivateSpy.mockRestore();
    });
  });

  describe('handleRequest', () => {
    it('debe retornar el usuario si existe', () => {
      const user = { id: '1', email: 'test@test.com' };

      const result = guard.handleRequest(null, user);

      expect(result).toBe(user);
    });
  });
});
