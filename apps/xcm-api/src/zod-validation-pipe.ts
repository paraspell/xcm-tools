import { type PipeTransform, BadRequestException } from '@nestjs/common';
import { ZodError, type ZodSchema } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    try {
      return this.schema.parse(value) as unknown;
    } catch (error) {
      console.log('error', error);
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: error.errors,
        });
      }
    }
  }
}
