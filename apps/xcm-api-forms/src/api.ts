export type HigherLimitRequest = {
  email: string;
  api_key: string;
  reason: string;
  requestedLimit: string;
};

type ApiKeyResponse = {
  api_key: string;
};

export class RequestError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Request failed with status ${status}`);
    this.status = status;
  }
}

const post = async (path: string, body: object) => {
  const response = await fetch(`../auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new RequestError(response.status);
  return response;
};

const isApiKeyResponse = (data: unknown): data is ApiKeyResponse =>
  typeof data === 'object' &&
  data !== null &&
  'api_key' in data &&
  typeof data.api_key === 'string';

export const generateApiKey = async (recaptchaResponse: string) => {
  const response = await post('generate', { recaptchaResponse });
  const data: unknown = await response.json();
  if (!isApiKeyResponse(data)) throw new RequestError(response.status);
  return data.api_key;
};

export const submitHigherLimitRequest = async (
  request: HigherLimitRequest,
  recaptchaResponse: string,
) => {
  await post('higher-request-limit-form', {
    ...request,
    'g-recaptcha-response': recaptchaResponse,
  });
};

export const getRequestErrorMessage = (error: unknown) =>
  error instanceof RequestError && error.status === 403
    ? 'reCAPTCHA verification failed. Please try again.'
    : 'Something went wrong. Please try again later.';
