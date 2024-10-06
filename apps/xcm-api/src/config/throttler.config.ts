import { type ThrottlerModuleOptions } from '@nestjs/throttler';
import { type ConfigService } from '@nestjs/config';
import { type RequestWithUser } from '../types/types.js';

export const throttlerConfig = (
  config: ConfigService,
): ThrottlerModuleOptions => ({
  throttlers: [
    {
      ttl:
        process.env.NODE_ENV === 'test' ? 0 : config.get('RATE_LIMIT_TTL_SEC'),
      limit: (context) => {
        const request: RequestWithUser = context.switchToHttp().getRequest();
        if (request.user && request.user.requestLimit) {
          return request.user.requestLimit;
        }
        return request.user
          ? config.get('RATE_LIMIT_REQ_COUNT_AUTH')
          : config.get('RATE_LIMIT_REQ_COUNT_PUBLIC');
      },
    },
  ],
});
