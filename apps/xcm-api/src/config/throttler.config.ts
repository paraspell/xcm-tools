import { ThrottlerModuleOptions } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';

export const throttlerConfig = async (
  config: ConfigService,
): Promise<ThrottlerModuleOptions> => ({
  throttlers: [
    {
      ttl:
        process.env.NODE_ENV === 'test' ? 0 : config.get('RATE_LIMIT_TTL_SEC'),
      limit: (context) => {
        const request = context.switchToHttp().getRequest();
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
