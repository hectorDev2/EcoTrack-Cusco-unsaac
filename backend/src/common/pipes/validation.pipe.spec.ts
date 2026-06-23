import { ArgumentMetadata } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { AppValidationPipe } from './validation.pipe';

class TestDto {
  @IsString()
  @MinLength(2)
  name!: string;
}

describe('AppValidationPipe', () => {
  let pipe: AppValidationPipe;

  beforeEach(() => {
    pipe = new AppValidationPipe();
  });

  it('debe estar definido', () => {
    expect(pipe).toBeDefined();
  });

  it('debe pasar un DTO válido', async () => {
    const metadata: ArgumentMetadata = { type: 'body', metatype: TestDto };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result = await pipe.transform({ name: 'Juan' }, metadata);

    expect(result).toEqual({ name: 'Juan' });
  });
});
