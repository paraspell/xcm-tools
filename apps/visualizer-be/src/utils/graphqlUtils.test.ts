import { Int } from '@nestjs/graphql';
import { describe, expect, it } from 'vitest';

import { returnInt } from './graphqlUtils.js';

describe('returnInt', () => {
  it('should return Int type from GraphQL', () => {
    const result = returnInt();
    expect(result).toBe(Int);
  });
});
