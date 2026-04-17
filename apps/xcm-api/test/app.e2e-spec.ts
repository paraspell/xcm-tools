import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import {
  BatchMode,
  Builder,
  Foreign,
  Native,
  Override,
  TCurrencyInputWithAmount,
  TAsset,
  TLocation,
  TChain,
  Version,
  getAllAssetsSymbols,
  getFeeAssets,
  getAssetsObject,
  getDefaultPallet,
  getNativeAssetsPallet,
  getNativeAssets,
  getOtherAssetsPallets,
  getOtherAssets,
  getParaId,
  getPalletIndex,
  getChainProviders,
  getRelayChainSymbol,
  getSupportedPallets,
  getTChain,
  hasDryRunSupport,
  hasSupportForAsset,
  replaceBigInt,
  SUBSTRATE_CHAINS,
  CHAINS,
  TSwapOptions,
} from '@paraspell/sdk';
import { describe, beforeAll, it, expect } from 'vitest';
import { ExpressAdapter } from '@nestjs/platform-express';
import { XTransferDto } from '../src/x-transfer/dto/XTransferDto';

describe('XCM API (e2e)', () => {
  let app: INestApplication;
  const mockChain: TChain = 'Basilisk';
  const mockSymbol = 'DOT';
  const unknownChain = 'UnknownChain';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    (app.getHttpAdapter().getInstance() as ExpressAdapter).set(
      'json replacer',
      replaceBigInt,
    );
    await app.init();
  });

  describe('Pallets controller', () => {
    SUBSTRATE_CHAINS.forEach((chain) => {
      const supoortedPalletsUrl = `/pallets/${chain}`;
      it(`Supported pallets - ${supoortedPalletsUrl} (GET)`, () => {
        const pallets = getSupportedPallets(chain);
        return request(app.getHttpServer())
          .get(supoortedPalletsUrl)
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

    const supportedPalletsUnknownChainUrl = `/pallets/${unknownChain}`;
    it(`Supported pallets - ${supportedPalletsUnknownChainUrl} (GET)`, () => {
      return request(app.getHttpServer())
        .get(supportedPalletsUnknownChainUrl)
        .expect(400);
    });

    const defaultPalletUnknownChainUrl = `/pallets/${unknownChain}/default`;
    it(`Default pallet - ${defaultPalletUnknownChainUrl} (GET)`, () => {
      return request(app.getHttpServer())
        .get(defaultPalletUnknownChainUrl)
        .expect(400);
    });

    const validPalletForMockChain = getSupportedPallets(mockChain)[0];
    const palletIndexUrl = `/pallets/${mockChain}/index`;
    it(`Pallet index - ${palletIndexUrl}?pallet=${validPalletForMockChain} (GET)`, () => {
      const palletIndex = getPalletIndex(mockChain, validPalletForMockChain);
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

  describe('Chain configs controller', () => {
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
        .get(`/chains/${unknownChain}/has-dry-run-support`)
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
  });

  describe('Assets controller', () => {
    const unknownSymbol = 'UnknownSymbol';

    CHAINS.forEach((chain) => {
      const assetsObjectUrl = `/assets/${chain}`;
      it(`Get assets object - ${assetsObjectUrl} (GET)`, () => {
        const assetsObject = getAssetsObject(chain);
        return request(app.getHttpServer())
          .get(assetsObjectUrl)
          .expect(200)
          .expect(assetsObject);
      });

      const otherAssets = getOtherAssets(chain);
      if (otherAssets.length > 1) {
        const { symbol, decimals } =
          otherAssets[0].assetId !== undefined
            ? otherAssets[0]
            : otherAssets[1];

        if (symbol) {
          const assetDecimalsUrl = `/assets/${chain}/decimals`;
          it(`Get asset decimals - ${assetDecimalsUrl} symbol=${symbol} (GET)`, () => {
            return request(app.getHttpServer())
              .get(assetDecimalsUrl)
              .query({ symbol })
              .expect(200)
              .expect((res) => expect(Number(res.text)).toEqual(decimals));
          });
        }
      }

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

    const assetsObjectUknownChainUrl = `/assets/${unknownChain}`;
    it(`Get assets object - ${assetsObjectUknownChainUrl} (GET)`, () => {
      return request(app.getHttpServer())
        .get(assetsObjectUknownChainUrl)
        .expect(400);
    });

    const assetIdUknownChainUrl = `/assets/${unknownChain}/id`;
    it(`Get asset id - ${assetIdUknownChainUrl} (GET)`, () => {
      return request(app.getHttpServer())
        .get(assetIdUknownChainUrl)
        .query({ symbol: mockSymbol })
        .expect(400);
    });

    const assetIdUnknownSymbolUrl = `/assets/${mockChain}/id`;
    it(`Get asset id - non existent symbol - ${assetIdUnknownSymbolUrl} (GET)`, () => {
      return request(app.getHttpServer())
        .get(assetIdUnknownSymbolUrl)
        .query({ symbol: unknownSymbol })
        .expect(404);
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

    const relayChainSymbolUknownChainUrl = `/assets/${unknownChain}/relay-chain-symbol`;
    it(`Get relaychain symbol - ${relayChainSymbolUknownChainUrl} (GET)`, () => {
      return request(app.getHttpServer())
        .get(relayChainSymbolUknownChainUrl)
        .expect(400);
    });

    const assetDecimalsUknownChainUrl = `/assets/${unknownChain}/decimals`;
    it(`Get asset decimals - ${assetDecimalsUknownChainUrl} (GET)`, () => {
      return request(app.getHttpServer())
        .get(assetDecimalsUknownChainUrl)
        .query({ symbol: mockSymbol })
        .expect(400);
    });

    const assetDecimalsUnknownSymbolUrl = `/assets/${mockChain}/decimals`;
    it(`Get asset decimals - non existent symbol - ${assetDecimalsUnknownSymbolUrl} (GET)`, () => {
      return request(app.getHttpServer())
        .get(assetDecimalsUnknownSymbolUrl)
        .query({ symbol: 'UknownSymbol' })
        .expect(404);
    });

    const hasSupportUnknownChainUrl = `/assets/${unknownChain}/has-support`;
    it(`Has support for asset - ${hasSupportUnknownChainUrl} (GET)`, () => {
      return request(app.getHttpServer())
        .get(hasSupportUnknownChainUrl)
        .query({ symbol: mockSymbol })
        .expect(400);
    });

    const hasSupportUrl = `/assets/${mockChain}/has-support`;
    it(`Has support for asset - ${hasSupportUrl} (GET)`, () => {
      const hasSupport = hasSupportForAsset(mockChain, mockSymbol);
      return request(app.getHttpServer())
        .get(hasSupportUrl)
        .query({ symbol: mockSymbol })
        .expect(200)
        .expect(JSON.stringify(hasSupport));
    });

    const feeAssetsUrl = `/assets/${mockChain}/fee-assets`;
    it(`Get fee assets - ${feeAssetsUrl} (GET)`, () => {
      const feeAssets = getFeeAssets(mockChain);
      return request(app.getHttpServer())
        .get(feeAssetsUrl)
        .expect(200)
        .expect(feeAssets);
    });

    const parachainIdUnknownChainUrl = `/chains/${unknownChain}/para-id `;
    it(`Get parachain id - ${parachainIdUnknownChainUrl} (GET)`, () => {
      return request(app.getHttpServer())
        .get(parachainIdUnknownChainUrl)
        .expect(400);
    });

    it('should get native balance successfully', async () => {
      const validRequest = {
        address: '5EtHZF4E8QagNCz6naobCkCAUT52SbcEqaXiDUu2PjUHxZid',
      };

      return request(app.getHttpServer())
        .post('/balance/Acala')
        .send(validRequest)
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeDefined();
        });
    });

    it('should return 400 for invalid native balance request', async () => {
      const invalidRequest = {
        address: '5EtHZF4E8QagNCz6naobCkCAUT52SbcEqaXiDUu2PjUHxZid',
      };

      return request(app.getHttpServer())
        .post('/balance/Chain123')
        .send(invalidRequest)
        .expect(400);
    });

    it('should get foreign balance successfully', async () => {
      const validRequest = {
        address: '5EtHZF4E8QagNCz6naobCkCAUT52SbcEqaXiDUu2PjUHxZid',
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

    it('should return 400 for invalid foreign balance request', async () => {
      const invalidRequest = {
        address: '5EtHZF4E8QagNCz6naobCkCAUT52SbcEqaXiDUu2PjUHxZid',
        currency: {
          symbol: 'UNQ',
        },
      };

      return request(app.getHttpServer())
        .post('/balance/Chain123')
        .send(invalidRequest)
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
  });

  describe('X-Transfer controller', () => {
    const amount = '10000000000';
    const recipient = 'FagnR7YW9N2PZfxC3dwSqQjb59Jsz3x35UZ24MqtA4eTVZR';
    const sender = '5FNDaod3wYTvg48s73H1zSB3gVoKNg2okr6UsbyTuLutTXFz';
    const xTransferUrl = '/x-transfer';
    const xTransfersUrl = '/x-transfers';
    const xTransferBatchUrl = '/x-transfer-batch';

    it(`Generate XCM call - No from or to provided - ${xTransferUrl}`, () => {
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          recipient,
        })
        .expect(400);
    });

    it(`Generate XCM call - Invalid from - ${xTransferUrl}`, () => {
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from: unknownChain,
          recipient,
        })
        .expect(400);
    });

    it(`Generate XCM call - Invalid to - ${xTransferUrl}`, () => {
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          to: unknownChain,
          recipient,
        })
        .expect(400);
    });

    it(`Generate XCM calls - No from or to provided - ${xTransfersUrl}`, () => {
      return request(app.getHttpServer())
        .post(xTransfersUrl)
        .send({
          recipient,
        })
        .expect(400);
    });

    it(`Generate XCM call - Parachain to parachain missing currency - ${xTransferUrl}`, () => {
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from: 'Acala',
          to: 'Basilisk',
          recipient,
        })
        .expect(400);
    });

    it(`Generate XCM call - Parachain to parachain invalid currency - ${xTransferUrl}`, () => {
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from: 'Acala',
          to: 'Basilisk',
          recipient,
          currency: 'UknownSymbol',
        })
        .expect(400);
    });

    it(`Generate XCM call - Parachain to parachain Native() selector - ${xTransferUrl}`, async () => {
      const from: TChain = 'Acala';
      const to: TChain = 'Astar';
      const currency = { symbol: Native('DOT'), amount };
      const tx = await Builder()
        .from(from)
        .to(to)
        .currency(currency)
        .sender(sender)
        .recipient(recipient)
        .build();
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from,
          to,
          sender,
          recipient,
          currency,
        })
        .expect(201)
        .expect((await tx.getEncodedData()).asHex());
    });

    it(`Generate XCM call - Parachain to parachain Foreign() selector - ${xTransferUrl}`, async () => {
      const from: TChain = 'Astar';
      const to: TChain = 'Acala';
      const currency = { symbol: Foreign('HDX'), amount: 1000000000000000 };
      const tx = await Builder()
        .from(from)
        .to(to)
        .currency(currency)
        .sender(sender)
        .recipient(recipient)
        .build();
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from,
          to,
          sender,
          recipient,
          currency,
        })
        .expect(201)
        .expect((await tx.getEncodedData()).asHex());
    });

    it(`Generate XCM call - Parachain to parachain invalid scenario - ${xTransferUrl}`, async () => {
      const from: TChain = 'AssetHubKusama';
      const to: TChain = 'Basilisk';
      const currency = { symbol: 'KSM', amount };
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from,
          to,
          recipient,
          currency,
        })
        .expect(400);
    });

    it(`Generate Batch XCM call - Parachain to parachain all valid - ${xTransferBatchUrl}`, async () => {
      const from: TChain = 'AssetHubKusama';
      const to1: TChain = 'Basilisk';
      const to2: TChain = 'Moonriver';
      const currency = { id: 1984, amount };
      const address1 = 'FagnR7YW9N2PZfxC3dwSqQjb59Jsz3x35UZ24MqtA4eTVZR';
      const address2 = '0x1501C1413e4178c38567Ada8945A80351F7B8496';

      const builder = Builder()
        .from(from)
        .to(to1)
        .currency(currency)
        .sender(sender)
        .recipient(address1)
        .addToBatch()
        .from(from)
        .to(to2)
        .currency(currency)
        .sender(sender)
        .recipient(address2)
        .addToBatch();

      const tx = await builder.buildBatch({ mode: BatchMode.BATCH_ALL });

      return request(app.getHttpServer())
        .post(xTransferBatchUrl)
        .send({
          transfers: [
            {
              from,
              to: to1,
              sender,
              recipient: address1,
              currency,
            },
            {
              from,
              to: to2,
              sender,
              recipient: address2,
              currency,
            },
          ],
          options: {
            mode: BatchMode.BATCH_ALL,
          },
        })
        .expect(201)
        .expect((await tx.getEncodedData()).asHex());
    });

    it(`Generate Batch XCM call - Invalid Currency Symbol - ${xTransferBatchUrl}`, async () => {
      const from: TChain = 'AssetHubKusama';
      const to: TChain = 'Basilisk';
      const invalidCurrency = { symbol: 'INVALID', amount };
      const recipient = 'FagnR7YW9N2PZfxC3dwSqQjb59Jsz3x35UZ24MqtA4eTVZR';

      return request(app.getHttpServer())
        .post(xTransferBatchUrl)
        .send({
          transfers: [
            {
              from,
              to,
              recipient,
              currency: invalidCurrency,
            },
          ],
          options: {
            mode: BatchMode.BATCH_ALL,
          },
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('does not support currency');
        });
    });

    it(`Generate Batch XCM call - Different 'from' Chains - ${xTransferBatchUrl}`, async () => {
      const from1: TChain = 'AssetHubKusama';
      const from2: TChain = 'Moonriver';
      const to: TChain = 'Basilisk';
      const currency = { symbol: 'USDT', amount };
      const recipient = 'FagnR7YW9N2PZfxC3dwSqQjb59Jsz3x35UZ24MqtA4eTVZR';

      return request(app.getHttpServer())
        .post(xTransferBatchUrl)
        .send({
          transfers: [
            {
              from: from1,
              to,
              recipient,
              currency,
            },
            {
              from: from2, // Different 'from' chain
              to,
              recipient,
              currency,
            },
          ],
          options: {
            mode: BatchMode.BATCH_ALL,
          },
        })
        .expect(400) // Expect Bad Request due to different 'from' chains
        .expect((res) => {
          expect(res.body.message).toContain(
            'All transactions in the batch must have the same origin.',
          );
        });
    });

    it(`Generate Batch XCM call - Invalid Addresses - ${xTransferBatchUrl}`, async () => {
      const from: TChain = 'AssetHubKusama';
      const to: TChain = 'Basilisk';
      const currency = { symbol: 'USDT', amount };
      const invalidAddress = 'InvalidAddress123';

      return request(app.getHttpServer())
        .post(xTransferBatchUrl)
        .send({
          transfers: [
            {
              from,
              to,
              recipient: invalidAddress,
              currency,
            },
          ],
          options: {
            mode: BatchMode.BATCH_ALL,
          },
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Invalid address:');
        });
    });

    it(`Generate Batch XCM call - Empty Transfers Array - ${xTransferBatchUrl}`, async () => {
      return request(app.getHttpServer())
        .post(xTransferBatchUrl)
        .send({
          transfers: [],
          options: {
            mode: BatchMode.BATCH_ALL,
          },
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'Transfers array cannot be empty.',
          );
        });
    });

    it(`Generate Batch XCM call - Invalid Batch Mode - ${xTransferBatchUrl}`, async () => {
      const from: TChain = 'AssetHubKusama';
      const to: TChain = 'Basilisk';
      const currency = { symbol: 'USDT', amount };
      const recipient = 'FagnR7YW9N2PZfxC3dwSqQjb59Jsz3x35UZ24MqtA4eTVZR';
      const invalidBatchMode = 'INVALID_MODE';

      return request(app.getHttpServer())
        .post(xTransferBatchUrl)
        .send({
          transfers: [
            {
              from,
              to,
              recipient,
              currency,
            },
          ],
          options: {
            mode: invalidBatchMode, // Invalid batch mode
          },
        })
        .expect(400); // Expect Bad Request due to invalid batch mode
    });

    it(`Generate Batch XCM call - Missing Required Fields - ${xTransferBatchUrl}`, async () => {
      const from: TChain = 'AssetHubKusama';
      const currency = { symbol: 'USDT' };

      return request(app.getHttpServer())
        .post(xTransferBatchUrl)
        .send({
          transfers: [
            {
              from,
              recipient,
              currency,
            },
          ],
          options: {
            mode: BatchMode.BATCH_ALL,
          },
        })
        .expect(400);
    });

    it(`Generate Batch XCM call - Zero or Negative Amounts - ${xTransferBatchUrl}`, async () => {
      const from: TChain = 'AssetHubKusama';
      const to: TChain = 'Basilisk';
      const currency = { symbol: 'USDT', amount: '-1000' }; // Negative amount
      const recipient = 'FagnR7YW9N2PZfxC3dwSqQjb59Jsz3x35UZ24MqtA4eTVZR';

      return request(app.getHttpServer())
        .post(xTransferBatchUrl)
        .send({
          transfers: [
            {
              from,
              to,
              recipient,
              currency,
            },
          ],
          options: {
            mode: BatchMode.BATCH_ALL,
          },
        })
        .expect(400);
    });

    it(`Generate Batch XCM call - Batch Mode 'BATCH' - ${xTransferBatchUrl}`, async () => {
      const from: TChain = 'AssetHubKusama';
      const to1: TChain = 'Basilisk';
      const to2: TChain = 'Moonriver';
      const currency = { id: 1984, amount };
      const recipient1 = 'FagnR7YW9N2PZfxC3dwSqQjb59Jsz3x35UZ24MqtA4eTVZR';
      const recipient2 = '0x1501C1413e4178c38567Ada8945A80351F7B8496';

      const builder = Builder()
        .from(from)
        .to(to1)
        .currency(currency)
        .sender(sender)
        .recipient(recipient1)
        .addToBatch()
        .from(from)
        .to(to2)
        .currency(currency)
        .sender(sender)
        .recipient(recipient2)
        .addToBatch();

      const tx = await builder.buildBatch({ mode: BatchMode.BATCH });

      return request(app.getHttpServer())
        .post(xTransferBatchUrl)
        .send({
          transfers: [
            {
              from,
              to: to1,
              sender: sender,
              recipient: recipient1,
              currency,
            },
            {
              from,
              to: to2,
              sender: sender,
              recipient: recipient2,
              currency,
            },
          ],
          options: {
            mode: BatchMode.BATCH,
          },
        })
        .expect(201)
        .expect((await tx.getEncodedData()).asHex());
    });

    it(`Generate Batch XCM call - Single Transfer in Batch - ${xTransferBatchUrl}`, async () => {
      const from: TChain = 'AssetHubKusama';
      const to: TChain = 'Basilisk';
      const currency = { id: 1984, amount };

      const builder = Builder()
        .from(from)
        .to(to)
        .currency(currency)
        .sender(sender)
        .recipient(recipient)
        .addToBatch();

      const tx = await builder.buildBatch({ mode: BatchMode.BATCH_ALL });

      return request(app.getHttpServer())
        .post(xTransferBatchUrl)
        .send({
          transfers: [
            {
              from,
              to,
              sender,
              recipient,
              currency,
            },
          ],
          options: {
            mode: BatchMode.BATCH_ALL,
          },
        })
        .expect(201)
        .expect((await tx.getEncodedData()).asHex());
    });

    it(`Generate Batch XCM call - Specifying XCM Version - ${xTransferBatchUrl}`, async () => {
      const from: TChain = 'AssetHubKusama';
      const to: TChain = 'Basilisk';
      const currency = { id: 1984, amount };
      const xcmVersion = Version.V3;

      const builder = Builder()
        .from(from)
        .to(to)
        .currency(currency)
        .sender(sender)
        .recipient(recipient)
        .xcmVersion(xcmVersion)
        .addToBatch();

      const tx = await builder.buildBatch({ mode: BatchMode.BATCH_ALL });

      return request(app.getHttpServer())
        .post(xTransferBatchUrl)
        .send({
          transfers: [
            {
              from,
              to,
              sender,
              recipient,
              currency,
              xcmVersion,
            },
          ],
          options: {
            mode: BatchMode.BATCH_ALL,
          },
        })
        .expect(201)
        .expect((await tx.getEncodedData()).asHex());
    });

    it(`Generate Batch XCM call - Parachain to Relay Chain - ${xTransferBatchUrl}`, async () => {
      const from: TChain = 'Acala';

      const currency = {
        symbol: 'DOT',
        amount: '10000000000',
      };

      const builder = Builder()
        .from(from)
        .to('Polkadot')
        .currency(currency)
        .sender(sender)
        .recipient(recipient)
        .addToBatch();

      const tx = await builder.buildBatch({ mode: BatchMode.BATCH_ALL });

      return request(app.getHttpServer())
        .post(xTransferBatchUrl)
        .send({
          transfers: [
            {
              from,
              to: 'Polkadot',
              currency,
              sender,
              recipient,
            },
          ],
          options: {
            mode: BatchMode.BATCH_ALL,
          },
        })
        .expect(201)
        .expect((await tx.getEncodedData()).asHex());
    });

    it(`Generate Batch XCM call - Relay Chain to Parachain - ${xTransferBatchUrl}`, async () => {
      const to: TChain = 'Basilisk';

      const currency = {
        symbol: 'KSM',
        amount: '1000',
      };

      const builder = Builder()
        .from('Kusama')
        .to(to)
        .currency(currency)
        .sender(sender)
        .recipient(recipient)
        .addToBatch();

      const tx = await builder.buildBatch({ mode: BatchMode.BATCH_ALL });

      return request(app.getHttpServer())
        .post(xTransferBatchUrl)
        .send({
          transfers: [
            {
              from: 'Kusama',
              to,
              currency,
              sender,
              recipient,
            },
          ],
          options: {
            mode: BatchMode.BATCH_ALL,
          },
        })
        .expect(201)
        .expect((await tx.getEncodedData()).asHex());
    });

    it(`Generate XCM call - Parachain to parachain all valid - ${xTransferUrl}`, async () => {
      const from: TChain = 'AssetHubKusama';
      const to: TChain = 'Basilisk';
      const currency = { id: 1984, amount };

      const tx = await Builder()
        .from(from)
        .to(to)
        .currency(currency)
        .sender(sender)
        .recipient(recipient)
        .build();
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from,
          to,
          sender,
          recipient,
          currency,
        })
        .expect(201)
        .expect((await tx.getEncodedData()).asHex());
    });

    it(`Generate XCM call - Parachain to parachain override currency - ${xTransferUrl}`, async () => {
      const from: TChain = 'Hydration';
      const to: TChain = 'AssetHubPolkadot';
      const currency: TLocation = {
        parents: 0,
        interior: {
          X1: {
            Parachain: 2000,
          },
        },
      };
      const tx = await Builder()
        .from(from)
        .to(to)
        .currency({ location: Override(currency), amount })
        .recipient(recipient)
        .build();
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from,
          to,
          recipient,
          currency: { location: Override(currency), amount },
        })
        .expect(201)
        .expect((await tx.getEncodedData()).asHex());
    });

    it(`Generate XCM call - Parachain to parachain custom xcm execute call - ${xTransferUrl}`, async () => {
      const from: TChain = 'AssetHubPolkadot';
      const to: TChain = 'Hydration';
      const currency: TCurrencyInputWithAmount = {
        symbol: 'USDC',
        amount: '1000000000',
      };
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from,
          to,
          recipient,
          currency,
          feeAsset: currency,
        })
        .expect(400);
    });

    it(`Generate XCM call - Parachain to parachain override currency as multi asset - ${xTransferUrl}`, async () => {
      const from: TChain = 'AssetHubPolkadot';
      const to: TChain = 'BifrostPolkadot';
      const createCurrency = (fungible: string): TAsset<string>[] => [
        {
          id: {
            parents: 1,
            interior: {
              X3: [
                {
                  Parachain: 1000,
                },
                {
                  PalletInstance: 50,
                },
                {
                  GeneralIndex: 1984,
                },
              ],
            },
          },
          fun: {
            Fungible: fungible,
          },
        },
        {
          id: {
            parents: 1,
            interior: {
              X2: [
                {
                  Parachain: 2125,
                },
                {
                  GeneralIndex: 0,
                },
              ],
            },
          },
          fun: {
            Fungible: fungible,
          },
        },
      ];
      const feeAsset: TLocation = {
        parents: 1,
        interior: {
          X2: [
            {
              Parachain: 2125,
            },
            {
              GeneralIndex: 0,
            },
          ],
        },
      };
      const tx = await Builder()
        .from(from)
        .to(to)
        .currency(createCurrency('1000000000'))
        .feeAsset({
          location: feeAsset,
        })
        .sender(sender)
        .recipient(recipient)
        .build();
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from,
          to,
          sender,
          recipient,
          currency: createCurrency('1000000000'),
          feeAsset: { location: feeAsset },
        })
        .expect(201)
        .expect((await tx.getEncodedData()).asHex());
    });

    it(`Generate XCM call - Parachain to relaychain all valid - ${xTransferUrl}`, async () => {
      const currency: TCurrencyInputWithAmount = {
        symbol: { type: 'Native', value: 'KSM' },
        amount,
      };

      const tx = await Builder()
        .from('AssetHubKusama')
        .to('Kusama')
        .currency(currency)
        .sender(sender)
        .recipient(recipient)
        .build();
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from: 'AssetHubKusama',
          to: 'Kusama',
          currency,
          sender,
          recipient,
        })
        .expect(201)
        .expect((await tx.getEncodedData()).asHex());
    });

    it(`Generate XCM call - Relaychain to parachain all valid - ${xTransferUrl}`, async () => {
      const tx = await Builder()
        .from('Kusama')
        .to('AssetHubKusama')
        .currency({
          symbol: 'KSM',
          amount,
        })
        .sender(sender)
        .recipient(recipient)
        .build();
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from: 'Kusama',
          to: 'AssetHubKusama',
          currency: {
            symbol: 'KSM',
            amount,
          },
          sender,
          recipient,
        })
        .expect(201)
        .expect((await tx.getEncodedData()).asHex());
    });

    it(`Generate XCM call - Parachain to relaychain all valid - ${xTransferUrl}`, async () => {
      const currency: TCurrencyInputWithAmount = {
        symbol: { type: 'Native', value: 'KSM' },
        amount,
      };

      const tx = await Builder()
        .from('AssetHubKusama')
        .to('Kusama')
        .currency(currency)
        .sender(sender)
        .recipient(recipient)
        .xcmVersion(Version.V3)
        .build();
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from: 'AssetHubKusama',
          to: 'Kusama',
          currency,
          sender,
          recipient,
          xcmVersion: Version.V3,
        })
        .expect(201)
        .expect((await tx.getEncodedData()).asHex());
    });

    it(`Generate XCM call - Dry run unsupported chain - should throw error 400 - ${xTransferUrl}`, async () => {
      return request(app.getHttpServer())
        .post('/dry-run')
        .send({
          from: 'Interlay',
          to: 'Astar',
          currency: {
            symbol: 'ACA',
            amount,
          },
          sender,
          recipient,
        })
        .expect(400);
    });

    it(`Generate XCM call - Parachain to relaychain invalid version - ${xTransferUrl}`, async () => {
      const from: TChain = 'AssetHubKusama';
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from,
          to: 'Kusama',
          currency: {
            symbol: 'KSM',
            amount,
          },
          recipient,
          xcmVersion: 'V6',
        })
        .expect(400);
    });

    it(`Generate XCM call - Parachain to relaychain override pallet and method - ${xTransferUrl}`, async () => {
      const from: TChain = 'AssetHubKusama';
      const currency = {
        symbol: { type: 'Native', value: 'KSM' },
        amount,
      };
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from,
          to: 'Kusama',
          currency,
          sender,
          recipient,
          pallet: 'Balances',
          method: 'transfer',
        })
        .expect(500);
    });

    it(`Generate XCM call - keepAlive enabled - ${xTransferUrl}`, async () => {
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from: 'Hydration',
          to: 'AssetHubPolkadot',
          sender,
          recipient,
          currency: {
            symbol: 'DOT',
            amount: '10000000000',
          },
          keepAlive: true,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'Keep alive option is not yet supported for XCM transfers.',
          );
        });
    });

    it(`Generate XCM call - keepAlive invalid type - ${xTransferUrl}`, async () => {
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from: 'Hydration',
          to: 'AssetHubPolkadot',
          sender,
          recipient,
          currency: {
            symbol: 'DOT',
            amount: '10000000000',
          },
          keepAlive: 'true',
        })
        .expect(400);
    });

    it(`Generate XCM call - transact options invalid origin kind - ${xTransferUrl}`, async () => {
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from: 'AssetHubKusama',
          to: 'BifrostKusama',
          sender,
          recipient,
          currency: {
            symbol: { type: 'Native', value: 'KSM' },
            amount,
          },
          transactOptions: {
            call: '0x00',
            originKind: 'InvalidOrigin',
            maxWeight: {
              refTime: 0,
              proofSize: 0,
            },
          },
        })
        .expect(400);
    });

    it(`Generate XCM call - transact options invalid maxWeight type - ${xTransferUrl}`, async () => {
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from: 'AssetHubKusama',
          to: 'BifrostKusama',
          sender,
          recipient,
          currency: {
            symbol: { type: 'Native', value: 'KSM' },
            amount,
          },
          transactOptions: {
            call: '0x00',
            originKind: 'Native',
            maxWeight: {
              refTime: 'invalid',
              proofSize: 0,
            },
          },
        })
        .expect(400);
    });

    it(`Generate XCM call - swap options invalid exchange - ${xTransferUrl}`, async () => {
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from: 'Astar',
          to: 'BifrostPolkadot',
          sender,
          recipient,
          currency: {
            symbol: { type: 'Native', value: 'ASTR' },
            amount: '1000000000000000000',
          },
          swapOptions: {
            currencyTo: { symbol: 'DOT' },
            exchange: 'InvalidExchange',
            slippage: 5,
          },
        })
        .expect(400);
    });

    it(`Generate XCM call - advanced options (development requires overrides) - ${xTransferUrl}`, async () => {
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from: 'Astar',
          to: 'BifrostPolkadot',
          sender,
          recipient,
          currency: {
            symbol: { type: 'Native', value: 'ASTR' },
            amount: '1000000000000000000',
          },
          options: {
            development: true,
            abstractDecimals: false,
            xcmFormatCheck: true,
          },
        })
        .expect(400);
    });

    it(`Generate XCM call - advanced options invalid apiOverrides type - ${xTransferUrl}`, async () => {
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from: 'Astar',
          to: 'BifrostPolkadot',
          sender,
          recipient,
          currency: {
            symbol: { type: 'Native', value: 'ASTR' },
            amount: '1000000000000000000',
          },
          options: {
            development: true,
            apiOverrides: {
              Astar: 123,
            },
          },
        })
        .expect(400);
    });

    it('Get best amount out - missing swap options - /best-amount-out', () => {
      return request(app.getHttpServer())
        .post('/best-amount-out')
        .send({
          from: 'Astar',
          to: 'BifrostPolkadot',
          sender,
          recipient,
          currency: {
            symbol: { type: 'Native', value: 'ASTR' },
            amount: '1000000000000000000',
          },
        })
        .expect(500);
    });

    it('Dry run preview - invalid mintFeeAssets type - /dry-run-preview', () => {
      return request(app.getHttpServer())
        .post('/dry-run-preview')
        .send({
          from: 'Hydration',
          to: 'AssetHubPolkadot',
          sender,
          recipient,
          currency: {
            symbol: 'DOT',
            amount: '10000000000',
          },
          options: {
            mintFeeAssets: 'true',
          },
        })
        .expect(400);
    });

    it('Get XCM fee - invalid disableFallback type - /xcm-fee', () => {
      return request(app.getHttpServer())
        .post('/xcm-fee')
        .send({
          from: 'Hydration',
          to: 'AssetHubPolkadot',
          sender,
          recipient,
          currency: {
            symbol: 'DOT',
            amount: '10000000000',
          },
          disableFallback: 'true',
        })
        .expect(400);
    });

    it('Sign and submit - invalid sender derivation path - /sign-and-submit', () => {
      return request(app.getHttpServer())
        .post('/sign-and-submit')
        .send({
          from: 'AssetHubKusama',
          to: 'Basilisk',
          sender,
          recipient,
          currency: {
            id: 1984,
            amount,
          },
        })
        .expect(400);
    });

    it(`Gets Ethereum bridge status`, async () => {
      return request(app.getHttpServer())
        .get('/x-transfer/eth-bridge-status')
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined();
        });
    });

    it('Get swap pairs - invalid exchange - /swap/pairs (GET)', () => {
      return request(app.getHttpServer())
        .get('/swap/pairs')
        .query({ exchange: 'InvalidExchange' })
        .expect(400);
    });

    it('Get swap pairs - valid exchange - /swap/pairs (GET)', () => {
      return request(app.getHttpServer())
        .get('/swap/pairs')
        .query({ exchange: 'Hydration' })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('Get swap pairs - valid exchange array - /swap/pairs (GET)', () => {
      return request(app.getHttpServer())
        .get('/swap/pairs')
        .query({ exchange: ['Hydration', 'Acala'] })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it(`X-transfer with valid advanced options + overrides - ${xTransferUrl}`, async () => {
      const from: TChain = 'Hydration';
      const to: TChain = 'AssetHubPolkadot';
      const currency: TCurrencyInputWithAmount = {
        symbol: 'DOT',
        amount: '10000000000',
      };

      const options = {
        development: true,
        abstractDecimals: false,
        xcmFormatCheck: true,
        apiOverrides: {
          Hydration: ['wss://rpc.hydradx.cloud', 'wss://hydration.ibp.network'],
          AssetHubPolkadot: ['wss://polkadot-asset-hub-rpc.polkadot.io', 'wss://dot-rpc.stakeworld.io/assethub'],
        },
      };

      const tx = await Builder(options)
        .from(from)
        .to(to)
        .currency(currency)
        .sender(sender)
        .recipient(recipient)
        .build();

      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from,
          to,
          sender,
          recipient,
          currency,
          options,
        })
        .expect(201)
        .expect((await tx.getEncodedData()).asHex());
    });

    it(`X-transfer with valid transact options - ${xTransferUrl}`, async () => {
      const from: TChain = 'AssetHubKusama';
      const to: TChain = 'BifrostKusama';
      const currency: TCurrencyInputWithAmount = {
        symbol: { type: 'Native', value: 'KSM' },
        amount,
      };
      const transactOptions = {
        call: '0x00',
        originKind: 'Native' as const,
        maxWeight: {
          refTime: '1000',
          proofSize: '100',
        },
      };
      const transactWeightForBuilder = {
        refTime: 1000n,
        proofSize: 100n,
      };

      const tx = await Builder()
        .from(from)
        .to(to)
        .currency(currency)
        .sender(sender)
        .recipient(recipient)
        .transact(
          transactOptions.call,
          transactOptions.originKind,
          transactWeightForBuilder,
        )
        .build();

      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from,
          to,
          sender,
          recipient,
          currency,
          transactOptions,
        })
        .expect(201)
        .expect((await tx.getEncodedData()).asHex());
    });

    it(`X-transfers with valid swap options array exchange - ${xTransfersUrl}`, async () => {
      const from: TChain = 'Astar';
      const to: TChain = 'BifrostPolkadot';
      const currency: TCurrencyInputWithAmount = {
        symbol: { type: 'Native', value: 'ASTR' },
        amount: '1000000000000000000',
      };
      const builder = Builder();
      const swapOptions: Parameters<typeof builder.swap>[0] = {
        currencyTo: { symbol: 'DOT' },
        exchange: ['Hydration', 'Acala'],
        slippage: 1,
      };

      const txContexts = await builder
        .from(from)
        .to(to)
        .currency(currency)
        .sender(sender)
        .recipient(recipient)
        .swap(swapOptions)
        .buildAll();

      const expectedResponse = await Promise.all(
        txContexts.map(async (txContext) => ({
          type: txContext.type,
          chain: txContext.chain,
          wsProviders: getChainProviders(txContext.chain),
        })),
      );

      return request(app.getHttpServer())
        .post(xTransfersUrl)
        .send({
          from,
          to,
          sender,
          recipient,
          currency,
          swapOptions,
        })
        .expect(201)
        .expect(({ body }) => {
          expect(body).toHaveLength(expectedResponse.length);

          body.forEach((txContext: (typeof body)[number], index: number) => {
            expect(txContext.tx).toMatch(/^0x[0-9a-f]+$/);
            expect({
              type: txContext.type,
              chain: txContext.chain,
              wsProviders: txContext.wsProviders,
            }).toEqual({
              type: expectedResponse[index].type,
              chain: expectedResponse[index].chain,
              wsProviders: expectedResponse[index].wsProviders,
            });
          });
        });
    });
  });

  describe('Asset claim controller', () => {
    const address = 'FagnR7YW9N2PZfxC3dwSqQjb59Jsz3x35UZ24MqtA4eTVZR';

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
          from: unknownChain,
          address,
        })
        .expect(400);
    });

    it('Generate asset claim call - invalid wallet address - /asset-claim', () => {
      return request(app.getHttpServer())
        .post('/asset-claim')
        .send({
          from: mockChain,
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
        .expect((await tx.getEncodedData()).asHex());
    });
  });

  describe('Transfer info controller', () => {
    const transferInfo: XTransferDto = {
      from: 'Hydration',
      to: 'AssetHubPolkadot',
      sender: '5FNDaod3wYTvg48s73H1zSB3gVoKNg2okr6UsbyTuLutTXFz',
      recipient: '5FNDaod3wYTvg48s73H1zSB3gVoKNg2okr6UsbyTuLutTXFz',
      currency: { symbol: 'DOT', amount: '10000000000' },
    };

    it('Generate transfer info call - invalid origin provided - /transfer-info', () => {
      return request(app.getHttpServer())
        .post('/transfer-info')
        .send({
          ...transferInfo,
          from: unknownChain,
        })
        .expect(400);
    });

    it('Generate transfer info call - invalid destination provided - /transfer-info', () => {
      return request(app.getHttpServer())
        .post('/transfer-info')
        .send({
          ...transferInfo,
          to: unknownChain,
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
  });

  describe('XCM Analyser controller', () => {
    it('Get location paths - No location or xcm provided - /xcm-analyser', () => {
      return request(app.getHttpServer()).post('/xcm-analyser').expect(400);
    });

    it('Get location paths - Invalid location provided - /xcm-analyser', () => {
      return request(app.getHttpServer())
        .post('/xcm-analyser')
        .send({
          location: {
            parents: '0',
            exterior: {
              X1: {
                Parachain: '2000',
              },
            },
          },
        })
        .expect(400);
    });

    it('Get location paths - XCM without any locations provided - /xcm-analyser', () => {
      return request(app.getHttpServer())
        .post('/xcm-analyser')
        .send({
          xcm: ['0x123'],
        })
        .expect(201)
        .expect('[]');
    });

    it('Get location paths - Valid location - /xcm-analyser', () => {
      return request(app.getHttpServer())
        .post('/xcm-analyser')
        .send({
          location: {
            parents: '0',
            interior: {
              X1: {
                Parachain: '2000',
              },
            },
          },
        })
        .expect(201)
        .expect('"./Parachain(2000)"');
    });

    it('Get location paths - Valid XCM - /xcm-analyser', () => {
      return request(app.getHttpServer())
        .post('/xcm-analyser')
        .send({
          xcm: ['0x123'],
        })
        .expect(201)
        .expect('[]');
    });
  });
});
