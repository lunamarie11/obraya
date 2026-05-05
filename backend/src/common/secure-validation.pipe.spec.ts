import { BadRequestException } from '@nestjs/common';
import { IsInt, IsOptional, IsString, Length } from 'class-validator';
import { SecureValidationPipe } from './secure-validation.pipe';
import { InputSanitizerService } from './input-sanitizer.service';

describe('SecureValidationPipe', () => {
  let pipe: SecureValidationPipe;

  class TestDto {
    @IsString()
    @Length(3, 20)
    name: string;

    @IsInt()
    age: number;

    @IsOptional()
    @IsString()
    note?: string;
  }

  beforeEach(() => {
    pipe = new SecureValidationPipe(new InputSanitizerService());
  });

  it('should sanitize and transform valid input', async () => {
    const value = {
      name: '  Alice <b>hello</b>  ',
      age: '30',
      note: 'safe text',
    };

    const result = await pipe.transform(value, {
      metatype: TestDto,
      type: 'body',
      data: undefined,
    });

    expect(result).toEqual({
      name: 'Alice bhello/b',
      age: 30,
      note: 'safe text',
    });
    expect(typeof result.age).toBe('number');
  });

  it('should throw on malicious input', async () => {
    const value = {
      name: '<script>alert(1)</script>',
      age: '25',
    };

    await expect(
      pipe.transform(value, {
        metatype: TestDto,
        type: 'body',
        data: undefined,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should forbid non-whitelisted properties', async () => {
    const value = {
      name: 'Bob',
      age: '22',
      extra: 'not allowed',
    };

    await expect(
      pipe.transform(value, {
        metatype: TestDto,
        type: 'body',
        data: undefined,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
