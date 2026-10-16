export const getRecaptchaToken = (action: string) =>
  new Promise<void>((resolve) => grecaptcha.ready(resolve)).then(() =>
    grecaptcha.execute(import.meta.env.VITE_RECAPTCHA_SITE_KEY, { action }),
  );
