import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { validateChain } from './utils.js';
import { PARACHAINS } from '@paraspell/sdk';

describe('validateChain', () => {
  it('should not throw for valid chain', () => {
    expect(() => validateChain('Acala', PARACHAINS)).not.toThrow();
  });

  it('should throw BadRequestException for invalid chain', () => {
    expect(() => validateChain('InvalidChain', PARACHAINS)).toThrow(
      BadRequestException,
    );
  });
});
