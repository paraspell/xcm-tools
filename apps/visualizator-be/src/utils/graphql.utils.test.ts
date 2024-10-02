import { Int } from '@nestjs/graphql';
import { returnInt } from './graphql.utils';

describe('returnInt', () => {
  it('should return Int type from GraphQL', () => {
    const result = returnInt();
    expect(result).toBe(Int);
  });
});
