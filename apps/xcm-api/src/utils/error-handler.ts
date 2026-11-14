import {
  BadRequestException,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ParaSpellError } from '@paraspell/sdk';

export const handleXcmApiError = (error: unknown): never => {
  // NestJS HttpExceptions already carry the intended HTTP status (e.g. a
  // BadRequestException thrown by a service for invalid input). Pass them
  // through untouched instead of masking them as a 500.
  if (error instanceof HttpException) {
    throw error;
  }

  if (error instanceof ParaSpellError) {
    throw new BadRequestException(error.message);
  }

  if (error instanceof Error) {
    throw new InternalServerErrorException(error.message);
  }

  throw new InternalServerErrorException('An unknown error occurred');
};
