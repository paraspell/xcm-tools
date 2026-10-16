import { InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

const RECAPTCHA_MIN_SCORE = 0.5;

type RecaptchaVerifyResponse = {
  success: boolean;
  score?: number;
  action?: string;
};

export const validateRecaptcha = async (
  recaptcha: string,
  recaptchaSecretKey: string,
  action: string,
): Promise<boolean> => {
  const data = {
    secret: recaptchaSecretKey,
    response: recaptcha,
  };

  const response = await axios
    .post<RecaptchaVerifyResponse>(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: data,
      },
    )
    .catch((error) => {
      throw new InternalServerErrorException(
        'Error verifying reCAPTCHA: ' + error,
      );
    });

  const { success, score = 0, action: responseAction } = response.data;

  return success && responseAction === action && score >= RECAPTCHA_MIN_SCORE;
};
