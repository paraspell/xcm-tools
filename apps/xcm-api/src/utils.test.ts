import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { validateNode } from './utils.js';

describe('validateNode', () => {
  it('should not throw for valid node', () => {
    expect(() => validateNode('Acala')).not.toThrow();
  });

  it('should throw BadRequestException for invalid node', () => {
    expect(() => validateNode('InvalidNode')).toThrow(BadRequestException);
  });
});
