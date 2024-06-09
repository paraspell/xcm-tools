import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class AccountXcmCountType {
  @Field()
  id: string;

  @Field(() => Int)
  count: number;
}
