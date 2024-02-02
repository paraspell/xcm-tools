// Unit tests for submitTransaction function

/* eslint-disable n/no-callback-literal */
import { type Extrinsic } from '@paraspell/sdk';
import { type ApiPromise } from '@polkadot/api';
import { type H256 } from '@polkadot/types/interfaces';
import {
  type SignerPayloadJSON,
  type SignerResult,
  type SignerPayloadRaw,
  type ISubmittableResult,
} from '@polkadot/types/types';
import { vi, describe, it, expect } from 'vitest';
import { submitTransaction } from './submitTransaction';

class MockApiPromise {
  registry = {
    findMetaError: (moduleError: any) => {
      return {
        docs: ['Mock documentation'],
        name: 'MockErrorName',
        section: 'MockErrorSection',
      };
    },
  };
}

class MockExtrinsic2 {
  async signAsync(): Promise<void> {}
  send(callback: any): void {}
}

class MockSigner {
  signPayload?: (payload: SignerPayloadJSON) => Promise<SignerResult>;
  signRaw?: (raw: SignerPayloadRaw) => Promise<SignerResult>;
  update?: (id: number, status: H256 | ISubmittableResult) => void;
}

describe('submitTransaction', () => {
  it('should resolve with transaction hash on successful transaction', async () => {
    const mockApi = new MockApiPromise();
    const mockTx = new MockExtrinsic2();
    const mockSigner = new MockSigner();
    const injectorAddress = 'mockInjectorAddress';

    mockTx.send = vi.fn((callback) => {
      callback({ status: { isFinalized: true }, txHash: 'mockTxHash' });
    });

    const result = await submitTransaction(
      mockApi as ApiPromise,
      mockTx as unknown as Extrinsic,
      mockSigner,
      injectorAddress,
    );
    expect(result).toBe('mockTxHash');
  });

  it('should reject with an error on dispatch error', async () => {
    const mockApi = new MockApiPromise();
    const mockTx = new MockExtrinsic2();
    const mockSigner = new MockSigner();
    const injectorAddress = 'mockInjectorAddress';

    mockTx.send = vi.fn((callback) => {
      const dispatchError = {
        isModule: true,
        asModule: 'mockModuleError',
      };
      callback({ status: { isFinalized: true }, dispatchError });
    });

    try {
      await submitTransaction(
        mockApi as ApiPromise,
        mockTx as unknown as Extrinsic,
        mockSigner,
        injectorAddress,
      );
    } catch (error) {
      if (error instanceof Error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('MockErrorSection.MockErrorName: Mock documentation');
      }
    }
  });

  it('should reject with a generic error on dispatch error not being a module error', async () => {
    const mockApi = new MockApiPromise();
    const mockTx = new MockExtrinsic2();
    const mockSigner = new MockSigner();
    const injectorAddress = 'mockInjectorAddress';

    const mockDispatchError = {
      toString: () => 'Generic Dispatch Error',
      isModule: false,
    };

    mockTx.send = vi.fn((callback) => {
      callback({ status: { isFinalized: true }, dispatchError: mockDispatchError });
    });

    try {
      await submitTransaction(
        mockApi as ApiPromise,
        mockTx as unknown as Extrinsic,
        mockSigner,
        injectorAddress,
      );
      throw new Error('Expected submitTransaction to throw an error, but it did not');
    } catch (error) {
      if (error instanceof Error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Generic Dispatch Error');
      }
    }
  });
});
