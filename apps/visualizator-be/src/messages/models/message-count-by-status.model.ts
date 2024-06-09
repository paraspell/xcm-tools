import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class MessageCountByStatus {
  @Field(() => Int, { nullable: true })
  paraId?: number;

  @Field(() => Int)
  success: number;

  @Field(() => Int)
  failed: number;
}
