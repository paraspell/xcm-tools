import { Field, ObjectType } from '@nestjs/graphql';

import { returnInt } from '../../utils/graphqlUtils.js';

@ObjectType()
export class AccountXcmCountType {
  @Field()
  ecosystem: string;

  @Field()
  id: string;

  @Field(returnInt)
  count: number;
}
