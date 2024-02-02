import {
  describe,
  it,
  expect,
  vi,
  type MockInstance,
  afterAll,
  afterEach,
  beforeAll,
} from 'vitest';
import Logger from './Logger';

// Unit tests for Logger class
describe('Logger class', () => {
  let consoleLogSpy: MockInstance;

  beforeAll(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockClear();
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
  });

  it('logs messages', () => {
    Logger.log('Test message');
    expect(consoleLogSpy).toHaveBeenCalledWith('Test message');
  });
});
