import { INestApplication } from '@nestjs/common';
import {
  CHAINS,
  getAllAssetsSymbols,
  getAssetsObject,
  getFeeAssets,
  getNativeAssets,
  getOtherAssets,
  getParaId,
  getRelayChainSymbol,
  Native,
} from '@paraspell/sdk';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp } from './helpers/app';
import {
  BALANCE_ADDRESS,
  MOCK_CHAIN,
  UNKNOWN_CHAIN,
  UNKNOWN_SYMBOL,
} from './helpers/fixtures';

describe('Assets controller (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  CHAINS.forEach((chain) => {
    const assetsObjectUrl = `/assets/${chain}`;
    it(`Get assets object - ${assetsObjectUrl} (GET)`, () => {
      const assetsObject = getAssetsObject(chain);
      return request(app.getHttpServer())
        .get(assetsObjectUrl)
        .expect(200)
        .expect(assetsObject);
    });

    const relayChainSymbolUrl = `/assets/${chain}/relay-chain-symbol`;
    it(`Get relaychain symbol - ${relayChainSymbolUrl} (GET)`, () => {
      const relayChainSymbol = getRelayChainSymbol(chain);
      return request(app.getHttpServer())
        .get(relayChainSymbolUrl)
        .expect(200)
        .expect(JSON.stringify(relayChainSymbol));
    });

    const nativeAssetsUrl = `/assets/${chain}/native`;
    it(`Get native assets - ${nativeAssetsUrl} (GET)`, () => {
      const nativeAssets = getNativeAssets(chain);
      return request(app.getHttpServer())
        .get(nativeAssetsUrl)
        .expect(200)
        .expect(nativeAssets);
    });

    const otherAssetsUrl = `/assets/${chain}/other`;
    it(`Get other assets - ${otherAssetsUrl} (GET)`, () => {
      const otherAssets = getOtherAssets(chain);
      return request(app.getHttpServer())
        .get(otherAssetsUrl)
        .expect(200)
        .expect(otherAssets);
    });

    const allAssetsSymbolsUrl = `/assets/${chain}/all-symbols`;
    it(`Get all assets symbols - ${allAssetsSymbolsUrl} (GET)`, () => {
      const symbols = getAllAssetsSymbols(chain);
      return request(app.getHttpServer())
        .get(allAssetsSymbolsUrl)
        .expect(200)
        .expect(symbols);
    });

    const parachainIdUrl = `/chains/${chain}/para-id`;
    it(`Get parachain id - ${parachainIdUrl} (GET)`, () => {
      const paraId = getParaId(chain);
      return request(app.getHttpServer())
        .get(parachainIdUrl)
        .expect(200)
        .expect((res) => expect(Number(res.text)).toEqual(paraId));
    });
  });

  const assetsObjectUnknownChainUrl = `/assets/${UNKNOWN_CHAIN}`;
  it(`Get assets object - ${assetsObjectUnknownChainUrl} (GET)`, () => {
    return request(app.getHttpServer())
      .get(assetsObjectUnknownChainUrl)
      .expect(400);
  });

  it(`Get asset location`, () =>
    request(app.getHttpServer())
      .post(`/assets/AssetHubPolkadot/location`)
      .send({
        currency: {
          symbol: 'BILL',
        },
      })
      .expect(201));

  it('Get asset reserve chain - /assets/:chain/reserve-chain (POST)', () => {
    return request(app.getHttpServer())
      .post('/assets/AssetHubPolkadot/reserve-chain')
      .send({
        currency: { symbol: 'BILL' },
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toBeDefined();
      });
  });

  it('Get asset info - /assets/:chain/asset-info (POST)', () => {
    return request(app.getHttpServer())
      .post('/assets/AssetHubPolkadot/asset-info')
      .send({
        currency: { symbol: 'BILL' },
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toBeDefined();
      });
  });

  it('Get supported destinations - /assets/:chain/supported-destinations (POST)', () => {
    return request(app.getHttpServer())
      .post('/assets/AssetHubPolkadot/supported-destinations')
      .send({
        currency: { symbol: 'BILL' },
      })
      .expect(201)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it('Get asset reserve chain - missing currency body - /assets/:chain/reserve-chain (POST)', () => {
    return request(app.getHttpServer())
      .post('/assets/AssetHubPolkadot/reserve-chain')
      .send({})
      .expect(400);
  });

  it('Get asset reserve chain - unknown chain - /assets/:chain/reserve-chain (POST)', () => {
    return request(app.getHttpServer())
      .post(`/assets/${UNKNOWN_CHAIN}/reserve-chain`)
      .send({ currency: { symbol: 'BILL' } })
      .expect(400);
  });

  it('Get asset reserve chain - unknown currency - /assets/:chain/reserve-chain (POST)', () => {
    return request(app.getHttpServer())
      .post('/assets/AssetHubPolkadot/reserve-chain')
      .send({ currency: { symbol: UNKNOWN_SYMBOL } })
      .expect(400);
  });

  it('Get asset info - missing currency body - /assets/:chain/asset-info (POST)', () => {
    return request(app.getHttpServer())
      .post('/assets/AssetHubPolkadot/asset-info')
      .send({})
      .expect(400);
  });

  it('Get asset info - invalid destination enum - /assets/:chain/asset-info (POST)', () => {
    return request(app.getHttpServer())
      .post('/assets/AssetHubPolkadot/asset-info')
      .send({
        currency: { symbol: 'BILL' },
        destination: 'NotARealChain',
      })
      .expect(400);
  });

  it('Get asset info - unknown chain - /assets/:chain/asset-info (POST)', () => {
    return request(app.getHttpServer())
      .post(`/assets/${UNKNOWN_CHAIN}/asset-info`)
      .send({ currency: { symbol: 'BILL' } })
      .expect(400);
  });

  it('Get supported destinations - missing currency body - /assets/:chain/supported-destinations (POST)', () => {
    return request(app.getHttpServer())
      .post('/assets/AssetHubPolkadot/supported-destinations')
      .send({})
      .expect(400);
  });

  it('Get supported destinations - unknown chain - /assets/:chain/supported-destinations (POST)', () => {
    return request(app.getHttpServer())
      .post(`/assets/${UNKNOWN_CHAIN}/supported-destinations`)
      .send({ currency: { symbol: 'BILL' } })
      .expect(400);
  });

  it('Get supported destinations - unknown currency - /assets/:chain/supported-destinations (POST)', () => {
    return request(app.getHttpServer())
      .post('/assets/AssetHubPolkadot/supported-destinations')
      .send({ currency: { symbol: UNKNOWN_SYMBOL } })
      .expect(400);
  });

  const relayChainSymbolUnknownChainUrl = `/assets/${UNKNOWN_CHAIN}/relay-chain-symbol`;
  it(`Get relaychain symbol - ${relayChainSymbolUnknownChainUrl} (GET)`, () => {
    return request(app.getHttpServer())
      .get(relayChainSymbolUnknownChainUrl)
      .expect(400);
  });

  const feeAssetsUrl = `/assets/${MOCK_CHAIN}/fee-assets`;
  it(`Get fee assets - ${feeAssetsUrl} (GET)`, () => {
    const feeAssets = getFeeAssets(MOCK_CHAIN);
    return request(app.getHttpServer())
      .get(feeAssetsUrl)
      .expect(200)
      .expect(feeAssets);
  });

  it(`Get fee assets - unknown chain - /assets/${UNKNOWN_CHAIN}/fee-assets (GET)`, () => {
    return request(app.getHttpServer())
      .get(`/assets/${UNKNOWN_CHAIN}/fee-assets`)
      .expect(400);
  });

  const parachainIdUnknownChainUrl = `/chains/${UNKNOWN_CHAIN}/para-id `;
  it(`Get parachain id - ${parachainIdUnknownChainUrl} (GET)`, () => {
    return request(app.getHttpServer())
      .get(parachainIdUnknownChainUrl)
      .expect(400);
  });

  it('should get native balance successfully', async () => {
    const validRequest = {
      address: BALANCE_ADDRESS,
    };

    return request(app.getHttpServer())
      .post('/balance/Acala')
      .send(validRequest)
      .expect(201)
      .expect((res) => {
        expect(res.body).toBeDefined();
      });
  });

  it('should return 400 for balance request when chain path is invalid', async () => {
    return request(app.getHttpServer())
      .post('/balance/Chain123')
      .send({
        address: BALANCE_ADDRESS,
      })
      .expect(400);
  });

  it('should return 400 for balance request when address is missing on valid chain', async () => {
    return request(app.getHttpServer())
      .post('/balance/Acala')
      .send({})
      .expect(400);
  });

  it('should get foreign balance successfully', async () => {
    const validRequest = {
      address: BALANCE_ADDRESS,
      currency: {
        symbol: 'UNQ',
      },
    };

    return request(app.getHttpServer())
      .post('/balance/Acala')
      .send(validRequest)
      .expect(201)
      .expect((res) => {
        expect(res.body).toBeDefined();
      });
  });

  it('should return 400 for balance request when currency is unknown on valid chain', async () => {
    return request(app.getHttpServer())
      .post('/balance/Acala')
      .send({
        address: BALANCE_ADDRESS,
        currency: {
          symbol: UNKNOWN_SYMBOL,
        },
      })
      .expect(400);
  });

  it('should get existential deposit successfully', async () => {
    const validRequest = {
      currency: {
        symbol: Native('DOT'),
      },
    };

    return request(app.getHttpServer())
      .post('/balance/AssetHubPolkadot/existential-deposit')
      .send(validRequest)
      .expect(201)
      .expect((res) => {
        expect(res.body).toBeDefined();
      });
  });

  it('should return 400 for existential deposit - ambiguous plain DOT symbol - /balance/:chain/existential-deposit', () => {
    return request(app.getHttpServer())
      .post('/balance/AssetHubPolkadot/existential-deposit')
      .send({
        currency: { symbol: 'DOT' },
      })
      .expect(400)
      .expect((res) => {
        expect(String(res.body.message)).toContain(
          'Multiple matches found for symbol DOT',
        );
      });
  });

  it('should return 400 for existential deposit - unknown chain - /balance/:chain/existential-deposit', () => {
    return request(app.getHttpServer())
      .post(`/balance/${UNKNOWN_CHAIN}/existential-deposit`)
      .send({
        currency: { symbol: Native('DOT') },
      })
      .expect(400);
  });

  it('should return 400 for existential deposit - unknown currency - /balance/:chain/existential-deposit', () => {
    return request(app.getHttpServer())
      .post('/balance/AssetHubPolkadot/existential-deposit')
      .send({
        currency: { symbol: UNKNOWN_SYMBOL },
      })
      .expect(400);
  });

  it('should return supported assets', () => {
    return request(app.getHttpServer())
      .get('/supported-assets/?origin=Acala&destination=Astar')
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeDefined();
      });
  });

  it('should return 400 for supported assets - unknown origin in query - /supported-assets', () => {
    return request(app.getHttpServer())
      .get('/supported-assets')
      .query({ origin: UNKNOWN_CHAIN, destination: 'Astar' })
      .expect(400);
  });

  it('should return 400 for supported assets - unknown destination in query - /supported-assets', () => {
    return request(app.getHttpServer())
      .get('/supported-assets')
      .query({ origin: 'Acala', destination: UNKNOWN_CHAIN })
      .expect(400);
  });
});
