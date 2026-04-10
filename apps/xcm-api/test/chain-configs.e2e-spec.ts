import { INestApplication } from '@nestjs/common';
import {
  CHAINS,
  getParaId,
  getTChain,
  hasDryRunSupport,
  SUBSTRATE_CHAINS,
} from '@paraspell/sdk';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp } from './helpers/app';
import { SENDER, UNKNOWN_CHAIN } from './helpers/fixtures';

describe('Chain configs controller (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  const chainNamesUrl = '/chains';
  it(`Get chain names - ${chainNamesUrl} (GET)`, () => {
    return request(app.getHttpServer())
      .get(chainNamesUrl)
      .expect(200)
      .expect(CHAINS);
  });

  SUBSTRATE_CHAINS.filter(
    // These chains do not have ws endpoints
    (chain) => chain !== 'Peaq',
  ).forEach((chain) => {
    it(`should return ws endpoints for all chains - ${chain}`, async () => {
      return request(app.getHttpServer())
        .get(`/chains/${chain}/ws-endpoints`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined();
        });
    });
  });

  SUBSTRATE_CHAINS.forEach((chain) => {
    it(`Get has dry-run support - /chains/${chain}/has-dry-run-support (GET)`, () => {
      return request(app.getHttpServer())
        .get(`/chains/${chain}/has-dry-run-support`)
        .expect(200)
        .expect(JSON.stringify(hasDryRunSupport(chain)));
    });
  });

  it('Get has dry-run support - unknown chain - /chains/:chain/has-dry-run-support (GET)', () => {
    return request(app.getHttpServer())
      .get(`/chains/${UNKNOWN_CHAIN}/has-dry-run-support`)
      .expect(400);
  });

  it('Get chain by para id - /chains/:paraId?ecosystem=polkadot (GET)', () => {
    const paraId = getParaId('Acala');
    const chain = getTChain(paraId, 'Polkadot');
    return request(app.getHttpServer())
      .get(`/chains/${paraId}`)
      .query({ ecosystem: 'Polkadot' })
      .expect(200)
      .expect(JSON.stringify(chain));
  });

  it('Get chain by para id - invalid ecosystem - /chains/:paraId?ecosystem=invalid (GET)', () => {
    const paraId = getParaId('Acala');
    return request(app.getHttpServer())
      .get(`/chains/${paraId}`)
      .query({ ecosystem: 'invalid' })
      .expect(400);
  });

  it('Get convert ss58 - /convert-ss58 (GET)', () => {
    return request(app.getHttpServer())
      .get('/convert-ss58')
      .query({
        address: SENDER,
        chain: 'Acala',
      })
      .expect(200)
      .expect((res) => {
        expect(typeof res.text).toBe('string');
        expect(res.text.length).toBeGreaterThan(0);
      });
  });

  it('Get convert ss58 - invalid chain - /convert-ss58 (GET)', () => {
    return request(app.getHttpServer())
      .get('/convert-ss58')
      .query({
        address: SENDER,
        chain: UNKNOWN_CHAIN,
      })
      .expect(400);
  });

  it('Get convert ss58 - missing query params - /convert-ss58 (GET)', () => {
    return request(app.getHttpServer()).get('/convert-ss58').expect(400);
  });
});
