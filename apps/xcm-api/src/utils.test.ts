import { describe, it, expect } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { validateNode } from './utils.js';

describe('validateNode', () => {
  it('should not throw for valid node', () => {
    expect(() => validateNode('Acala')).not.toThrow();
  });

  it('should throw BadRequestException for invalid node', () => {
    expect(() => validateNode('InvalidNode')).toThrow(BadRequestException);
  });
});
