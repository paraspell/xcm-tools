import type { ConfigService } from '@nestjs/config';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';

import type { RequestWithUser } from '../types/types.js';

export const throttlerConfig = (
  config: ConfigService,
): ThrottlerModuleOptions => {
  const rateLimitTtlSec = config.get<number>('RATE_LIMIT_TTL_SEC');
  if (!rateLimitTtlSec) {
    // eslint-disable-next-line no-restricted-syntax
    throw new Error('Missing rate limit configuration');
  }
  return {
    throttlers: [
      {
        ttl: process.env.NODE_ENV === 'test' ? 0 : rateLimitTtlSec,
        limit: (context) => {
          const rateLimitReqCountAuth = config.get<number>(
            'RATE_LIMIT_REQ_COUNT_AUTH',
          );
          const rateLimitReqCountPublic = config.get<number>(
            'RATE_LIMIT_REQ_COUNT_PUBLIC',
          );
          const request: RequestWithUser = context.switchToHttp().getRequest();
          if (request.user && request.user.requestLimit) {
            return request.user.requestLimit;
          }
          if (!rateLimitReqCountAuth || !rateLimitReqCountPublic) {
            // eslint-disable-next-line no-restricted-syntax
            throw new Error('Missing rate limit configuration');
          }
          return request.user ? rateLimitReqCountAuth : rateLimitReqCountPublic;
        },
      },
    ],
  };
};
