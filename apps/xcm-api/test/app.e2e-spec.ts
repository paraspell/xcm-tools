import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import {
  BatchMode,
  Builder,
  Foreign,
  NODES_WITH_RELAY_CHAINS,
  NODES_WITH_RELAY_CHAINS_DOT_KSM,
  NODE_NAMES_DOT_KSM,
  Native,
  Override,
  TCurrencyInputWithAmount,
  TMultiAsset,
  TMultiLocation,
  TNode,
  Version,
  getAllAssetsSymbols,
  getAssetsObject,
  getDefaultPallet,
  getNativeAssets,
  getOtherAssets,
  getParaId,
  getRelayChainSymbol,
  getSupportedPallets,
  hasSupportForAsset,
  replaceBigInt,
} from '@paraspell/sdk';
import { RouterDto } from '../src/router/dto/RouterDto';
import { describe, beforeAll, it, expect } from 'vitest';
import { ExpressAdapter } from '@nestjs/platform-express';
import { XTransferDto } from '../src/x-transfer/dto/XTransferDto';

describe('XCM API (e2e)', () => {
  let app: INestApplication;
  const mockNode: TNode = 'Basilisk';
  const mockSymbol = 'DOT';
  const unknownNode = 'UnknownNode';

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
    NODE_NAMES_DOT_KSM.forEach((node) => {
      const supoortedPalletsUrl = `/pallets/${node}`;
      it(`Supported pallets - ${supoortedPalletsUrl} (GET)`, () => {
        const pallets = getSupportedPallets(node);
        return request(app.getHttpServer())
          .get(supoortedPalletsUrl)
          .expect(200)
          .expect(pallets);
      });

      const defaultPalletUrl = `/pallets/${node}/default`;
      it(`Default pallet - ${defaultPalletUrl} (GET)`, () => {
        const pallet = getDefaultPallet(node);
        return request(app.getHttpServer())
          .get(defaultPalletUrl)
          .expect(200)
          .expect(JSON.stringify(pallet));
      });
    });

    const supportedPalletsUnknownNodeUrl = `/pallets/${unknownNode}`;
    it(`Supported pallets - ${supportedPalletsUnknownNodeUrl} (GET)`, () => {
      return request(app.getHttpServer())
        .get(supportedPalletsUnknownNodeUrl)
        .expect(400);
    });

    const defaultPalletUnknownNodeUrl = `/pallets/${unknownNode}/default`;
    it(`Default pallet - ${defaultPalletUnknownNodeUrl} (GET)`, () => {
      return request(app.getHttpServer())
        .get(defaultPalletUnknownNodeUrl)
        .expect(400);
    });
  });

  describe('Node configs controller', () => {
    const nodeNamesUrl = '/nodes';
    it(`Get node names - ${nodeNamesUrl} (GET)`, () => {
      return request(app.getHttpServer())
        .get(nodeNamesUrl)
        .expect(200)
        .expect(NODES_WITH_RELAY_CHAINS);
    });

    NODES_WITH_RELAY_CHAINS_DOT_KSM.filter(
      // These nodes do not have ws endpoints
      (node) => node !== 'Peaq',
    ).forEach((node) => {
      it(`should return ws endpoints for all nodes - ${node}`, async () => {
        return request(app.getHttpServer())
          .get(`/nodes/${node}/ws-endpoints`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toBeDefined();
          });
      });
    });
  });

  describe('Assets controller', () => {
    const unknownSymbol = 'UnknownSymbol';

    NODE_NAMES_DOT_KSM.forEach((node) => {
      if (node === 'Polimec') return;
      const assetsObjectUrl = `/assets/${node}`;
      it(`Get assets object - ${assetsObjectUrl} (GET)`, () => {
        const assetsObject = getAssetsObject(node);
        return request(app.getHttpServer())
          .get(assetsObjectUrl)
          .expect(200)
          .expect(assetsObject);
      });

      const otherAssets = getOtherAssets(node);
      if (otherAssets.length > 1) {
        const { symbol, decimals } =
          otherAssets[0].assetId !== undefined
            ? otherAssets[0]
            : otherAssets[1];

        if (symbol) {
          const assetDecimalsUrl = `/assets/${node}/decimals`;
          it(`Get asset decimals - ${assetDecimalsUrl} symbol=${symbol} (GET)`, () => {
            return request(app.getHttpServer())
              .get(assetDecimalsUrl)
              .query({ symbol })
              .expect(200)
              .expect((res) => expect(Number(res.text)).toEqual(decimals));
          });

          const hasSupportUrl = `/assets/${node}/has-support`;
          it(`Has support for asset - ${hasSupportUrl} (GET)`, () => {
            const hasSupport = hasSupportForAsset(node, symbol);
            return request(app.getHttpServer())
              .get(hasSupportUrl)
              .query({ symbol })
              .expect(200)
              .expect((res) => expect(Boolean(res.text)).toEqual(hasSupport));
          });
        }
      }

      const relayChainSymbolUrl = `/assets/${node}/relay-chain-symbol`;
      it(`Get relaychain symbol - ${relayChainSymbolUrl} (GET)`, () => {
        const relayChainSymbol = getRelayChainSymbol(node);
        return request(app.getHttpServer())
          .get(relayChainSymbolUrl)
          .expect(200)
          .expect(JSON.stringify(relayChainSymbol));
      });

      const nativeAssetsUrl = `/assets/${node}/native`;
      it(`Get native assets - ${nativeAssetsUrl} (GET)`, () => {
        const nativeAssets = getNativeAssets(node);
        return request(app.getHttpServer())
          .get(nativeAssetsUrl)
          .expect(200)
          .expect(nativeAssets);
      });

      const otherAssetsUrl = `/assets/${node}/other`;
      it(`Get other assets - ${otherAssetsUrl} (GET)`, () => {
        const otherAssets = getOtherAssets(node);
        return request(app.getHttpServer())
          .get(otherAssetsUrl)
          .expect(200)
          .expect(otherAssets);
      });

      const allAssetsSymbolsUrl = `/assets/${node}/all-symbols`;
      it(`Get all assets symbols - ${allAssetsSymbolsUrl} (GET)`, () => {
        const symbols = getAllAssetsSymbols(node);
        return request(app.getHttpServer())
          .get(allAssetsSymbolsUrl)
          .expect(200)
          .expect(symbols);
      });

      const parachainIdUrl = `/nodes/${node}/para-id`;
      it(`Get parachain id - ${parachainIdUrl} (GET)`, () => {
        const paraId = getParaId(node);
        return request(app.getHttpServer())
          .get(parachainIdUrl)
          .expect(200)
          .expect((res) => expect(Number(res.text)).toEqual(paraId));
      });
    });

    const assetsObjectUknownNodeUrl = `/assets/${unknownNode}`;
    it(`Get assets object - ${assetsObjectUknownNodeUrl} (GET)`, () => {
      return request(app.getHttpServer())
        .get(assetsObjectUknownNodeUrl)
        .expect(400);
    });

    const assetIdUknownNodeUrl = `/assets/${unknownNode}/id`;
    it(`Get asset id - ${assetIdUknownNodeUrl} (GET)`, () => {
      return request(app.getHttpServer())
        .get(assetIdUknownNodeUrl)
        .query({ symbol: mockSymbol })
        .expect(400);
    });

    const assetIdUnknownSymbolUrl = `/assets/${mockNode}/id`;
    it(`Get asset id - non existent symbol - ${assetIdUnknownSymbolUrl} (GET)`, () => {
      return request(app.getHttpServer())
        .get(assetIdUnknownSymbolUrl)
        .query({ symbol: unknownSymbol })
        .expect(404);
    });

    it(`Get asset multilocation`, () =>
      request(app.getHttpServer())
        .post(`/assets/AssetHubPolkadot/multilocation`)
        .send({
          currency: {
            symbol: 'USDt',
          },
        })
        .expect(201));

    const relayChainSymbolUknownNodeUrl = `/assets/${unknownNode}/relay-chain-symbol`;
    it(`Get relaychain symbol - ${relayChainSymbolUknownNodeUrl} (GET)`, () => {
      return request(app.getHttpServer())
        .get(relayChainSymbolUknownNodeUrl)
        .expect(400);
    });

    const assetDecimalsUknownNodeUrl = `/assets/${unknownNode}/decimals`;
    it(`Get asset decimals - ${assetDecimalsUknownNodeUrl} (GET)`, () => {
      return request(app.getHttpServer())
        .get(assetDecimalsUknownNodeUrl)
        .query({ symbol: mockSymbol })
        .expect(400);
    });

    const assetDecimalsUnknownSymbolUrl = `/assets/${mockNode}/decimals`;
    it(`Get asset decimals - non existent symbol - ${assetDecimalsUnknownSymbolUrl} (GET)`, () => {
      return request(app.getHttpServer())
        .get(assetDecimalsUnknownSymbolUrl)
        .query({ symbol: 'UknownSymbol' })
        .expect(404);
    });

    const hasSupportUnknownNodeUrl = `/assets/${unknownNode}/has-support`;
    it(`Has support for asset - ${hasSupportUnknownNodeUrl} (GET)`, () => {
      return request(app.getHttpServer())
        .get(hasSupportUnknownNodeUrl)
        .query({ symbol: mockSymbol })
        .expect(400);
    });

    const parachainIdUnknownNodeUrl = `/nodes/${unknownNode}/para-id `;
    it(`Get parachain id - ${parachainIdUnknownNodeUrl} (GET)`, () => {
      return request(app.getHttpServer())
        .get(parachainIdUnknownNodeUrl)
        .expect(400);
    });

    it('should get native balance successfully', async () => {
      const validRequest = {
        address: '5EtHZF4E8QagNCz6naobCkCAUT52SbcEqaXiDUu2PjUHxZid',
      };

      return request(app.getHttpServer())
        .post('/balance/Acala/native')
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
        .post('/balance/Node123/native')
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
        .post('/balance/Acala/foreign')
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
        .post('/balance/Node123/foreign')
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
    const amount = '1000000000';
    const address = 'FagnR7YW9N2PZfxC3dwSqQjb59Jsz3x35UZ24MqtA4eTVZR';
    const xTransferUrl = '/x-transfer';
    const xTransferBatchUrl = '/x-transfer-batch';

    it(`Generate XCM call - No from or to provided - ${xTransferUrl}`, () => {
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          address,
        })
        .expect(400);
    });

    it(`Generate XCM call - Invalid from - ${xTransferUrl}`, () => {
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from: unknownNode,
          address,
        })
        .expect(400);
    });

    it(`Generate XCM call - Invalid to - ${xTransferUrl}`, () => {
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          to: unknownNode,
          address,
        })
        .expect(400);
    });

    it(`Generate XCM call - Parachain to parachain missing currency - ${xTransferUrl}`, () => {
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from: 'Acala',
          to: 'Basilisk',
          address,
        })
        .expect(400);
    });

    it(`Generate XCM call - Parachain to parachain invalid currency - ${xTransferUrl}`, () => {
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from: 'Acala',
          to: 'Basilisk',
          address,
          currency: 'UknownSymbol',
        })
        .expect(400);
    });

    it(`Generate XCM call - Parachain to parachain Native() selector - ${xTransferUrl}`, async () => {
      const from: TNode = 'Acala';
      const to: TNode = 'Astar';
      const currency = { symbol: Native('DOT'), amount };
      const tx = await Builder()
        .from(from)
        .to(to)
        .currency(currency)
        .address(address)
        .build();
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from,
          to,
          address,
          currency,
        })
        .expect(201)
        .expect((await tx.getEncodedData()).asHex());
    });

    it(`Generate XCM call - Parachain to parachain Foreign() selector - ${xTransferUrl}`, async () => {
      const from: TNode = 'Astar';
      const to: TNode = 'Acala';
      const currency = { symbol: Foreign('HDX'), amount };
      const tx = await Builder()
        .from(from)
        .to(to)
        .currency(currency)
        .address(address)
        .build();
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from,
          to,
          address,
          currency,
        })
        .expect(201)
        .expect((await tx.getEncodedData()).asHex());
    });

    it(`Generate XCM call - Parachain to parachain invalid scenario - ${xTransferUrl}`, async () => {
      const from: TNode = 'AssetHubKusama';
      const to: TNode = 'Basilisk';
      const currency = { symbol: 'KSM', amount };
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from,
          to,
          address,
          currency,
        })
        .expect(400);
    });

    it(`Generate Batch XCM call - Parachain to parachain all valid - ${xTransferBatchUrl}`, async () => {
      const from: TNode = 'AssetHubKusama';
      const to1: TNode = 'Basilisk';
      const to2: TNode = 'Moonriver';
      const currency = { symbol: 'USDT', amount };
      const amount1 = '1000';
      const amount2 = '2000';
      const address1 = 'FagnR7YW9N2PZfxC3dwSqQjb59Jsz3x35UZ24MqtA4eTVZR';
      const address2 = '0x1501C1413e4178c38567Ada8945A80351F7B8496';

      const builder = Builder()
        .from(from)
        .to(to1)
        .currency(currency)
        .address(address1)
        .addToBatch()
        .from(from)
        .to(to2)
        .currency(currency)
        .address(address2)
        .addToBatch();

      const tx = await builder.buildBatch({ mode: BatchMode.BATCH_ALL });

      return request(app.getHttpServer())
        .post(xTransferBatchUrl)
        .send({
          transfers: [
            {
              from,
              to: to1,
              address: address1,
              currency,
            },
            {
              from,
              to: to2,
              address: address2,
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
      const from: TNode = 'AssetHubKusama';
      const to: TNode = 'Basilisk';
      const invalidCurrency = { symbol: 'INVALID', amount };
      const address = 'FagnR7YW9N2PZfxC3dwSqQjb59Jsz3x35UZ24MqtA4eTVZR';

      return request(app.getHttpServer())
        .post(xTransferBatchUrl)
        .send({
          transfers: [
            {
              from,
              to,
              address,
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

    it(`Generate Batch XCM call - Different 'from' Nodes - ${xTransferBatchUrl}`, async () => {
      const from1: TNode = 'AssetHubKusama';
      const from2: TNode = 'Moonriver';
      const to: TNode = 'Basilisk';
      const currency = { symbol: 'USDT', amount };
      const address = 'FagnR7YW9N2PZfxC3dwSqQjb59Jsz3x35UZ24MqtA4eTVZR';

      return request(app.getHttpServer())
        .post(xTransferBatchUrl)
        .send({
          transfers: [
            {
              from: from1,
              to,
              address,
              currency,
            },
            {
              from: from2, // Different 'from' node
              to,
              address,
              currency,
            },
          ],
          options: {
            mode: BatchMode.BATCH_ALL,
          },
        })
        .expect(400) // Expect Bad Request due to different 'from' nodes
        .expect((res) => {
          expect(res.body.message).toContain(
            'All transactions in the batch must have the same origin.',
          );
        });
    });

    it(`Generate Batch XCM call - Invalid Addresses - ${xTransferBatchUrl}`, async () => {
      const from: TNode = 'AssetHubKusama';
      const to: TNode = 'Basilisk';
      const currency = { symbol: 'USDT', amount };
      const invalidAddress = 'InvalidAddress123';

      return request(app.getHttpServer())
        .post(xTransferBatchUrl)
        .send({
          transfers: [
            {
              from,
              to,
              address: invalidAddress,
              currency,
            },
          ],
          options: {
            mode: BatchMode.BATCH_ALL,
          },
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Invalid wallet address.');
        });
    });

    it(`Generate Batch XCM call - Empty Transfers Array - ${xTransferBatchUrl}`, async () => {
      return request(app.getHttpServer())
        .post(xTransferBatchUrl)
        .send({
          transfers: [], // Empty transfers array
          options: {
            mode: BatchMode.BATCH_ALL,
          },
        })
        .expect(400) // Expect Bad Request due to empty transfers array
        .expect((res) => {
          expect(res.body.message).toContain(
            'Transfers array cannot be empty.',
          );
        });
    });

    it(`Generate Batch XCM call - Empty Transfers Array - ${xTransferBatchUrl}`, async () => {
      return request(app.getHttpServer())
        .post(xTransferBatchUrl)
        .send({
          transfers: [], // Empty transfers array
          options: {
            mode: BatchMode.BATCH_ALL,
          },
        })
        .expect(400) // Expect Bad Request due to empty transfers array
        .expect((res) => {
          expect(res.body.message).toContain(
            'Transfers array cannot be empty.',
          );
        });
    });

    it(`Generate Batch XCM call - Empty Transfers Array - ${xTransferBatchUrl}`, async () => {
      return request(app.getHttpServer())
        .post(xTransferBatchUrl)
        .send({
          transfers: [], // Empty transfers array
          options: {
            mode: BatchMode.BATCH_ALL,
          },
        })
        .expect(400) // Expect Bad Request due to empty transfers array
        .expect((res) => {
          expect(res.body.message).toContain(
            'Transfers array cannot be empty.',
          );
        });
    });

    it(`Generate Batch XCM call - Invalid Batch Mode - ${xTransferBatchUrl}`, async () => {
      const from: TNode = 'AssetHubKusama';
      const to: TNode = 'Basilisk';
      const currency = { symbol: 'USDT', amount };
      const address = 'FagnR7YW9N2PZfxC3dwSqQjb59Jsz3x35UZ24MqtA4eTVZR';
      const invalidBatchMode = 'INVALID_MODE';

      return request(app.getHttpServer())
        .post(xTransferBatchUrl)
        .send({
          transfers: [
            {
              from,
              to,
              address,
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
      const from: TNode = 'AssetHubKusama';
      const currency = { symbol: 'USDT' };

      return request(app.getHttpServer())
        .post(xTransferBatchUrl)
        .send({
          transfers: [
            {
              from,
              address,
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
      const from: TNode = 'AssetHubKusama';
      const to: TNode = 'Basilisk';
      const currency = { symbol: 'USDT', amount: '-1000' }; // Negative amount
      const address = 'FagnR7YW9N2PZfxC3dwSqQjb59Jsz3x35UZ24MqtA4eTVZR';

      return request(app.getHttpServer())
        .post(xTransferBatchUrl)
        .send({
          transfers: [
            {
              from,
              to,
              address,
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
      const from: TNode = 'AssetHubKusama';
      const to1: TNode = 'Basilisk';
      const to2: TNode = 'Moonriver';
      const currency = { symbol: 'USDT', amount };
      const address1 = 'FagnR7YW9N2PZfxC3dwSqQjb59Jsz3x35UZ24MqtA4eTVZR';
      const address2 = '0x1501C1413e4178c38567Ada8945A80351F7B8496';

      const builder = Builder()
        .from(from)
        .to(to1)
        .currency(currency)
        .address(address1)
        .addToBatch()
        .from(from)
        .to(to2)
        .currency(currency)
        .address(address2)
        .addToBatch();

      const tx = await builder.buildBatch({ mode: BatchMode.BATCH });

      return request(app.getHttpServer())
        .post(xTransferBatchUrl)
        .send({
          transfers: [
            {
              from,
              to: to1,
              address: address1,
              currency,
            },
            {
              from,
              to: to2,
              address: address2,
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
      const from: TNode = 'AssetHubKusama';
      const to: TNode = 'Basilisk';
      const currency = { symbol: 'USDT', amount: '1000' };

      const builder = Builder()
        .from(from)
        .to(to)
        .currency(currency)
        .address(address)
        .addToBatch();

      const tx = await builder.buildBatch({ mode: BatchMode.BATCH_ALL });

      return request(app.getHttpServer())
        .post(xTransferBatchUrl)
        .send({
          transfers: [
            {
              from,
              to,
              address,
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
      const from: TNode = 'AssetHubKusama';
      const to: TNode = 'Basilisk';
      const currency = { symbol: 'USDT', amount: '1000' };
      const xcmVersion = Version.V3;

      const builder = Builder()
        .from(from)
        .to(to)
        .currency(currency)
        .address(address)
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
              address,
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
      const from: TNode = 'Acala';

      const currency = {
        symbol: 'DOT',
        amount: '1000',
      };

      const builder = Builder()
        .from(from)
        .to('Polkadot')
        .currency(currency)
        .address(address)
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
              address,
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
      const to: TNode = 'Basilisk';

      const currency = {
        symbol: 'KSM',
        amount: '1000',
      };

      const builder = Builder()
        .from('Kusama')
        .to(to)
        .currency(currency)
        .address(address)
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
              address,
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
      const from: TNode = 'AssetHubKusama';
      const to: TNode = 'Basilisk';
      const currency = { symbol: 'USDT', amount };
      const tx = await Builder()
        .from(from)
        .to(to)
        .currency(currency)
        .address(address)
        .build();
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from,
          to,
          address,
          currency,
        })
        .expect(201)
        .expect((await tx.getEncodedData()).asHex());
    });

    it(`Generate XCM call - Parachain to parachain override currency - ${xTransferUrl}`, async () => {
      const from: TNode = 'AssetHubPolkadot';
      const to: TNode = 'Hydration';
      const currency: TMultiLocation = {
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
        .currency({ multilocation: Override(currency), amount })
        .address(address)
        .build();
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from,
          to,
          address,
          currency: { multilocation: Override(currency), amount },
        })
        .expect(201)
        .expect((await tx.getEncodedData()).asHex());
    });

    it(`Generate XCM call - Parachain to parachain custom xcm execute call - ${xTransferUrl}`, async () => {
      const from: TNode = 'AssetHubPolkadot';
      const to: TNode = 'Polimec';
      const currency: TCurrencyInputWithAmount = {
        symbol: 'USDC',
        amount: '1000000000',
      };
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from,
          to,
          address,
          currency,
          feeAsset: currency,
        })
        .expect(400);
    });

    it(`Generate XCM call - Parachain to parachain override currency as multi asset - ${xTransferUrl}`, async () => {
      const from: TNode = 'AssetHubKusama';
      const to: TNode = 'Basilisk';
      const createCurrency = (fungible: string | bigint): TMultiAsset[] => [
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
      const feeAsset: TMultiLocation = {
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
        .currency({ multiasset: createCurrency(1000000000n) })
        .feeAsset({
          multilocation: feeAsset,
        })
        .address(address)
        .build();
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from,
          to,
          address,
          currency: { multiasset: createCurrency('1000000000') },
          feeAsset: { multilocation: feeAsset },
        })
        .expect(201)
        .expect((await tx.getEncodedData()).asHex());
    });

    it(`Generate XCM call - Parachain to relaychain all valid - ${xTransferUrl}`, async () => {
      const currency = {
        symbol: 'KSM',
        amount,
      };

      const tx = await Builder()
        .from('AssetHubKusama')
        .to('Kusama')
        .currency(currency)
        .address(address)
        .build();
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from: 'AssetHubKusama',
          to: 'Kusama',
          currency,
          address,
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
        .address(address)
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
          address,
        })
        .expect(201)
        .expect((await tx.getEncodedData()).asHex());
    });

    it(`Generate XCM call - Parachain to relaychain all valid - ${xTransferUrl}`, async () => {
      const tx = await Builder()
        .from('AssetHubKusama')
        .to('Kusama')
        .currency({
          symbol: 'KSM',
          amount,
        })
        .address(address)
        .xcmVersion(Version.V3)
        .build();
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from: 'AssetHubKusama',
          to: 'Kusama',
          currency: {
            symbol: 'KSM',
            amount,
          },
          address,
          xcmVersion: Version.V3,
        })
        .expect(201)
        .expect((await tx.getEncodedData()).asHex());
    });

    it(`Generate XCM call - Dry run unsupported node - should throw error 400 - ${xTransferUrl}`, async () => {
      return request(app.getHttpServer())
        .post('/dry-run')
        .send({
          from: 'Acala',
          to: 'Astar',
          currency: {
            symbol: 'ACA',
            amount,
          },
          address,
          senderAddress: address,
        })
        .expect(400);
    });

    it(`Generate XCM call - Parachain to relaychain invalid version - ${xTransferUrl}`, async () => {
      const from: TNode = 'AssetHubKusama';
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from,
          to: 'Kusama',
          currency: {
            symbol: 'KSM',
            amount,
          },
          address,
          xcmVersion: 'V6',
        })
        .expect(400);
    });

    it(`Generate XCM call - Parachain to relaychain override pallet and method - ${xTransferUrl}`, async () => {
      const from: TNode = 'AssetHubKusama';
      const currency = {
        symbol: 'KSM',
        amount,
      };
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from,
          to: 'Kusama',
          currency,
          address,
          pallet: 'Balances',
          method: 'transfer',
        })
        .expect(500);
    });

    it(`Gets Ethereum bridge status`, async () => {
      return request(app.getHttpServer())
        .get('/x-transfer/eth-bridge-status')
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined();
        });
    });
  });

  describe('Router controller', () => {
    const routerUrl = '/router';

    const routerOptions: RouterDto = {
      from: 'Astar',
      exchange: 'HydrationDex',
      to: 'BifrostPolkadot',
      currencyFrom: { symbol: 'ASTR' },
      currencyTo: { symbol: 'BNC' },
      amount: '10000000000000000000',
      senderAddress: '5FNDaod3wYTvg48s73H1zSB3gVoKNg2okr6UsbyTuLutTXFz',
      recipientAddress: '5FNDaod3wYTvg48s73H1zSB3gVoKNg2okr6UsbyTuLutTXFz',
      slippagePct: '1',
    };

    it(`Generate router call - manual exchange select - ${routerUrl}`, async () => {
      return request(app.getHttpServer())
        .post(routerUrl)
        .send(routerOptions)
        .expect(201)
        .expect((res) => {
          const data = JSON.parse(res.text);
          expect(Array.isArray(data)).toBeTruthy();
          expect(data).toHaveLength(2);
          data.forEach((txInfo: any) => {
            expect(txInfo).toHaveProperty('tx');
            expect(txInfo).toHaveProperty('node');
            expect(txInfo).toHaveProperty('type');
            expect(txInfo.tx).toBeTypeOf('string');
          });
        });
    });

    it(`Generate router call - manual exchange select - ${routerUrl}`, async () => {
      return request(app.getHttpServer())
        .post(routerUrl)
        .send(routerOptions)
        .expect(201)
        .expect((res) => {
          const data = JSON.parse(res.text);
          expect(Array.isArray(data)).toBeTruthy();
          expect(data).toHaveLength(2);
          data.forEach((txInfo: any) => {
            expect(txInfo).toHaveProperty('tx');
            expect(txInfo).toHaveProperty('node');
            expect(txInfo).toHaveProperty('type');
            expect(txInfo.tx).toBeTypeOf('string');
          });
        });
    });

    it(`Generate router call - automatic exchange select - ${routerUrl}`, async () => {
      const automaticSelectOptions = {
        ...routerOptions,
        exchange: undefined,
      };

      return request(app.getHttpServer())
        .post(routerUrl)
        .send(automaticSelectOptions)
        .expect(201)
        .expect((res) => {
          const data = JSON.parse(res.text);
          expect(Array.isArray(data)).toBeTruthy();
          expect(data).toHaveLength(2);
          data.forEach((txInfo: any) => {
            expect(txInfo).toHaveProperty('tx');
            expect(txInfo).toHaveProperty('node');
            expect(txInfo).toHaveProperty('type');
            expect(txInfo.tx).toBeTypeOf('string');
          });
        });
    });

    it(`Generate router call - getBestAmountOut - ${routerUrl}`, async () => {
      const bestAmountOutOptions = {
        ...routerOptions,
      };

      return request(app.getHttpServer())
        .post(`${routerUrl}/best-amount-out`)
        .send(bestAmountOutOptions)
        .expect(201)
        .expect((res) => {
          const data = JSON.parse(res.text);
          expect(Array.isArray(data)).not.toBeTruthy();
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
          from: unknownNode,
          address,
        })
        .expect(400);
    });

    it('Generate asset claim call - invalid wallet address - /asset-claim', () => {
      return request(app.getHttpServer())
        .post('/asset-claim')
        .send({
          from: mockNode,
          address: 'InvalidWalletAddress',
        })
        .expect(400);
    });

    it('Generate asset claim call - all valid - /asset-claim', async () => {
      const from: TNode = 'AssetHubKusama';
      const fungible = [
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
        .fungible(fungible)
        .account(address)
        .build();
      return request(app.getHttpServer())
        .post('/asset-claim')
        .send({
          from,
          fungible,
          address,
        })
        .expect(201)
        .expect((await tx.getEncodedData()).asHex());
    });
  });

  describe('Transfer info controller', () => {
    const transferInfo: XTransferDto = {
      from: 'Acala',
      to: 'Astar',
      senderAddress: '5FNDaod3wYTvg48s73H1zSB3gVoKNg2okr6UsbyTuLutTXFz',
      address: '5FNDaod3wYTvg48s73H1zSB3gVoKNg2okr6UsbyTuLutTXFz',
      currency: { symbol: 'DOT', amount: '100000000' },
    };

    it('Generate transfer info call - invalid origin provided - /transfer-info', () => {
      return request(app.getHttpServer())
        .post('/transfer-info')
        .send({
          ...transferInfo,
          from: unknownNode,
        })
        .expect(400);
    });

    it('Generate transfer info call - invalid destination provided - /transfer-info', () => {
      return request(app.getHttpServer())
        .post('/transfer-info')
        .send({
          ...transferInfo,
          to: unknownNode,
        })
        .expect(400);
    });

    it('Generate transfer info call - invalid wallet address destination - /transfer-info', () => {
      return request(app.getHttpServer())
        .post('/transfer-info')
        .send({
          ...transferInfo,
          address: 'InvalidWalletAddress',
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
    it('Get MultiLocation paths - No multilocation or xcm provided - /xcm-analyser', () => {
      return request(app.getHttpServer()).post('/xcm-analyser').expect(400);
    });

    it('Get MultiLocation paths - Invalid multilocation provided - /xcm-analyser', () => {
      return request(app.getHttpServer())
        .post('/xcm-analyser')
        .send({
          multilocation: {
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

    it('Get MultiLocation paths - XCM without any multilocations provided - /xcm-analyser', () => {
      return request(app.getHttpServer())
        .post('/xcm-analyser')
        .send({
          xcm: ['0x123'],
        })
        .expect(201)
        .expect('[]');
    });

    it('Get MultiLocation paths - Valid MultiLocation - /xcm-analyser', () => {
      return request(app.getHttpServer())
        .post('/xcm-analyser')
        .send({
          multilocation: {
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

    it('Get MultiLocation paths - Valid XCM - /xcm-analyser', () => {
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
