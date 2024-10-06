import * as nodemailer from 'nodemailer';
import { google } from 'googleapis';
import type { ConfigService } from '@nestjs/config';
const OAuth2 = google.auth.OAuth2;

export const sendEmail = async (
  subject: string,
  htmlContent: string,
  recipient: string,
  configService: ConfigService,
) => {
  const email = configService.get<string>('EMAIL_ADDRESS_SENDER');
  const clientId = configService.get<string>('EMAIL_CLIENT_ID');
  const clientSecret = configService.get<string>('EMAIL_CLIENT_SECRET');
  const redirectUri = configService.get<string>('EMAIL_REDIRECT_URI');
  const refreshToken = configService.get<string>('EMAIL_REFRESH_TOKEN');

  const myOAuth2Client = new OAuth2(clientId, clientSecret, redirectUri);
  myOAuth2Client.setCredentials({
    refresh_token: refreshToken,
  });
  const myAccessToken = await myOAuth2Client.getAccessToken();

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      type: 'OAuth2',
      user: email,
      clientId,
      clientSecret,
      refreshToken,
      accessToken: myAccessToken.token,
    },
  });

  transporter.sendMail(
    {
      from: email,
      to: recipient,
      subject,
      html: htmlContent,
    },
    (err) => {
      if (err) {
        console.error('Error sending email:', err);
      }
    },
  );
};
