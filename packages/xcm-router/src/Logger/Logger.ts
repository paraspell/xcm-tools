const Logger = {
  log(...messages: unknown[]): void {
    const isEnabled = true;
    const isTestMode = process.env.VITEST === 'true';
    if (isEnabled || isTestMode) {
      // eslint-disable-next-line no-console
      console.log(...messages);
    }
  },
};

export default Logger;
