import { INestApplication } from '@nestjs/common';
import {
  getDefaultPallet,
  getNativeAssetsPallet,
  getOtherAssetsPallets,
  getPalletIndex,
  getSupportedPallets,
  SUBSTRATE_CHAINS,
} from '@paraspell/sdk';
import request from 'supertest';
import { afterAll, beforeAll, describe, it } from 'vitest';

import { createTestApp } from './helpers/app';
import { MOCK_CHAIN, UNKNOWN_CHAIN } from './helpers/fixtures';

describe('Pallets controller (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  SUBSTRATE_CHAINS.forEach((chain) => {
    const supportedPalletsUrl = `/pallets/${chain}`;
    it(`Supported pallets - ${supportedPalletsUrl} (GET)`, () => {
      const pallets = getSupportedPallets(chain);
      return request(app.getHttpServer())
        .get(supportedPalletsUrl)
        .expect(200)
        .expect(pallets);
    });

    const defaultPalletUrl = `/pallets/${chain}/default`;
    it(`Default pallet - ${defaultPalletUrl} (GET)`, () => {
      const pallet = getDefaultPallet(chain);
      return request(app.getHttpServer())
        .get(defaultPalletUrl)
        .expect(200)
        .expect(JSON.stringify(pallet));
    });

    const nativeAssetsPalletUrl = `/pallets/${chain}/native-assets`;
    it(`Native assets pallet - ${nativeAssetsPalletUrl} (GET)`, () => {
      const pallet = getNativeAssetsPallet(chain);
      return request(app.getHttpServer())
        .get(nativeAssetsPalletUrl)
        .expect(200)
        .expect(JSON.stringify(pallet));
    });

    const otherAssetsPalletsUrl = `/pallets/${chain}/other-assets`;
    it(`Other assets pallets - ${otherAssetsPalletsUrl} (GET)`, () => {
      const pallets = getOtherAssetsPallets(chain);
      return request(app.getHttpServer())
        .get(otherAssetsPalletsUrl)
        .expect(200)
        .expect(pallets);
    });
  });

  const supportedPalletsUnknownChainUrl = `/pallets/${UNKNOWN_CHAIN}`;
  it(`Supported pallets - ${supportedPalletsUnknownChainUrl} (GET)`, () => {
    return request(app.getHttpServer())
      .get(supportedPalletsUnknownChainUrl)
      .expect(400);
  });

  const defaultPalletUnknownChainUrl = `/pallets/${UNKNOWN_CHAIN}/default`;
  it(`Default pallet - ${defaultPalletUnknownChainUrl} (GET)`, () => {
    return request(app.getHttpServer())
      .get(defaultPalletUnknownChainUrl)
      .expect(400);
  });

  const validPalletForMockChain = getSupportedPallets(MOCK_CHAIN)[0];
  const palletIndexUrl = `/pallets/${MOCK_CHAIN}/index`;
  it(`Pallet index - ${palletIndexUrl}?pallet=${validPalletForMockChain} (GET)`, () => {
    const palletIndex = getPalletIndex(MOCK_CHAIN, validPalletForMockChain);
    return request(app.getHttpServer())
      .get(palletIndexUrl)
      .query({ pallet: validPalletForMockChain })
      .expect(200)
      .expect(JSON.stringify(palletIndex));
  });

  it(`Pallet index invalid pallet - ${palletIndexUrl} (GET)`, () => {
    return request(app.getHttpServer())
      .get(palletIndexUrl)
      .query({ pallet: 'InvalidPallet' })
      .expect(400);
  });
});
