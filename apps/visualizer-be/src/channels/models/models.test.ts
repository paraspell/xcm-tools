import { describe, expect, it } from 'vitest';

import { Channel } from './channel.model.js';

describe('Channel', () => {
  it('should create a Channel object with the correct fields', () => {
    const channel = new Channel();
    channel.id = 1;
    channel.ecosystem = 'polkadot';
    channel.sender = 100;
    channel.recipient = 200;
    channel.transfer_count = 5;
    channel.message_count = 10;
    channel.active_at = 1234567890;
    channel.status = 'accepted';

    expect(channel.id).toBe(1);
    expect(channel.ecosystem).toBe('polkadot');
    expect(channel.sender).toBe(100);
    expect(channel.recipient).toBe(200);
    expect(channel.transfer_count).toBe(5);
    expect(channel.message_count).toBe(10);
    expect(channel.active_at).toBe(1234567890);
    expect(channel.status).toBe('accepted');
  });

  it('should handle undefined nullable fields', () => {
    const channel = new Channel();
    channel.id = 2;
    channel.ecosystem = 'kusama';
    channel.sender = 101;
    channel.recipient = 201;
    channel.transfer_count = undefined;
    channel.message_count = undefined;
    channel.active_at = undefined;
    channel.status = undefined;

    expect(channel.id).toBe(2);
    expect(channel.ecosystem).toBe('kusama');
    expect(channel.sender).toBe(101);
    expect(channel.recipient).toBe(201);
    expect(channel.transfer_count).toBeUndefined();
    expect(channel.message_count).toBeUndefined();
    expect(channel.active_at).toBeUndefined();
    expect(channel.status).toBeUndefined();
  });

  it('should handle edge cases like 0 and empty strings', () => {
    const channel = new Channel();
    channel.id = 0;
    channel.ecosystem = '';
    channel.sender = 0;
    channel.recipient = 0;
    channel.transfer_count = 0;
    channel.message_count = 0;
    channel.active_at = 0;
    channel.status = '';

    expect(channel.id).toBe(0);
    expect(channel.ecosystem).toBe('');
    expect(channel.sender).toBe(0);
    expect(channel.recipient).toBe(0);
    expect(channel.transfer_count).toBe(0);
    expect(channel.message_count).toBe(0);
    expect(channel.active_at).toBe(0);
    expect(channel.status).toBe('');
  });
});
