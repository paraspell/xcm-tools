/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
const Logger = {
  log(...messages: any[]): void {
    const isEnabled = true;
    const isTestMode = process.env.VITEST === 'true';
    if (isEnabled || isTestMode) {
      console.log(...messages);
    }
  },
};

export default Logger;
