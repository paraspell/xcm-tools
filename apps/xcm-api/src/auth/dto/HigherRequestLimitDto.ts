export class HigherRequestLimitDto {
  email: string;
  api_key: string;
  reason: string;
  requestedLimit: string;
  'g-recaptcha-response': string;
}
