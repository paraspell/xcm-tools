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
  NODE_NAMES,
  NODE_NAMES_DOT_KSM,
  Native,
  Override,
  TMultiAsset,
  TMultiLocation,
  TNode,
  Version,
  createApiInstanceForNode,
  getAllAssetsSymbols,
  getAssetsObject,
  getDefaultPallet,
  getNativeAssets,
  getOtherAssets,
  getParaId,
  getRelayChainSymbol,
  getSupportedPallets,
  hasSupportForAsset,
} from '@paraspell/sdk';
import { RouterDto } from '../src/router/dto/RouterDto';
import { describe, beforeAll, it, expect } from 'vitest';
import { TransferInfoDto } from '../src/transfer-info/dto/transfer-info.dto';
import { ExpressAdapter } from '@nestjs/platform-express';
import { replaceBigInt } from '../src/utils/replaceBigInt';

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
      (node) => node !== 'Peaq' && node !== 'Polkadex',
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
      const assetsObjectUrl = `/assets/${node}`;
      it(`Get assets object - ${assetsObjectUrl} (GET)`, () => {
        const assetsObject = getAssetsObject(node);
        return request(app.getHttpServer())
          .get(assetsObjectUrl)
          .expect(200)
          .expect(assetsObject);
      });

      const otherAssets = getOtherAssets(node);
      if (otherAssets.length > 0) {
        const { symbol, assetId, decimals } = otherAssets[0].assetId
          ? otherAssets[0]
          : otherAssets[1];
        const assetIdUrl = `/assets/${node}/id`;
        it(`Get asset id - ${assetIdUrl} (GET)`, () => {
          return request(app.getHttpServer())
            .get(assetIdUrl)
            .query({ symbol })
            .expect(200)
            .expect(assetId ?? '');
        });

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
    const xTransferHashUrl = '/x-transfer-hash';
    const xTransferBatchUrl = '/x-transfer-batch';
    const routerUrl = '/router';
    const routerHashUrl = '/router-hash';

    it(`Generate XCM call - No from or to provided - ${xTransferUrl} (GET)`, () => {
      return request(app.getHttpServer())
        .get(xTransferUrl)
        .query({
          amount,
          address,
        })
        .expect(400);
    });

    it(`Generate XCM call - Invalid from - ${xTransferUrl} (GET)`, () => {
      return request(app.getHttpServer())
        .get(xTransferUrl)
        .query({
          from: unknownNode,
          amount,
          address,
        })
        .expect(400);
    });

    it(`Generate XCM call - Invalid to - ${xTransferUrl} (GET)`, () => {
      return request(app.getHttpServer())
        .get(xTransferUrl)
        .query({
          to: unknownNode,
          amount,
          address,
        })
        .expect(400);
    });

    it(`Generate XCM call - Parachain to parachain missing currency - ${xTransferUrl} (GET)`, () => {
      return request(app.getHttpServer())
        .get(xTransferUrl)
        .query({
          from: 'Acala',
          to: 'Basilisk',
          amount,
          address,
        })
        .expect(400);
    });

    it(`Generate XCM call - Parachain to parachain invalid currency - ${xTransferUrl} (GET)`, () => {
      return request(app.getHttpServer())
        .get(xTransferUrl)
        .query({
          from: 'Acala',
          to: 'Basilisk',
          amount,
          address,
          currency: 'UknownSymbol',
        })
        .expect(400);
    });

    it(`Generate XCM call - Parachain to parachain all valid - ${xTransferUrl} (POST)`, async () => {
      const from: TNode = 'Acala';
      const to: TNode = 'Hydration';
      const currency = { symbol: 'HDX' };
      const api = await createApiInstanceForNode(from);
      const serializedApiCall = await Builder(api)
        .from(from)
        .to(to)
        .currency(currency)
        .amount(amount)
        .address(address)
        .buildSerializedApiCall();
      await api.disconnect();
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from,
          to,
          amount,
          address,
          currency,
        })
        .expect(201)
        .expect(serializedApiCall);
    });

    it(`Generate XCM call - Parachain to parachain Native() selector - ${xTransferUrl} (POST)`, async () => {
      const from: TNode = 'Acala';
      const to: TNode = 'Astar';
      const currency = { symbol: Native('DOT') };
      const api = await createApiInstanceForNode(from);
      const tx = await Builder(api)
        .from(from)
        .to(to)
        .currency(currency)
        .amount(amount)
        .address(address)
        .build();
      await api.disconnect();
      return request(app.getHttpServer())
        .post(xTransferHashUrl)
        .send({
          from,
          to,
          amount,
          address,
          currency,
        })
        .expect(201)
        .expect(JSON.stringify(tx.toHex()));
    });

    it(`Generate XCM call - Parachain to parachain Foreign() selector - ${xTransferUrl} (POST)`, async () => {
      const from: TNode = 'Astar';
      const to: TNode = 'Acala';
      const currency = { symbol: Foreign('HDX') };
      const api = await createApiInstanceForNode(from);
      const tx = await Builder(api)
        .from(from)
        .to(to)
        .currency(currency)
        .amount(amount)
        .address(address)
        .build();
      await api.disconnect();
      return request(app.getHttpServer())
        .post(xTransferHashUrl)
        .send({
          from,
          to,
          amount,
          address,
          currency,
        })
        .expect(201)
        .expect(JSON.stringify(tx.toHex()));
    });

    it(`Generate XCM call - Parachain to parachain invalid scenario - ${xTransferHashUrl} (POST)`, async () => {
      const from: TNode = 'AssetHubKusama';
      const to: TNode = 'Basilisk';
      const currency = { symbol: 'KSM' };
      return request(app.getHttpServer())
        .post(xTransferHashUrl)
        .send({
          from,
          to,
          amount,
          address,
          currency,
        })
        .expect(500);
    });

    it(`Generate Batch XCM call - Parachain to parachain all valid - ${xTransferBatchUrl} (POST)`, async () => {
      const from: TNode = 'AssetHubKusama';
      const to1: TNode = 'Basilisk';
      const to2: TNode = 'Moonriver';
      const currency = { symbol: 'USDT' };
      const amount1 = '1000';
      const amount2 = '2000';
      const address1 = 'FagnR7YW9N2PZfxC3dwSqQjb59Jsz3x35UZ24MqtA4eTVZR';
      const address2 = 'FagnR7YW9N2PZfxC3dwSqQjb59Jsz3x35UZ24MqtA4eTVZR';

      const builder = Builder()
        .from(from)
        .to(to1)
        .currency(currency)
        .amount(amount1)
        .address(address1)
        .addToBatch()
        .from(from)
        .to(to2)
        .currency(currency)
        .amount(amount2)
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
              amount: amount1,
              address: address1,
              currency,
            },
            {
              from,
              to: to2,
              amount: amount2,
              address: address2,
              currency,
            },
          ],
          options: {
            mode: BatchMode.BATCH_ALL,
          },
        })
        .expect(201)
        .expect(JSON.stringify(tx.toHex()));
    });

    it(`Generate Batch XCM call - Invalid Currency Symbol - ${xTransferBatchUrl} (POST)`, async () => {
      const from: TNode = 'AssetHubKusama';
      const to: TNode = 'Basilisk';
      const invalidCurrency = { symbol: 'INVALID' };
      const amount = '1000';
      const address = 'FagnR7YW9N2PZfxC3dwSqQjb59Jsz3x35UZ24MqtA4eTVZR';

      return request(app.getHttpServer())
        .post(xTransferBatchUrl)
        .send({
          transfers: [
            {
              from,
              to,
              amount,
              address,
              currency: invalidCurrency,
            },
          ],
          options: {
            mode: BatchMode.BATCH_ALL,
          },
        })
        .expect(400) // Expect Bad Request due to invalid currency
        .expect((res) => {
          expect(res.body.message).toContain('does not support currency');
        });
    });

    it(`Generate Batch XCM call - Different 'from' Nodes - ${xTransferBatchUrl} (POST)`, async () => {
      const from1: TNode = 'AssetHubKusama';
      const from2: TNode = 'Moonriver';
      const to: TNode = 'Basilisk';
      const currency = { symbol: 'USDT' };
      const amount = '1000';
      const address = 'FagnR7YW9N2PZfxC3dwSqQjb59Jsz3x35UZ24MqtA4eTVZR';

      return request(app.getHttpServer())
        .post(xTransferBatchUrl)
        .send({
          transfers: [
            {
              from: from1,
              to,
              amount,
              address,
              currency,
            },
            {
              from: from2, // Different 'from' node
              to,
              amount,
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
            'All transactions must have the same origin.',
          );
        });
    });

    it(`Generate Batch XCM call - Invalid Addresses - ${xTransferBatchUrl} (POST)`, async () => {
      const from: TNode = 'AssetHubKusama';
      const to: TNode = 'Basilisk';
      const currency = { symbol: 'USDT' };
      const amount = '1000';
      const invalidAddress = 'InvalidAddress123';

      return request(app.getHttpServer())
        .post(xTransferBatchUrl)
        .send({
          transfers: [
            {
              from,
              to,
              amount,
              address: invalidAddress, // Invalid address
              currency,
            },
          ],
          options: {
            mode: BatchMode.BATCH_ALL,
          },
        })
        .expect(400) // Expect Bad Request due to invalid address
        .expect((res) => {
          expect(res.body.message).toContain('Invalid wallet address.');
        });
    });

    it(`Generate Batch XCM call - Empty Transfers Array - ${xTransferBatchUrl} (POST)`, async () => {
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

    it(`Generate Batch XCM call - Empty Transfers Array - ${xTransferBatchUrl} (POST)`, async () => {
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

    it(`Generate Batch XCM call - Empty Transfers Array - ${xTransferBatchUrl} (POST)`, async () => {
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

    it(`Generate Batch XCM call - Invalid Batch Mode - ${xTransferBatchUrl} (POST)`, async () => {
      const from: TNode = 'AssetHubKusama';
      const to: TNode = 'Basilisk';
      const currency = { symbol: 'USDT' };
      const amount = '1000';
      const address = 'FagnR7YW9N2PZfxC3dwSqQjb59Jsz3x35UZ24MqtA4eTVZR';
      const invalidBatchMode = 'INVALID_MODE';

      return request(app.getHttpServer())
        .post(xTransferBatchUrl)
        .send({
          transfers: [
            {
              from,
              to,
              amount,
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

    it(`Generate Batch XCM call - Missing Required Fields - ${xTransferBatchUrl} (POST)`, async () => {
      const from: TNode = 'AssetHubKusama';
      const currency = { symbol: 'USDT' };

      return request(app.getHttpServer())
        .post(xTransferBatchUrl)
        .send({
          transfers: [
            {
              from,
              // Missing 'amount' field
              address,
              currency,
            },
          ],
          options: {
            mode: BatchMode.BATCH_ALL,
          },
        })
        .expect(400); // Expect Bad Request due to missing required field
    });

    it(`Generate Batch XCM call - Zero or Negative Amounts - ${xTransferBatchUrl} (POST)`, async () => {
      const from: TNode = 'AssetHubKusama';
      const to: TNode = 'Basilisk';
      const currency = { symbol: 'USDT' };
      const invalidAmount = '-1000'; // Negative amount
      const address = 'FagnR7YW9N2PZfxC3dwSqQjb59Jsz3x35UZ24MqtA4eTVZR';

      return request(app.getHttpServer())
        .post(xTransferBatchUrl)
        .send({
          transfers: [
            {
              from,
              to,
              amount: invalidAmount,
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

    it(`Generate Batch XCM call - Batch Mode 'BATCH' - ${xTransferBatchUrl} (POST)`, async () => {
      const from: TNode = 'AssetHubKusama';
      const to1: TNode = 'Basilisk';
      const to2: TNode = 'Moonriver';
      const currency = { symbol: 'USDT' };
      const amount1 = '1000';
      const amount2 = '2000';
      const address1 = 'FagnR7YW9N2PZfxC3dwSqQjb59Jsz3x35UZ24MqtA4eTVZR';
      const address2 = 'FagnR7YW9N2PZfxC3dwSqQjb59Jsz3x35UZ24MqtA4eTVZR';

      const builder = Builder()
        .from(from)
        .to(to1)
        .currency(currency)
        .amount(amount1)
        .address(address1)
        .addToBatch()
        .from(from)
        .to(to2)
        .currency(currency)
        .amount(amount2)
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
              amount: amount1,
              address: address1,
              currency,
            },
            {
              from,
              to: to2,
              amount: amount2,
              address: address2,
              currency,
            },
          ],
          options: {
            mode: BatchMode.BATCH,
          },
        })
        .expect(201)
        .expect(JSON.stringify(tx.toHex()));
    });

    it(`Generate Batch XCM call - Single Transfer in Batch - ${xTransferBatchUrl} (POST)`, async () => {
      const from: TNode = 'AssetHubKusama';
      const to: TNode = 'Basilisk';
      const currency = { symbol: 'USDT' };
      const amount = '1000';

      const builder = Builder()
        .from(from)
        .to(to)
        .currency(currency)
        .amount(amount)
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
              amount,
              address,
              currency,
            },
          ],
          options: {
            mode: BatchMode.BATCH_ALL,
          },
        })
        .expect(201)
        .expect(JSON.stringify(tx.toHex()));
    });

    it(`Generate Batch XCM call - Specifying XCM Version - ${xTransferBatchUrl} (POST)`, async () => {
      const from: TNode = 'AssetHubKusama';
      const to: TNode = 'Basilisk';
      const currency = { symbol: 'USDT' };
      const amount = '1000';
      const xcmVersion = Version.V2;

      const builder = Builder()
        .from(from)
        .to(to)
        .currency(currency)
        .amount(amount)
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
              amount,
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
        .expect(JSON.stringify(tx.toHex()));
    });

    it(`Generate Batch XCM call - Parachain to Relay Chain - ${xTransferBatchUrl} (POST)`, async () => {
      const from: TNode = 'Acala';
      const amount = '1000';

      const builder = Builder()
        .from(from)
        .amount(amount)
        .address(address)
        .addToBatch();

      const tx = await builder.buildBatch({ mode: BatchMode.BATCH_ALL });

      return request(app.getHttpServer())
        .post(xTransferBatchUrl)
        .send({
          transfers: [
            {
              from,
              amount,
              address,
            },
          ],
          options: {
            mode: BatchMode.BATCH_ALL,
          },
        })
        .expect(201)
        .expect(JSON.stringify(tx.toHex()));
    });

    it(`Generate Batch XCM call - Relay Chain to Parachain - ${xTransferBatchUrl} (POST)`, async () => {
      const to: TNode = 'Basilisk';
      const amount = '1000';

      const builder = Builder()
        .to(to)
        .amount(amount)
        .address(address)
        .addToBatch();

      const tx = await builder.buildBatch({ mode: BatchMode.BATCH_ALL });

      return request(app.getHttpServer())
        .post(xTransferBatchUrl)
        .send({
          transfers: [
            {
              to,
              amount,
              address,
            },
          ],
          options: {
            mode: BatchMode.BATCH_ALL,
          },
        })
        .expect(201)
        .expect(JSON.stringify(tx.toHex()));
    });

    it(`Generate XCM call - Parachain to parachain all valid - ${xTransferHashUrl} (POST)`, async () => {
      const from: TNode = 'AssetHubKusama';
      const to: TNode = 'Basilisk';
      const currency = { symbol: 'USDT' };
      const api = await createApiInstanceForNode(from);
      const tx = await Builder(api)
        .from(from)
        .to(to)
        .currency(currency)
        .amount(amount)
        .address(address)
        .build();
      await api.disconnect();
      return request(app.getHttpServer())
        .post(xTransferHashUrl)
        .send({
          from,
          to,
          amount,
          address,
          currency,
        })
        .expect(201)
        .expect(JSON.stringify(tx.toHex()));
    });

    it(`Generate XCM call - Parachain to parachain override currency - ${xTransferUrl} (GET)`, async () => {
      const from: TNode = 'Karura';
      const to: TNode = 'Basilisk';
      const currency: TMultiLocation = {
        parents: '0',
        interior: {
          X1: {
            Parachain: '2000',
          },
        },
      };
      const api = await createApiInstanceForNode(from);
      const serializedApiCall = await Builder(api)
        .from(from)
        .to(to)
        .currency({ multilocation: Override(currency) })
        .amount(amount)
        .address(address)
        .buildSerializedApiCall();
      await api.disconnect();
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from,
          to,
          amount,
          address,
          currency: { multilocation: Override(currency) },
        })
        .expect(201)
        .expect(serializedApiCall);
    });

    it(`Generate XCM call - Parachain to parachain override currency as multi asset - ${xTransferUrl} (POST)`, async () => {
      const from: TNode = 'AssetHubPolkadot';
      const to: TNode = 'Acala';
      const currency: TMultiAsset = {
        id: {
          Concrete: {
            parents: 0,
            interior: {
              X1: {
                Parachain: '2000',
              },
            },
          },
        },
        fun: {
          Fungible: '1000000000',
        },
      };
      const api = await createApiInstanceForNode(from);
      const serializedApiCall = await Builder(api)
        .from(from)
        .to(to)
        .currency({ multiasset: [currency] })
        .amount(amount)
        .address(address)
        .buildSerializedApiCall();
      await api.disconnect();
      return request(app.getHttpServer())
        .post(xTransferUrl)
        .send({
          from,
          to,
          amount,
          address,
          currency: { multiasset: [currency] },
        })
        .expect(201)
        .expect(serializedApiCall);
    });

    it(`Generate XCM call - Parachain to relaychain all valid - ${xTransferUrl} (GET)`, async () => {
      const from: TNode = 'AssetHubKusama';
      const api = await createApiInstanceForNode(from);
      const serializedApiCall = await Builder(api)
        .from(from)
        .amount(amount)
        .address(address)
        .buildSerializedApiCall();
      await api.disconnect();
      return request(app.getHttpServer())
        .get(xTransferUrl)
        .query({
          from,
          amount,
          address,
        })
        .expect(200)
        .expect(serializedApiCall);
    });

    it(`Generate XCM call - Relaychain to parachain all valid - ${xTransferUrl} (GET)`, async () => {
      const to: TNode = 'AssetHubKusama';
      const api = await createApiInstanceForNode(to);
      const serializedApiCall = await Builder(api)
        .to(to)
        .amount(amount)
        .address(address)
        .buildSerializedApiCall();
      await api.disconnect();
      return request(app.getHttpServer())
        .get(xTransferUrl)
        .query({
          to,
          amount,
          address,
        })
        .expect(200)
        .expect(serializedApiCall);
    });

    it(`Generate XCM call - Parachain to relaychain all valid - ${xTransferUrl} (GET)`, async () => {
      const from: TNode = 'AssetHubKusama';
      const api = await createApiInstanceForNode(from);
      const serializedApiCall = await Builder(api)
        .from(from)
        .amount(amount)
        .address(address)
        .xcmVersion(Version.V3)
        .buildSerializedApiCall();
      await api.disconnect();
      return request(app.getHttpServer())
        .get(xTransferUrl)
        .query({
          from,
          amount,
          address,
          xcmVersion: Version.V3,
        })
        .expect(200)
        .expect(serializedApiCall);
    });

    it(`Generate XCM call - Parachain to relaychain invalid version - ${xTransferUrl} (GET)`, async () => {
      const from: TNode = 'AssetHubKusama';
      return request(app.getHttpServer())
        .get(xTransferUrl)
        .query({
          from,
          amount,
          address,
          xcmVersion: 'V6',
        })
        .expect(400);
    });

    describe('Router controller', () => {
      const routerOptions: RouterDto = {
        from: 'Astar',
        exchange: 'HydrationDex',
        to: 'BifrostPolkadot',
        currencyFrom: { symbol: 'ASTR' },
        currencyTo: { symbol: 'BNC' },
        amount: '10000000000000000000',
        injectorAddress: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
        recipientAddress: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
        slippagePct: '1',
      };

      it(`Generate router call - manual exchange select - ${routerUrl} (GET)`, async () => {
        return request(app.getHttpServer())
          .get(routerUrl)
          .query(routerOptions)
          .expect(200)
          .expect((res) => {
            const data = JSON.parse(res.text);
            expect(Array.isArray(data)).toBeTruthy();
            expect(data).toHaveLength(3);
            data.forEach((txInfo: any) => {
              expect(txInfo).toHaveProperty('tx');
              expect(txInfo).toHaveProperty('node');
              expect(txInfo).toHaveProperty('type');
              expect(txInfo).toHaveProperty('statusType');
              expect(txInfo.tx).toBeTypeOf('object');
            });
          });
      });

      it(`Generate router call - manual exchange select - ${routerHashUrl} (POST)`, async () => {
        return request(app.getHttpServer())
          .post(routerHashUrl)
          .send(routerOptions)
          .expect(201)
          .expect((res) => {
            const data = JSON.parse(res.text);
            expect(Array.isArray(data)).toBeTruthy();
            expect(data).toHaveLength(3);
            data.forEach((txInfo: any) => {
              expect(txInfo).toHaveProperty('tx');
              expect(txInfo).toHaveProperty('node');
              expect(txInfo).toHaveProperty('type');
              expect(txInfo).toHaveProperty('statusType');
              expect(txInfo.tx).toBeTypeOf('string');
            });
          });
      });

      it(`Generate router call - automatic exchange select - ${routerUrl} (GET)`, async () => {
        const automaticSelectOptions = {
          ...routerOptions,
          exchange: undefined,
        };

        return request(app.getHttpServer())
          .get(routerUrl)
          .query(automaticSelectOptions)
          .expect(200)
          .expect((res) => {
            const data = JSON.parse(res.text);
            expect(Array.isArray(data)).toBeTruthy();
            expect(data).toHaveLength(3);
            data.forEach((txInfo: any) => {
              expect(txInfo).toHaveProperty('tx');
              expect(txInfo).toHaveProperty('node');
              expect(txInfo).toHaveProperty('type');
              expect(txInfo).toHaveProperty('statusType');
              expect(txInfo.tx).toBeTypeOf('object');
            });
          });
      });
    });

    describe('Asset claim controller', () => {
      it('Generate asset claim call - no from provided - /asset-claim (GET)', () => {
        return request(app.getHttpServer())
          .post('/asset-claim')
          .send({
            address,
          })
          .expect(400);
      });

      it('Generate asset claim call - invalid from provided - /asset-claim (GET)', () => {
        return request(app.getHttpServer())
          .post('/asset-claim')
          .send({
            from: unknownNode,
            address,
          })
          .expect(400);
      });

      it('Generate asset claim call - invalid wallet address - /asset-claim (GET)', () => {
        return request(app.getHttpServer())
          .post('/asset-claim')
          .send({
            from: mockNode,
            address: 'InvalidWalletAddress',
          })
          .expect(400);
      });

      it('Generate asset claim call - all valid - /asset-claim (GET)', async () => {
        const from: TNode = 'AssetHubKusama';
        const api = await createApiInstanceForNode(from);
        const fungible = [
          {
            id: {
              Concrete: {
                parents: 0,
                interior: {
                  X1: {
                    Parachain: '2000',
                  },
                },
              },
            },
            fun: {
              Fungible: '1000000000',
            },
          },
        ];
        const serializedApiCall = await Builder(api)
          .claimFrom(from)
          .fungible(fungible)
          .account(address)
          .buildSerializedApiCall();
        await api.disconnect();
        return request(app.getHttpServer())
          .post('/asset-claim')
          .send({
            from,
            fungible,
            address,
          })
          .expect(201)
          .expect(serializedApiCall);
      });

      it('Generate asset claim call - all valid - /asset-claim-hash (GET)', async () => {
        const from: TNode = 'AssetHubKusama';
        const api = await createApiInstanceForNode(from);
        const fungible = [
          {
            id: {
              Concrete: {
                parents: 0,
                interior: {
                  X1: {
                    Parachain: '2000',
                  },
                },
              },
            },
            fun: {
              Fungible: '1000000000',
            },
          },
        ];
        const tx = await Builder(api)
          .claimFrom(from)
          .fungible(fungible)
          .account(address)
          .build();
        await api.disconnect();
        return request(app.getHttpServer())
          .post('/asset-claim-hash')
          .send({
            from,
            fungible,
            address,
          })
          .expect(201)
          .expect(JSON.stringify(tx.toHex()));
      });
    });

    describe('Transfer info controller', () => {
      const transferInfo: TransferInfoDto = {
        origin: 'Acala',
        destination: 'Astar',
        accountOrigin: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
        accountDestination: '5F5586mfsnM6durWRLptYt3jSUs55KEmahdodQ5tQMr9iY96',
        currency: { symbol: 'DOT' },
        amount: '100000000',
      };

      it('Generate transfer info call - invalid origin provided - /transfer-info (POST)', () => {
        return request(app.getHttpServer())
          .post('/transfer-info')
          .send({
            ...transferInfo,
            origin: unknownNode,
          })
          .expect(400);
      });

      it('Generate transfer info call - invalid destination provided - /transfer-info (POST)', () => {
        return request(app.getHttpServer())
          .post('/transfer-info')
          .send({
            ...transferInfo,
            destination: unknownNode,
          })
          .expect(400);
      });

      it('Generate transfer info call - invalid wallet address origin - /transfer-info (POST)', () => {
        return request(app.getHttpServer())
          .post('/transfer-info')
          .send({
            ...transferInfo,
            accountOrigin: 'InvalidWalletAddress',
          })
          .expect(400);
      });

      it('Generate transfer info call - invalid wallet address destination - /transfer-info (POST)', () => {
        return request(app.getHttpServer())
          .post('/transfer-info')
          .send({
            ...transferInfo,
            accountDestination: 'InvalidWalletAddress',
          })
          .expect(400);
      });

      it('Generate transfer info call - all valid - /transfer-info (POST)', async () => {
        return request(app.getHttpServer())
          .post('/transfer-info')
          .send(transferInfo)
          .expect(201);
      });
    });

    describe('XCM Analyser controller', () => {
      it('Get MultiLocation paths - No multilocation or xcm provided - /xcm-analyser (POST)', () => {
        return request(app.getHttpServer()).post('/xcm-analyser').expect(400);
      });

      it('Get MultiLocation paths - Invalid multilocation provided - /xcm-analyser (POST)', () => {
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

      it('Get MultiLocation paths - XCM without any multilocations provided - /xcm-analyser (POST)', () => {
        return request(app.getHttpServer())
          .post('/xcm-analyser')
          .send({
            xcm: ['0x123'],
          })
          .expect(201)
          .expect('[]');
      });

      it('Get MultiLocation paths - Valid MultiLocation - /xcm-analyser (POST)', () => {
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

      it('Get MultiLocation paths - Valid XCM - /xcm-analyser (POST)', () => {
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
});
