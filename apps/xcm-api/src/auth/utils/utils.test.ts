import type { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import * as nodemailer from 'nodemailer';
import { describe, expect, it, vi } from 'vitest';

import { sendEmail } from './utils.js';

vi.mock('nodemailer');
vi.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: vi.fn(
        class {
          setCredentials = vi.fn();
          getAccessToken = vi
            .fn()
            .mockResolvedValue({ token: 'mockAccessToken' });
        },
      ),
    },
  },
}));

describe('sendEmail', () => {
  const mockConfigService = {
    get: vi.fn(),
  } as unknown as ConfigService;

  const mockTransporter = {
    sendMail: vi.fn((_mailOptions, callback: (err: Error | null) => void) => {
      callback(null);
    }),
  };

  vi.mocked(nodemailer.createTransport).mockReturnValue(
    mockTransporter as unknown as ReturnType<typeof nodemailer.createTransport>,
  );

  it('should send an email successfully', async () => {
    mockConfigService.get = vi.fn().mockImplementation((key: string) => {
      switch (key) {
        case 'EMAIL_ADDRESS_SENDER':
          return 'sender@example.com';
        case 'EMAIL_CLIENT_ID':
          return 'mockClientId';
        case 'EMAIL_CLIENT_SECRET':
          return 'mockClientSecret';
        case 'EMAIL_REDIRECT_URI':
          return 'mockRedirectUri';
        case 'EMAIL_REFRESH_TOKEN':
          return 'mockRefreshToken';
        default:
          return null;
      }
    });

    await sendEmail(
      'Test Subject',
      '<p>This is a test email</p>',
      'recipient@example.com',
      mockConfigService,
    );

    expect(google.auth.OAuth2).toHaveBeenCalledWith(
      'mockClientId',
      'mockClientSecret',
      'mockRedirectUri',
    );

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      service: 'Gmail',
      auth: {
        type: 'OAuth2',
        user: 'sender@example.com',
        clientId: 'mockClientId',
        clientSecret: 'mockClientSecret',
        refreshToken: 'mockRefreshToken',
        accessToken: 'mockAccessToken',
      },
    });

    expect(mockTransporter.sendMail).toHaveBeenCalledWith(
      {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>This is a test email</p>',
      },
      expect.any(Function),
    );
  });

  it('should log an error if sendMail fails', async () => {
    mockTransporter.sendMail.mockImplementationOnce(
      (_mailOptions, callback) => {
        callback(new Error('SendMail Error'));
      },
    );

    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await sendEmail(
      'Test Subject',
      '<p>This is a test email</p>',
      'recipient@example.com',
      mockConfigService,
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error sending email:',
      new Error('SendMail Error'),
    );

    consoleErrorSpy.mockRestore();
  });
});
