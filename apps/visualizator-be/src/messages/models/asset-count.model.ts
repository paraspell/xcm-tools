import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class AssetCount {
  @Field(() => Int, { nullable: true })
  paraId?: number;

  @Field()
  symbol: string;

  @Field(() => Int)
  count: number;
}
