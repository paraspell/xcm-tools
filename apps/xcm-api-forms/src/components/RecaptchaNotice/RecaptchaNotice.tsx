import { Anchor, Text } from '@mantine/core';

import classes from './RecaptchaNotice.module.css';

export const RecaptchaNotice = () => (
  <Text className={classes.notice}>
    This site is protected by reCAPTCHA and the Google{' '}
    <Anchor
      href="https://policies.google.com/privacy"
      inherit
      target="_blank"
      rel="noopener"
      className={classes.link}
    >
      Privacy Policy
    </Anchor>{' '}
    and{' '}
    <Anchor
      href="https://policies.google.com/terms"
      inherit
      target="_blank"
      rel="noopener"
      className={classes.link}
    >
      Terms of Service
    </Anchor>{' '}
    apply.
  </Text>
);
