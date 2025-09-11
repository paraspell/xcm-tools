import { Field, ObjectType } from '@nestjs/graphql';

import { returnInt } from '../../utils/graphql.utils';

@ObjectType()
export class AssetCount {
  @Field()
  ecosystem: string;

  @Field(returnInt, { nullable: true })
  paraId?: number;

  @Field()
  symbol: string;

  @Field(returnInt)
  count: number;
}
