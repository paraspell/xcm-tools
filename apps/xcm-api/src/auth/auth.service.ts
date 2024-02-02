import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HigherRequestLimitDto } from './dto/HigherRequestLimitDto.js';
import { validateRecaptcha } from '../utils.js';
import { sendEmail } from './utils/utils.js';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service.js';
import { generateConfirmationEmailHtml } from './utils/generateConfirmationEmailHtml.js';
import { generateNewHigherLimitRequestHtml } from './utils/generateNewHigherLimitRequestHtml.js';

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
  const emailsVal = configService.get('EMAIL_ADDRESS_RECIPIENT_ARR');
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
    const verificationResult = await validateRecaptcha(
      recaptcha,
      this.configService.get('RECAPTCHA_SECRET_KEY'),
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
    const verificationResult = await validateRecaptcha(
      dto['g-recaptcha-response'],
      this.configService.get('RECAPTCHA_SECRET_KEY'),
    );
    if (verificationResult) {
      const { userId } = this.jwtService.verify(dto.api_key);
      await sendEmails(dto, userId, this.configService);
    } else {
      throw new ForbiddenException('Recaptcha verification failed');
    }
  }
}
