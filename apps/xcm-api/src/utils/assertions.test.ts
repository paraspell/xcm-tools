import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import {
  assertChain,
  assertDestination,
  assertSubstrateChain,
} from './assertions.js';

describe('assertSubstrateChain', () => {
  it('passes for a built-in substrate chain', () => {
    expect(() => assertSubstrateChain('Acala', undefined)).not.toThrow();
  });

  it('passes for a chain defined in customChains', () => {
    expect(() =>
      assertSubstrateChain('MyCustom', { MyCustom: {} as never }),
    ).not.toThrow();
  });

  it('throws BadRequestException for an unknown chain with no customChains', () => {
    expect(() => assertSubstrateChain('NotAChain', undefined)).toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException for an unknown chain with non-matching customChains', () => {
    expect(() =>
      assertSubstrateChain('NotAChain', { Other: {} as never }),
    ).toThrow(BadRequestException);
  });

  it('does not match inherited prototype properties', () => {
    expect(() =>
      assertSubstrateChain('toString', { Acala: {} as never }),
    ).toThrow(BadRequestException);
  });

  it('throws for an external chain (Ethereum is not substrate)', () => {
    expect(() => assertSubstrateChain('Ethereum', undefined)).toThrow(
      BadRequestException,
    );
  });
});

describe('assertChain', () => {
  it('passes for a substrate chain', () => {
    expect(() => assertChain('Acala', undefined)).not.toThrow();
  });

  it('passes for an external chain', () => {
    expect(() => assertChain('Ethereum', undefined)).not.toThrow();
  });

  it('passes for a custom chain', () => {
    expect(() =>
      assertChain('MyCustom', { MyCustom: {} as never }),
    ).not.toThrow();
  });

  it('throws for an unknown chain', () => {
    expect(() => assertChain('NotAChain', undefined)).toThrow(
      BadRequestException,
    );
  });

  it('does not match inherited prototype properties', () => {
    expect(() => assertChain('toString', { Acala: {} as never })).toThrow(
      BadRequestException,
    );
  });
});

describe('assertDestination', () => {
  it('passes for a TLocation object', () => {
    expect(() =>
      assertDestination({ parents: 1, interior: 'Here' }, undefined),
    ).not.toThrow();
  });

  it('passes for a substrate chain string', () => {
    expect(() => assertDestination('Acala', undefined)).not.toThrow();
  });

  it('passes for an external chain string', () => {
    expect(() => assertDestination('Ethereum', undefined)).not.toThrow();
  });

  it('passes for a custom chain string', () => {
    expect(() =>
      assertDestination('MyCustom', { MyCustom: {} as never }),
    ).not.toThrow();
  });

  it('throws for an unknown string destination', () => {
    expect(() => assertDestination('NotAChain', undefined)).toThrow(
      BadRequestException,
    );
  });

  it('does not match inherited prototype properties', () => {
    expect(() => assertDestination('toString', { Acala: {} as never })).toThrow(
      BadRequestException,
    );
  });
});
