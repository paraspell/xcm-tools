import { describe, expect, it } from 'vitest';

import { AccountXcmCountType } from './account-msg-count.model.js';
import { AssetCount } from './asset-count.model.js';
import { MessageCount } from './message-count.model.js';
import { MessageCountByDay } from './message-count-by-day.model.js';
import { MessageCountByStatus } from './message-count-by-status.model.js';

describe('AccountXcmCountType', () => {
  it('should create an AccountXcmCountType object with the correct fields', () => {
    const accountXcmCount = new AccountXcmCountType();
    accountXcmCount.ecosystem = 'polkadot';
    accountXcmCount.id = 'account-1';
    accountXcmCount.count = 42;

    expect(accountXcmCount.ecosystem).toBe('polkadot');
    expect(accountXcmCount.id).toBe('account-1');
    expect(accountXcmCount.count).toBe(42);
  });

  it('should handle edge cases for fields', () => {
    const accountXcmCount = new AccountXcmCountType();
    accountXcmCount.ecosystem = '';
    accountXcmCount.id = '';
    accountXcmCount.count = 0;

    expect(accountXcmCount.ecosystem).toBe('');
    expect(accountXcmCount.id).toBe('');
    expect(accountXcmCount.count).toBe(0);
  });
});

describe('AssetCount', () => {
  it('should create an AssetCount object with the correct fields', () => {
    const assetCount = new AssetCount();
    assetCount.ecosystem = 'polkadot';
    assetCount.parachain = 'AssetHubPolkadot';
    assetCount.symbol = 'DOT';
    assetCount.count = 42;

    expect(assetCount.ecosystem).toBe('polkadot');
    expect(assetCount.parachain).toBe('AssetHubPolkadot');
    expect(assetCount.symbol).toBe('DOT');
    expect(assetCount.count).toBe(42);
  });

  it('should handle nullable paraId correctly', () => {
    const assetCount = new AssetCount();
    assetCount.ecosystem = '';
    assetCount.parachain = undefined;
    assetCount.symbol = 'KSM';
    assetCount.count = 10;

    expect(assetCount.ecosystem).toBe('');
    expect(assetCount.parachain).toBeUndefined();
    expect(assetCount.symbol).toBe('KSM');
    expect(assetCount.count).toBe(10);
  });

  it('should handle edge cases for count and symbol', () => {
    const assetCount = new AssetCount();
    assetCount.ecosystem = '';
    assetCount.parachain = '';
    assetCount.symbol = '';
    assetCount.count = 0;

    expect(assetCount.ecosystem).toBe('');
    expect(assetCount.parachain).toBe('');
    expect(assetCount.symbol).toBe('');
    expect(assetCount.count).toBe(0);
  });
});

describe('MessageCountByDay', () => {
  it('should create a MessageCountByDay object with the correct fields', () => {
    const messageCountByDay = new MessageCountByDay();
    messageCountByDay.ecosystem = 'polkadot';
    messageCountByDay.parachain = 'Acala';
    messageCountByDay.date = '2024-10-02';
    messageCountByDay.messageCount = 50;
    messageCountByDay.messageCountSuccess = 45;
    messageCountByDay.messageCountFailed = 5;

    expect(messageCountByDay.ecosystem).toBe('polkadot');
    expect(messageCountByDay.parachain).toBe('Acala');
    expect(messageCountByDay.date).toBe('2024-10-02');
    expect(messageCountByDay.messageCount).toBe(50);
    expect(messageCountByDay.messageCountSuccess).toBe(45);
    expect(messageCountByDay.messageCountFailed).toBe(5);
  });

  it('should handle nullable paraId field', () => {
    const messageCountByDay = new MessageCountByDay();
    messageCountByDay.ecosystem = '';
    messageCountByDay.parachain = undefined;
    messageCountByDay.date = '2024-10-02';
    messageCountByDay.messageCount = 20;
    messageCountByDay.messageCountSuccess = 18;
    messageCountByDay.messageCountFailed = 2;

    expect(messageCountByDay.ecosystem).toBe('');
    expect(messageCountByDay.parachain).toBeUndefined();
    expect(messageCountByDay.date).toBe('2024-10-02');
    expect(messageCountByDay.messageCount).toBe(20);
    expect(messageCountByDay.messageCountSuccess).toBe(18);
    expect(messageCountByDay.messageCountFailed).toBe(2);
  });

  it('should handle edge cases for counts', () => {
    const messageCountByDay = new MessageCountByDay();
    messageCountByDay.ecosystem = '';
    messageCountByDay.parachain = '';
    messageCountByDay.date = '2024-10-02';
    messageCountByDay.messageCount = 0;
    messageCountByDay.messageCountSuccess = 0;
    messageCountByDay.messageCountFailed = 0;

    expect(messageCountByDay.ecosystem).toBe('');
    expect(messageCountByDay.parachain).toBe('');
    expect(messageCountByDay.date).toBe('2024-10-02');
    expect(messageCountByDay.messageCount).toBe(0);
    expect(messageCountByDay.messageCountSuccess).toBe(0);
    expect(messageCountByDay.messageCountFailed).toBe(0);
  });
});

describe('MessageCountByStatus', () => {
  it('should create a MessageCountByStatus object with the correct fields', () => {
    const messageCountByStatus = new MessageCountByStatus();
    messageCountByStatus.ecosystem = 'polkadot';
    messageCountByStatus.parachain = 'AssetHubPolkadot';
    messageCountByStatus.success = 30;
    messageCountByStatus.failed = 5;

    expect(messageCountByStatus.ecosystem).toBe('polkadot');
    expect(messageCountByStatus.parachain).toBe('AssetHubPolkadot');
    expect(messageCountByStatus.success).toBe(30);
    expect(messageCountByStatus.failed).toBe(5);
  });

  it('should handle nullable paraId field', () => {
    const messageCountByStatus = new MessageCountByStatus();
    messageCountByStatus.ecosystem = '';
    messageCountByStatus.parachain = undefined;
    messageCountByStatus.success = 20;
    messageCountByStatus.failed = 10;

    expect(messageCountByStatus.ecosystem).toBe('');
    expect(messageCountByStatus.parachain).toBeUndefined();
    expect(messageCountByStatus.success).toBe(20);
    expect(messageCountByStatus.failed).toBe(10);
  });

  it('should handle edge cases for success and failed fields', () => {
    const messageCountByStatus = new MessageCountByStatus();
    messageCountByStatus.ecosystem = '';
    messageCountByStatus.parachain = undefined;
    messageCountByStatus.success = 0;
    messageCountByStatus.failed = 0;

    expect(messageCountByStatus.ecosystem).toBe('');
    expect(messageCountByStatus.parachain).toBeUndefined();
    expect(messageCountByStatus.success).toBe(0);
    expect(messageCountByStatus.failed).toBe(0);
  });
});

describe('MessageCount', () => {
  it('should create a MessageCount object with the correct fields', () => {
    const messageCount = new MessageCount();
    messageCount.ecosystem = 'polkadot';
    messageCount.paraId = 1000;
    messageCount.totalCount = 500;

    expect(messageCount.ecosystem).toBe('polkadot');
    expect(messageCount.paraId).toBe(1000);
    expect(messageCount.totalCount).toBe(500);
  });

  it('should handle edge cases for fields', () => {
    const messageCount = new MessageCount();
    messageCount.ecosystem = '';
    messageCount.paraId = 0;
    messageCount.totalCount = 0;

    expect(messageCount.ecosystem).toBe('');
    expect(messageCount.paraId).toBe(0);
    expect(messageCount.totalCount).toBe(0);
  });
});
