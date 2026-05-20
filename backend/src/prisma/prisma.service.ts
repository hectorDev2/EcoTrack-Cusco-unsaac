import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const dbUrl = process.env.DATABASE_URL || '';
    const tursoUrl = process.env.TURSO_DATABASE_URL;

    if (dbUrl.startsWith('file:') || !tursoUrl) {
      super();
    } else {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PrismaLibSQL } = require('@prisma/adapter-libsql');
      super({
        adapter: new PrismaLibSQL({
          url: tursoUrl,
          authToken: process.env.TURSO_AUTH_TOKEN!,
        }),
      });
    }
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
