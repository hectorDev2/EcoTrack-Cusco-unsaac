import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppValidationPipe } from './common/pipes/validation.pipe';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const origins = process.env.CORS_ORIGINS?.split(',') ?? [
    'http://localhost:3000',
    'https://eco-track-cusco-unsaac.vercel.app',
  ];

  app.enableCors({
    origin: origins,
    credentials: true,
  });

  app.useGlobalPipes(new AppValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());

  app.use(helmet());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Eco Track Cusco API')
    .setDescription('API del sistema de gestión de residuos sólidos para Cusco')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);

  await app.listen(port);
  console.log(`🚀 Backend corriendo en http://localhost:${port}`);
  console.log(`📖 Documentación en http://localhost:${port}/docs`);
}

void bootstrap();
