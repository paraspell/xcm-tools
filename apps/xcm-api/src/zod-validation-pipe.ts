import type { PipeTransform } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import type { ZodSchema } from 'zod';
import { ZodError } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: error.issues,
        });
      }
    }
  }
}
