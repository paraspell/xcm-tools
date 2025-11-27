import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { ZodValidationPipe } from './zod-validation-pipe.js';

describe('ZodValidationPipe', () => {
  const validSchema = z.object({
    name: z.string(),
    age: z.number(),
  });

  const invalidSchema = z.object({
    age: z.number().positive(),
  });

  it('should return the parsed value if validation passes', () => {
    const pipe = new ZodValidationPipe(validSchema);
    const value = { name: 'John Doe', age: 30 };

    const result = pipe.transform(value);

    expect(result).toEqual(value);
  });

  it('should throw a BadRequestException with validation errors if validation fails', () => {
    const pipe = new ZodValidationPipe(invalidSchema);
    const invalidValue = { age: -5 };

    expect(() => pipe.transform(invalidValue)).toThrow(BadRequestException);
  });
});
