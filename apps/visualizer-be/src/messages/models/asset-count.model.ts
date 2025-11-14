import { Field, ObjectType } from '@nestjs/graphql';

import { returnInt } from '../../utils/graphql.utils';

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
