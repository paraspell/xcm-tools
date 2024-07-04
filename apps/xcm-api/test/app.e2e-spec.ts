import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import {
  Builder,
  NODE_NAMES,
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
  getTransferInfo,
  hasSupportForAsset,
} from '@paraspell/sdk';
import { ApiPromise } from '@polkadot/api';
import { RouterDto } from '../src/router/dto/RouterDto';
import { describe, beforeAll, it, expect } from 'vitest';
import { TransferInfoDto } from '../src/transfer-info/dto/transfer-info.dto';

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
    await app.init();
  });

  describe('Pallets controller', () => {
    NODE_NAMES.forEach((node) => {
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

  describe('Channels controller', () => {
    const maxSize = '8';
    const maxMessageSize = '1024';
    const inbound = '0';
    const outbound = '0';

    const channelsUrl = '/hrmp/channels';

    NODE_NAMES.forEach((node) => {
      it(`Open channel ${node} -> ${mockNode} - ${channelsUrl} (POST)`, () => {
        const serializedApiCall = Builder(null as unknown as ApiPromise)
          .from(node)
          .to(mockNode)
          .openChannel()
          .maxSize(Number(maxSize))
          .maxMessageSize(Number(maxMessageSize))
          .buildSerializedApiCall();

        return request(app.getHttpServer())
          .post(channelsUrl)
          .query({
            from: node,
            to: mockNode,
            maxSize,
            maxMessageSize,
          })
          .expect(201)
          .expect(serializedApiCall);
      });

      it(`Open channel ${mockNode} -> ${node} - ${channelsUrl} (POST)`, () => {
        const serializedApiCall = Builder(null as unknown as ApiPromise)
          .from(node)
          .to(mockNode)
          .openChannel()
          .maxSize(Number(maxSize))
          .maxMessageSize(Number(maxMessageSize))
          .buildSerializedApiCall();

        return request(app.getHttpServer())
          .post(channelsUrl)
          .query({
            from: node,
            to: mockNode,
            maxSize,
            maxMessageSize,
          })
          .expect(201)
          .expect(serializedApiCall);
      });

      it(`Close channel ${node} - ${channelsUrl} (DELETE)`, () => {
        const serializedApiCall = Builder(null as unknown as ApiPromise)
          .from(node)
          .closeChannel()
          .inbound(Number(inbound))
          .outbound(Number(outbound))
          .buildSerializedApiCall();

        return request(app.getHttpServer())
          .delete(channelsUrl)
          .query({
            from: node,
            inbound,
            outbound,
          })
          .expect(200)
          .expect(serializedApiCall);
      });
    });

    it(`Open channel - ${unknownNode} from - ${channelsUrl} (POST)`, () => {
      return request(app.getHttpServer())
        .post(channelsUrl)
        .query({
          from: unknownNode,
          to: mockNode,
          maxSize,
          maxMessageSize,
        })
        .expect(400);
    });

    it(`Open channel - ${unknownNode} to - ${channelsUrl} (POST)`, () => {
      return request(app.getHttpServer())
        .post(channelsUrl)
        .query({
          from: mockNode,
          to: unknownNode,
          maxSize,
          maxMessageSize,
        })
        .expect(400);
    });

    it(`Close channel - ${unknownNode} - ${channelsUrl} (DELETE)`, () => {
      return request(app.getHttpServer())
        .delete(channelsUrl)
        .query({
          from: unknownNode,
          inbound,
          outbound,
        })
        .expect(400);
    });
  });

  describe('Assets controller', () => {
    const unknownSymbol = 'UnknownSymbol';

    const nodeNamesUrl = '/assets';
    it(`Get node names - ${nodeNamesUrl} (GFT)`, () => {
      return request(app.getHttpServer())
        .get(nodeNamesUrl)
        .expect(200)
        .expect(NODE_NAMES);
    });

    NODE_NAMES.forEach((node) => {
      const assetsObjectUrl = `/assets/${node}`;
      it(`Get assets object - ${assetsObjectUrl} (GFT)`, () => {
        const assetsObject = getAssetsObject(node);
        return request(app.getHttpServer())
          .get(assetsObjectUrl)
          .expect(200)
          .expect(assetsObject);
      });

      const otherAssets = getOtherAssets(node);
      if (otherAssets.length > 0) {
        const { symbol, assetId, decimals } = otherAssets[0];
        const assetIdUrl = `/assets/${node}/id`;
        it(`Get asset id - ${assetIdUrl} (GET)`, () => {
          return request(app.getHttpServer())
            .get(assetIdUrl)
            .query({ symbol })
            .expect(200)
            .expect(assetId);
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
      it(`Get native assets - ${nativeAssetsUrl} (GFT)`, () => {
        const nativeAssets = getNativeAssets(node);
        return request(app.getHttpServer())
          .get(nativeAssetsUrl)
          .expect(200)
          .expect(nativeAssets);
      });

      const otherAssetsUrl = `/assets/${node}/other`;
      it(`Get other assets - ${otherAssetsUrl} (GFT)`, () => {
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

      const parachainIdUrl = `/assets/${node}/para-id`;
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

    const parachainIdUnknownNodeUrl = `/assets/${unknownNode}/para-id `;
    it(`Get parachain id - ${parachainIdUnknownNodeUrl} (GET)`, () => {
      return request(app.getHttpServer())
        .get(parachainIdUnknownNodeUrl)
        .expect(400);
    });
  });

  describe('X-Transfer controller', () => {
    const amount = '1000000000';
    const address = 'FagnR7YW9N2PZfxC3dwSqQjb59Jsz3x35UZ24MqtA4eTVZR';
    const xTransferUrl = '/x-transfer';
    const routerUrl = '/router';

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

    it(`Generate XCM call - Parachain to parachain all valid - ${xTransferUrl} (GET)`, async () => {
      const from: TNode = 'AssetHubKusama';
      const to: TNode = 'Basilisk';
      const currency = 'KSM';
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
        .get(xTransferUrl)
        .query({
          from,
          to,
          amount,
          address,
          currency,
        })
        .expect(200)
        .expect(serializedApiCall);
    });

    it(`Generate XCM call - Parachain to parachain override currency - ${xTransferUrl} (GET)`, async () => {
      const from: TNode = 'AssetHubKusama';
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

    it(`Generate XCM call - Parachain to parachain override currency as multi asset - ${xTransferUrl} (GET)`, async () => {
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
        .currency([currency])
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
          currency: [currency],
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
        to: 'Moonbeam',
        currencyFrom: 'ASTR',
        currencyTo: 'GLMR',
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
            expect(data).toHaveProperty('txs');
            expect(data).toHaveProperty('exchangeNode');
            expect(Array.isArray(data.txs)).toBeTruthy();
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
            expect(data).toHaveProperty('txs');
            expect(data).toHaveProperty('exchangeNode');
            expect(Array.isArray(data.txs)).toBeTruthy();
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
    });

    describe('Transfer info controller', () => {
      const transferInfo: TransferInfoDto = {
        origin: 'AssetHubPolkadot',
        destination: 'Polkadot',
        accountOrigin: '5EtHZF4E8QagNCz6naobCkCAUT52SbcEqaXiDUu2PjUHxZid',
        accountDestination: '5EtHZF4E8QagNCz6naobCkCAUT52SbcEqaXiDUu2PjUHxZid',
        currency: 'DOT',
        amount: '10000',
      };

      it('Generate transfer info call - invalid origin provided - /transfer-info (GET)', () => {
        return request(app.getHttpServer())
          .get('/transfer-info')
          .query({
            ...transferInfo,
            origin: unknownNode,
          })
          .expect(400);
      });

      it('Generate transfer info call - invalid destination provided - /transfer-info (GET)', () => {
        return request(app.getHttpServer())
          .get('/transfer-info')
          .query({
            ...transferInfo,
            destination: unknownNode,
          })
          .expect(400);
      });

      it('Generate transfer info call - invalid wallet address origin - /transfer-info (GET)', () => {
        return request(app.getHttpServer())
          .get('/transfer-info')
          .query({
            ...transferInfo,
            accountOrigin: 'InvalidWalletAddress',
          })
          .expect(400);
      });

      it('Generate transfer info call - invalid wallet address destination - /transfer-info (GET)', () => {
        return request(app.getHttpServer())
          .get('/transfer-info')
          .query({
            ...transferInfo,
            accountDestination: 'InvalidWalletAddress',
          })
          .expect(400);
      });

      it('Generate transfer info call - all valid - /transfer-info (GET)', async () => {
        return request(app.getHttpServer())
          .get('/transfer-info')
          .query(transferInfo)
          .expect(200);
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
