import { beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import Logger from './Logger';

// Unit tests for Logger class
describe('Logger class', () => {
  let consoleLogSpy: MockInstance;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('logs messages', () => {
    Logger.log('Test message');
    expect(consoleLogSpy).toHaveBeenCalledWith('Test message');
  });
});
