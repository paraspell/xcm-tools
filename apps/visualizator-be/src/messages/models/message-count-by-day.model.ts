import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MessageCountByDay {
  @Field(() => Int, { nullable: true })
  paraId?: number;

  @Field()
  date: string;

  @Field()
  messageCount: number;

  @Field()
  messageCountSuccess: number;

  @Field()
  messageCountFailed: number;
}
