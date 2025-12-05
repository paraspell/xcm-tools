import { Field, ObjectType } from '@nestjs/graphql';

import { returnInt } from '../../utils/graphqlUtils.js';

@ObjectType()
export class AssetCount {
  @Field()
  ecosystem: string;

  @Field({ nullable: true })
  parachain?: string;

  @Field()
  symbol: string;

  @Field(returnInt)
  count: number;

  @Field()
  amount: string;
}
