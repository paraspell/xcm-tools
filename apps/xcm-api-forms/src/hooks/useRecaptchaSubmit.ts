import { useState } from 'react';

import { getRequestErrorMessage } from '../api';
import { getRecaptchaToken } from '../utils/recaptcha';

export const useRecaptchaSubmit = (action: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const submit = (request: (recaptchaResponse: string) => Promise<void>) => {
    if (loading) return;
    setLoading(true);
    setError(undefined);
    getRecaptchaToken(action)
      .then(request)
      .catch((e: unknown) => {
        setError(getRequestErrorMessage(e));
        setLoading(false);
      });
  };

  return { loading, error, submit };
};
