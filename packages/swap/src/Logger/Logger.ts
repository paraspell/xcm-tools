const Logger = {
  log(...messages: unknown[]): void {
    const isTestMode = typeof process !== 'undefined' && process.env.VITEST === 'true';
    if (isTestMode) {
      // eslint-disable-next-line no-console
      console.log(...messages);
    }
  },
};

export default Logger;
