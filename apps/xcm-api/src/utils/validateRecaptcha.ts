import { InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

export const validateRecaptcha = async (
  recaptcha: string,
  recaptchaSecretKey: string,
): Promise<boolean> => {
  const data = {
    secret: recaptchaSecretKey,
    response: recaptcha,
  };

  const response = await axios
    .post('https://www.google.com/recaptcha/api/siteverify', null, {
      params: data,
    })
    .catch((error) => {
      throw new InternalServerErrorException(
        'Error verifying reCAPTCHA: ' + error,
      );
    });

  return (response.data as { success: boolean }).success;
};
