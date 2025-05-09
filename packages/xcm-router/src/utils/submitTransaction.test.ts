import type { TPapiTransaction } from '@paraspell/sdk';
import type { PolkadotSigner, TxFinalizedPayload } from 'polkadot-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { submitTransaction } from './submitTransaction';

const buildTxMock = () => {
  let onNext: (evt: unknown) => void = () => {};
  let onError: (err: unknown) => void = () => {};

  const txMock: TPapiTransaction = {
    signSubmitAndWatch: vi.fn(() => ({
      subscribe(observer: { next: typeof onNext; error: typeof onError }) {
        onNext = observer.next;
        onError = observer.error;
        return { unsubscribe: vi.fn() };
      },
    })),
  } as unknown as TPapiTransaction;

  const emit = {
    next: (evt: unknown) => onNext(evt),
    error: (err: unknown) => onError(err),
  };

  return { txMock, emit };
};

const signerStub = {} as PolkadotSigner;

describe('submitTransaction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('invokes onSign when a "signed" event is received', async () => {
    const { txMock, emit } = buildTxMock();
    const onSign = vi.fn();

    const promise = submitTransaction(txMock, signerStub, onSign);

    emit.next({ type: 'signed' });
    const okEvt = { type: 'finalized', ok: true } as unknown as TxFinalizedPayload;
    emit.next(okEvt);

    await expect(promise).resolves.toBe(okEvt);
    expect(onSign).toHaveBeenCalledTimes(1);
  });

  it('resolves on "finalized" with ok === true', async () => {
    const { txMock, emit } = buildTxMock();

    const promise = submitTransaction(txMock, signerStub);

    const evt = { type: 'finalized', ok: true } as unknown as TxFinalizedPayload;
    emit.next(evt);

    await expect(promise).resolves.toBe(evt);
  });

  it('rejects when ok === false in a finalized event', async () => {
    const { txMock, emit } = buildTxMock();

    const promise = submitTransaction(txMock, signerStub);

    emit.next({
      type: 'finalized',
      ok: false,
      dispatchError: { value: 'BadOrigin' },
    });

    await expect(promise).rejects.toThrow('BadOrigin');
  });

  it('rejects when the observable errors', async () => {
    const { txMock, emit } = buildTxMock();

    const promise = submitTransaction(txMock, signerStub);

    emit.error('network-down');

    await expect(promise).rejects.toThrow('network-down');
  });
});
