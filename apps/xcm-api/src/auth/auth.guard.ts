import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AnalyticsService } from '../analytics/analytics.service.js';
import { RequestWithUser } from '../types/types.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private analyticsService: AnalyticsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: RequestWithUser = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'] as string;

    if (!apiKey) {
      return true;
    }

    try {
      const { userId } = this.jwtService.verify<{ userId: string }>(apiKey);
      if (!userId) throw new ForbiddenException('Invalid API key.');
      const dbUser = await this.usersService.findOne(userId);
      if (!dbUser) throw new ForbiddenException('User not found.');
      this.analyticsService.identify(userId, {
        hasApiKey: 'true',
        requestLimit: dbUser.requestLimit,
      });
      request.user = dbUser;
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);
      throw new ForbiddenException(
        `The provided API key is not valid. Please generate a new one. Alternatively, if you want to use the API with free rate limiting, remove the key from the headers.`,
      );
    }
  }
}
