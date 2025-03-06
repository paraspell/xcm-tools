import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../users/users.service.js';
import { validateRecaptcha } from '../utils/validateRecaptcha.js';
import { HigherRequestLimitDto } from './dto/HigherRequestLimitDto.js';
import { generateConfirmationEmailHtml } from './utils/generateConfirmationEmailHtml.js';
import { generateNewHigherLimitRequestHtml } from './utils/generateNewHigherLimitRequestHtml.js';
import { sendEmail } from './utils/utils.js';

const sendEmails = async (
  { email, reason, requestedLimit }: HigherRequestLimitDto,
  userId: string,
  configService: ConfigService,
) => {
  const title = 'Request Submission Confirmation';
  await sendEmail(
    title,
    generateConfirmationEmailHtml(title, reason, requestedLimit),
    email,
    configService,
  );
  const emailsVal = configService.get<string>('EMAIL_ADDRESS_RECIPIENT_ARR');
  if (emailsVal) {
    const emails = emailsVal.split(',');
    const title = 'New higher limit request';
    await Promise.all(
      emails.map((adminEmail) =>
        sendEmail(
          title,
          generateNewHigherLimitRequestHtml(
            email,
            userId,
            reason,
            requestedLimit,
          ),
          adminEmail,
          configService,
        ),
      ),
    );
  }
};

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}

  async generateApiKey(recaptcha: string) {
    const recaptchaSecretKey = this.configService.get<string>(
      'RECAPTCHA_SECRET_KEY',
    );
    if (!recaptchaSecretKey) {
      throw new ForbiddenException('Recaptcha secret key is not set');
    }
    const verificationResult = await validateRecaptcha(
      recaptcha,
      recaptchaSecretKey,
    );
    if (verificationResult) {
      const { id } = await this.usersService.create();
      const payload = { userId: id };
      return {
        api_key: await this.jwtService.signAsync(payload),
      };
    } else {
      throw new ForbiddenException('Recaptcha verification failed');
    }
  }

  async submitHigherRequestLimitForm(dto: HigherRequestLimitDto) {
    const recaptchaSecretKey = this.configService.get<string>(
      'RECAPTCHA_SECRET_KEY',
    );
    if (!recaptchaSecretKey) {
      throw new ForbiddenException('Recaptcha secret key is not set');
    }
    const verificationResult = await validateRecaptcha(
      dto['g-recaptcha-response'],
      recaptchaSecretKey,
    );
    if (verificationResult) {
      const { userId } = this.jwtService.verify<{ userId: string }>(
        dto.api_key,
      );
      await sendEmails(dto, userId, this.configService);
    } else {
      throw new ForbiddenException('Recaptcha verification failed');
    }
  }
}
