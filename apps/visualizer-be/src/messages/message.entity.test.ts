import { ID } from '@nestjs/graphql';
import { describe, expect, it } from 'vitest';

import {
  Asset,
  Message,
  returnAssetArray,
  returnID,
} from './message.entity.js';

describe('Message Entity', () => {
  it('should create a Message entity with the correct fields', () => {
    const assets: Asset[] = [
      {
        enum_key: 'key',
        asset_module: 'module',
        amount: '1000',
        decimals: 6,
        symbol: 'TOKEN',
      },
    ];

    const message = new Message();
    message.message_hash = 'hash';
    message.ecosystem = 'polkadot';
    message.origin_event_index = 'event_1';
    message.from_account_id = 'account_1';
    message.origin_para_id = 1000;
    message.origin_block_timestamp = Date.now();
    message.relayed_block_timestamp = Date.now();
    message.block_num = 1;
    message.status = 'pending';
    message.relayed_event_index = 'event_2';
    message.dest_event_index = 'event_3';
    message.dest_para_id = 2000;
    message.to_account_id = 'account_2';
    message.confirm_block_timestamp = Date.now();
    message.extrinsic_index = 'extrinsic_1';
    message.relayed_extrinsic_index = 'extrinsic_2';
    message.dest_extrinsic_index = 'extrinsic_3';
    message.child_para_id = 3000;
    message.child_dest = 'child_dest';
    message.protocol = 'protocol_1';
    message.message_type = 'type_1';
    message.unique_id = 'unique_1';
    message.xcm_version = 2;
    message.assets = assets;

    expect(message.message_hash).toBe('hash');
    expect(message.ecosystem).toBe('polkadot');
    expect(message.assets[0].symbol).toBe('TOKEN');
    expect(message.xcm_version).toBe(2);
    expect(returnID()).toBe(ID);
    expect(returnAssetArray()).toStrictEqual([Asset]);
  });
});
