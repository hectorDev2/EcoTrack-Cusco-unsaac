import { Test, type TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { ExecutionContext } from '@nestjs/common';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn() },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
  });

  function mockContext(userRole: string): ExecutionContext {
    return {
      getHandler: () => ({ name: 'handler' }) as any,
      getClass: () => ({ name: 'class' }) as any,
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: userRole } }),
      }),
    } as unknown as ExecutionContext;
  }

  describe('canActivate', () => {
    it('debe permitir acceso si no hay roles requeridos', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      expect(guard.canActivate(mockContext('CITIZEN'))).toBe(true);
    });

    it('debe permitir acceso si el usuario tiene el rol requerido', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

      expect(guard.canActivate(mockContext('ADMIN'))).toBe(true);
    });

    it('debe lanzar ForbiddenException si el usuario no tiene el rol requerido', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

      expect(() => guard.canActivate(mockContext('CITIZEN'))).toThrow(ForbiddenException);
    });

    it('debe permitir si el rol está entre los requeridos', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN', 'DRIVER']);

      expect(guard.canActivate(mockContext('DRIVER'))).toBe(true);
    });
  });
});
