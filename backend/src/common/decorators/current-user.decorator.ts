import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';

export interface JwtUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'CITIZEN' | 'DRIVER';
}

const VALID_KEYS: (keyof JwtUser)[] = ['id', 'email', 'role'];

export const CurrentUser = createParamDecorator(
  (data: keyof JwtUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: JwtUser }>();
    const user = request.user;

    if (!user) return undefined;

    if (data !== undefined) {
      if (!VALID_KEYS.includes(data)) {
        throw new BadRequestException(
          `Campo de usuario inválido: "${String(data)}". Válidos: ${VALID_KEYS.join(', ')}`,
        );
      }
      return user[data];
    }

    return user;
  },
);
