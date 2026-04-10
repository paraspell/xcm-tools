import { INestApplication } from '@nestjs/common';
import { Builder, TChain } from '@paraspell/sdk';
import { toHex } from 'polkadot-api/utils';
import request from 'supertest';
import { afterAll, beforeAll, describe, it } from 'vitest';

import { createTestApp } from './helpers/app';
import { MOCK_CHAIN, RECIPIENT, UNKNOWN_CHAIN } from './helpers/fixtures';

describe('Asset claim controller (e2e)', () => {
  let app: INestApplication;
  const address = RECIPIENT;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Generate asset claim call - no from provided - /asset-claim', () => {
    return request(app.getHttpServer())
      .post('/asset-claim')
      .send({
        address,
      })
      .expect(400);
  });

  it('Generate asset claim call - invalid from provided - /asset-claim', () => {
    return request(app.getHttpServer())
      .post('/asset-claim')
      .send({
        from: UNKNOWN_CHAIN,
        address,
      })
      .expect(400);
  });

  it('Generate asset claim call - invalid wallet address - /asset-claim', () => {
    return request(app.getHttpServer())
      .post('/asset-claim')
      .send({
        from: MOCK_CHAIN,
        address: 'InvalidWalletAddress',
      })
      .expect(400);
  });

  it('Generate asset claim call - all valid - /asset-claim', async () => {
    const from: TChain = 'AssetHubKusama';
    const currency = [
      {
        id: {
          parents: 0,
          interior: {
            X1: {
              Parachain: 2000,
            },
          },
        },
        fun: {
          Fungible: '1000000000',
        },
      },
    ];
    const tx = await Builder()
      .claimFrom(from)
      .currency(currency)
      .address(address)
      .build();
    return request(app.getHttpServer())
      .post('/asset-claim')
      .send({
        from,
        currency,
        address,
      })
      .expect(201)
      .expect(toHex(await tx.getEncodedData()));
  });
});
