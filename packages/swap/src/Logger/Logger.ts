const Logger = {
  log(...messages: unknown[]): void {
    const isTestMode = process.env.VITEST === 'true';
    if (isTestMode) {
      // eslint-disable-next-line no-console
      console.log(...messages);
    }
  },
};

export default Logger;
