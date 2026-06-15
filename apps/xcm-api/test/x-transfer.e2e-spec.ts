import { INestApplication } from '@nestjs/common';
import {
  BatchMode,
  Builder,
  Foreign,
  getChainProviders,
  Native,
  TChain,
  TCurrencyInputWithAmount,
  Version,
} from '@paraspell/sdk';
import { toHex } from 'polkadot-api/utils';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp } from './helpers/app';
import {
  AMOUNT,
  EVM_RECIPIENT,
  RECIPIENT,
  SENDER,
  UNKNOWN_CHAIN,
} from './helpers/fixtures';

describe('X-Transfer controller (e2e)', () => {
  let app: INestApplication;

  const amount = AMOUNT;
  const recipient = RECIPIENT;
  const sender = SENDER;
  const xTransferUrl = '/x-transfer';
  const xTransfersUrl = '/x-transfers';
  const xTransferBatchUrl = '/x-transfer-batch';

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

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
        from: UNKNOWN_CHAIN,
        recipient,
      })
      .expect(400);
  });

  it(`Generate XCM call - Invalid to - ${xTransferUrl}`, () => {
    return request(app.getHttpServer())
      .post(xTransferUrl)
      .send({
        to: UNKNOWN_CHAIN,
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
      .expect(toHex(await tx.getEncodedData()));
  });

  it(`Generate XCM call - Parachain to parachain Foreign() selector - ${xTransferUrl}`, async () => {
    const from: TChain = 'Astar';
    const to: TChain = 'Acala';
    const currency = { symbol: Foreign('HDX'), amount: 1000 };
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
      .expect(toHex(await tx.getEncodedData()));
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
    const address1 = RECIPIENT;
    const address2 = EVM_RECIPIENT;

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
      .expect(toHex(await tx.getEncodedData()));
  });

  it(`Generate Batch XCM call - Invalid Currency Symbol - ${xTransferBatchUrl}`, async () => {
    const from: TChain = 'AssetHubKusama';
    const to: TChain = 'Basilisk';
    const invalidCurrency = { symbol: 'INVALID', amount };

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
        expect(res.body.message).toContain('Transfers array cannot be empty.');
      });
  });

  it(`Generate Batch XCM call - Invalid Batch Mode - ${xTransferBatchUrl}`, async () => {
    const from: TChain = 'AssetHubKusama';
    const to: TChain = 'Basilisk';
    const currency = { symbol: 'USDT', amount };
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
    const recipient1 = RECIPIENT;
    const recipient2 = EVM_RECIPIENT;

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
      .expect(toHex(await tx.getEncodedData()));
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
      .expect(toHex(await tx.getEncodedData()));
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
      .expect(toHex(await tx.getEncodedData()));
  });

  it(`Generate Batch XCM call - Parachain to Relay Chain - ${xTransferBatchUrl}`, async () => {
    const from: TChain = 'Acala';

    const currency = {
      symbol: 'DOT',
      amount: '100',
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
      .expect(toHex(await tx.getEncodedData()));
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
      .expect(toHex(await tx.getEncodedData()));
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
      .expect(toHex(await tx.getEncodedData()));
  });

  it(`Generate XCM call - Parachain to parachain transfer with a custom asset - ${xTransferUrl}`, async () => {
    const from: TChain = 'Hydration';
    const to: TChain = 'AssetHubPolkadot';
    const customAsset = {
      symbol: 'CUSTX',
      decimals: 6,
      assetId: '80003',
      location: {
        parents: 1,
        interior: {
          X3: [
            { Parachain: 1000 },
            { PalletInstance: 50 },
            { GeneralIndex: 80003 },
          ],
        },
      },
    };
    const options = {
      customAssets: { [from]: [customAsset] },
    };
    const currency: TCurrencyInputWithAmount = { symbol: 'CUSTX', amount };
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
      .expect(toHex(await tx.getEncodedData()));
  });

  it(`Generate XCM call - Parachain to parachain custom xcm execute call - ${xTransferUrl}`, async () => {
    const from: TChain = 'AssetHubPolkadot';
    const to: TChain = 'Hydration';
    const currency: TCurrencyInputWithAmount = {
      symbol: 'USDC',
      amount: '1000',
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

  it(`Generate XCM call - Parachain to parachain transfer with multiple custom assets - ${xTransferUrl}`, async () => {
    const from: TChain = 'AssetHubPolkadot';
    const to: TChain = 'BifrostPolkadot';
    const customAssets = [
      {
        symbol: 'CUSTA',
        decimals: 6,
        assetId: '80001',
        location: {
          parents: 1,
          interior: {
            X3: [
              { Parachain: 1000 },
              { PalletInstance: 50 },
              { GeneralIndex: 80001 },
            ],
          },
        },
      },
      {
        symbol: 'CUSTB',
        decimals: 6,
        assetId: '80002',
        location: {
          parents: 1,
          interior: {
            X3: [
              { Parachain: 1000 },
              { PalletInstance: 50 },
              { GeneralIndex: 80002 },
            ],
          },
        },
      },
    ];
    const options = { customAssets: { [from]: customAssets } };
    const currency: TCurrencyInputWithAmount = [
      { symbol: 'CUSTA', amount: '1000000000' },
      { symbol: 'CUSTB', amount: '1000000000' },
    ];
    const feeAsset = { symbol: 'CUSTB' };
    const tx = await Builder(options)
      .from(from)
      .to(to)
      .currency(currency)
      .feeAsset(feeAsset)
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
        feeAsset,
        options,
      })
      .expect(201)
      .expect(toHex(await tx.getEncodedData()));
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
      .expect(toHex(await tx.getEncodedData()));
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
      .expect(toHex(await tx.getEncodedData()));
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
      .expect(toHex(await tx.getEncodedData()));
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

  it('Dry run - valid supported route - /dry-run', async () => {
    return request(app.getHttpServer())
      .post('/dry-run')
      .send({
        from: 'Hydration',
        to: 'AssetHubPolkadot',
        sender,
        recipient,
        currency: {
          symbol: 'DOT',
          amount: '100',
        },
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toBeDefined();
      });
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
          amount: '100',
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
          amount: '100',
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
          amount: '1000',
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
          amount: '1000',
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
          amount: '1000',
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
          amount: '1000',
        },
      })
      .expect(500);
  });

  it('Get best amount out - valid payload with swap options - /best-amount-out', () => {
    return request(app.getHttpServer())
      .post('/best-amount-out')
      .send({
        from: 'Astar',
        to: 'BifrostPolkadot',
        sender,
        recipient,
        currency: {
          symbol: { type: 'Native', value: 'ASTR' },
          amount: '1000',
        },
        swapOptions: {
          currencyTo: { symbol: 'DOT' },
          exchange: 'Hydration',
          slippage: 1,
        },
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toBeDefined();
      });
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
          amount: '100',
        },
        options: {
          mintFeeAssets: 'true',
        },
      })
      .expect(400);
  });

  it('Dry run preview - valid payload - /dry-run-preview', () => {
    return request(app.getHttpServer())
      .post('/dry-run-preview')
      .send({
        from: 'Hydration',
        to: 'AssetHubPolkadot',
        sender,
        recipient,
        currency: {
          symbol: 'DOT',
          amount: '100',
        },
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toBeDefined();
      });
  });

  it('Dry run preview - valid payload with mintFeeAssets boolean - /dry-run-preview', () => {
    return request(app.getHttpServer())
      .post('/dry-run-preview')
      .send({
        from: 'Hydration',
        to: 'AssetHubPolkadot',
        sender,
        recipient,
        currency: {
          symbol: 'DOT',
          amount: '100',
        },
        options: {
          mintFeeAssets: true,
        },
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toBeDefined();
      });
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
          amount: '100',
        },
        disableFallback: 'true',
      })
      .expect(400);
  });

  it('Get XCM fee - valid payload with disableFallback false - /xcm-fee', () => {
    return request(app.getHttpServer())
      .post('/xcm-fee')
      .send({
        from: 'Hydration',
        to: 'AssetHubPolkadot',
        sender,
        recipient,
        currency: {
          symbol: 'DOT',
          amount: '100',
        },
        disableFallback: false,
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toBeDefined();
      });
  });

  it('Get origin XCM fee - valid payload - /origin-xcm-fee', () => {
    return request(app.getHttpServer())
      .post('/origin-xcm-fee')
      .send({
        from: 'Hydration',
        to: 'AssetHubPolkadot',
        sender,
        recipient,
        currency: {
          symbol: 'DOT',
          amount: '100',
        },
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toBeDefined();
      });
  });

  it('Get origin XCM fee - missing sender - /origin-xcm-fee', () => {
    return request(app.getHttpServer())
      .post('/origin-xcm-fee')
      .send({
        from: 'Hydration',
        to: 'AssetHubPolkadot',
        recipient,
        currency: {
          symbol: 'DOT',
          amount: '100',
        },
      })
      .expect(400);
  });

  it('Get origin XCM fee - invalid origin chain - /origin-xcm-fee', () => {
    return request(app.getHttpServer())
      .post('/origin-xcm-fee')
      .send({
        from: UNKNOWN_CHAIN,
        to: 'AssetHubPolkadot',
        sender,
        recipient,
        currency: {
          symbol: 'DOT',
          amount: '100',
        },
      })
      .expect(400);
  });

  it('Get transferable amount - valid payload - /transferable-amount', () => {
    return request(app.getHttpServer())
      .post('/transferable-amount')
      .send({
        from: 'Hydration',
        to: 'AssetHubPolkadot',
        sender,
        recipient,
        currency: {
          symbol: 'DOT',
          amount: '100',
        },
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toBeDefined();
      });
  });

  it('Get transferable amount - missing sender - /transferable-amount', () => {
    return request(app.getHttpServer())
      .post('/transferable-amount')
      .send({
        from: 'Hydration',
        to: 'AssetHubPolkadot',
        recipient,
        currency: {
          symbol: 'DOT',
          amount: '100',
        },
      })
      .expect(400);
  });

  it('Verify ED on destination - valid payload - /verify-ed-on-destination', () => {
    return request(app.getHttpServer())
      .post('/verify-ed-on-destination')
      .send({
        from: 'Hydration',
        to: 'AssetHubPolkadot',
        sender,
        recipient,
        currency: {
          symbol: 'DOT',
          amount: '100',
        },
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toBeDefined();
      });
  });

  it('Verify ED on destination - missing sender - /verify-ed-on-destination', () => {
    return request(app.getHttpServer())
      .post('/verify-ed-on-destination')
      .send({
        from: 'Hydration',
        to: 'AssetHubPolkadot',
        recipient,
        currency: {
          symbol: 'DOT',
          amount: '100',
        },
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

  it('Sign and submit - valid derivation path sender - /sign-and-submit', async () => {
    return (
      request(app.getHttpServer())
        .post('/sign-and-submit')
        .send({
          from: 'Polkadot',
          to: 'AssetHubPolkadot',
          sender: '//Alice',
          recipient,
          currency: {
            symbol: 'DOT',
            amount: '100',
          },
        })
        // Should fail because //Alice does not have funds
        .expect(500)
    );
  });

  it(`Gets Ethereum bridge status`, async () => {
    return request(app.getHttpServer())
      .get('/x-transfer/eth-bridge-status')
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeDefined();
      });
  });

  it('Gets para to eth fees - /x-transfer/para-eth-fees', async () => {
    return request(app.getHttpServer())
      .get('/x-transfer/para-eth-fees')
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeDefined();
      });
  });

  it('Para eth fees - wrong HTTP method returns 404 - /x-transfer/para-eth-fees', () => {
    return request(app.getHttpServer())
      .post('/x-transfer/para-eth-fees')
      .send({})
      .expect(404);
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
      amount: '1000000000',
    };

    const options = {
      development: true,
      abstractDecimals: false,
      xcmFormatCheck: true,
      apiOverrides: {
        Hydration: ['wss://rpc.hydradx.cloud', 'wss://hydration.ibp.network'],
        AssetHubPolkadot: [
          'wss://polkadot-asset-hub-rpc.polkadot.io',
          'wss://dot-rpc.stakeworld.io/assethub',
        ],
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
      .expect(toHex(await tx.getEncodedData()));
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
      .expect(toHex(await tx.getEncodedData()));
  });

  it(`X-transfers with valid swap options array exchange - ${xTransfersUrl}`, async () => {
    const from: TChain = 'Astar';
    const to: TChain = 'BifrostPolkadot';
    const currency: TCurrencyInputWithAmount = {
      symbol: { type: 'Native', value: 'ASTR' },
      amount: '1000',
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
