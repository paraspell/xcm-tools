import { Channel } from './channel.entity';

describe('Channel Entity', () => {
  it('should create a Channel entity with the correct fields', () => {
    const channel = new Channel();
    channel.id = 1;
    channel.sender = 101;
    channel.recipient = 202;
    channel.status = 'active';
    channel.transfer_count = 5;
    channel.message_count = 15;
    channel.active_at = Date.now();
    channel.proposed_max_capacity = 1000;
    channel.proposed_max_message_size = 256;

    expect(channel.id).toBe(1);
    expect(channel.sender).toBe(101);
    expect(channel.recipient).toBe(202);
    expect(channel.status).toBe('active');
    expect(channel.transfer_count).toBe(5);
    expect(channel.message_count).toBe(15);
    expect(channel.active_at).toBeGreaterThan(0);
    expect(channel.proposed_max_capacity).toBe(1000);
    expect(channel.proposed_max_message_size).toBe(256);
  });

  it('should handle nullable or optional fields correctly', () => {
    const channel = new Channel();
    channel.id = 2;
    channel.sender = 103;
    channel.recipient = 204;
    channel.status = 'pending';
    channel.transfer_count = 0;
    channel.message_count = 0;
    channel.active_at = 0;
    channel.proposed_max_capacity = 500;
    channel.proposed_max_message_size = 128;

    expect(channel.id).toBe(2);
    expect(channel.sender).toBe(103);
    expect(channel.recipient).toBe(204);
    expect(channel.status).toBe('pending');
    expect(channel.transfer_count).toBe(0);
    expect(channel.message_count).toBe(0);
    expect(channel.active_at).toBe(0);
    expect(channel.proposed_max_capacity).toBe(500);
    expect(channel.proposed_max_message_size).toBe(128);
  });
});
