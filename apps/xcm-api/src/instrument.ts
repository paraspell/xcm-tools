import { init } from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

init({
  dsn: 'https://36c9503bf3deff6be0bc50359ff21116@o4505987334275072.ingest.sentry.io/4505987370319872',
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  environment: process.env.NODE_ENV || 'development',
});
