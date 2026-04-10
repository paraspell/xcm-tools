import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, it } from 'vitest';

import { XTransferDto } from '../src/x-transfer/dto/XTransferDto';
import { createTestApp } from './helpers/app';
import { SENDER, UNKNOWN_CHAIN } from './helpers/fixtures';

describe('Transfer info controller (e2e)', () => {
  let app: INestApplication;

  const transferInfo: XTransferDto = {
    from: 'Hydration',
    to: 'AssetHubPolkadot',
    sender: SENDER,
    recipient: SENDER,
    currency: { symbol: 'DOT', amount: '100' },
  };

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Generate transfer info call - invalid origin provided - /transfer-info', () => {
    return request(app.getHttpServer())
      .post('/transfer-info')
      .send({
        ...transferInfo,
        from: UNKNOWN_CHAIN,
      })
      .expect(400);
  });

  it('Generate transfer info call - invalid destination provided - /transfer-info', () => {
    return request(app.getHttpServer())
      .post('/transfer-info')
      .send({
        ...transferInfo,
        to: UNKNOWN_CHAIN,
      })
      .expect(400);
  });

  it('Generate transfer info call - invalid wallet address destination - /transfer-info', () => {
    return request(app.getHttpServer())
      .post('/transfer-info')
      .send({
        ...transferInfo,
        recipient: 'InvalidWalletAddress',
      })
      .expect(400);
  });

  it('Generate transfer info call - all valid - /transfer-info', async () => {
    return request(app.getHttpServer())
      .post('/transfer-info')
      .send(transferInfo)
      .expect(201);
  });

  it('Generate min transferable amount call - invalid origin provided - /min-transferable-amount', () => {
    return request(app.getHttpServer())
      .post('/min-transferable-amount')
      .send({
        ...transferInfo,
        from: UNKNOWN_CHAIN,
      })
      .expect(400);
  });

  it('Generate min transferable amount call - invalid destination provided - /min-transferable-amount', () => {
    return request(app.getHttpServer())
      .post('/min-transferable-amount')
      .send({
        ...transferInfo,
        to: UNKNOWN_CHAIN,
      })
      .expect(400);
  });

  it('Generate min transferable amount call - invalid wallet address destination - /min-transferable-amount', () => {
    return request(app.getHttpServer())
      .post('/min-transferable-amount')
      .send({
        ...transferInfo,
        recipient: 'InvalidWalletAddress',
      })
      .expect(400);
  });

  it('Generate min transferable amount call - all valid - /min-transferable-amount', async () => {
    return request(app.getHttpServer())
      .post('/min-transferable-amount')
      .send(transferInfo)
      .expect(201);
  });

  it('Generate receivable amount call - invalid origin provided - /receivable-amount', () => {
    return request(app.getHttpServer())
      .post('/receivable-amount')
      .send({
        ...transferInfo,
        from: UNKNOWN_CHAIN,
      })
      .expect(400);
  });

  it('Generate receivable amount call - invalid destination provided - /receivable-amount', () => {
    return request(app.getHttpServer())
      .post('/receivable-amount')
      .send({
        ...transferInfo,
        to: UNKNOWN_CHAIN,
      })
      .expect(400);
  });

  it('Generate receivable amount call - invalid wallet address destination - /receivable-amount', () => {
    return request(app.getHttpServer())
      .post('/receivable-amount')
      .send({
        ...transferInfo,
        recipient: 'InvalidWalletAddress',
      })
      .expect(400);
  });

  it('Generate receivable amount call - all valid - /receivable-amount', async () => {
    return request(app.getHttpServer())
      .post('/receivable-amount')
      .send(transferInfo)
      .expect(201);
  });
});
