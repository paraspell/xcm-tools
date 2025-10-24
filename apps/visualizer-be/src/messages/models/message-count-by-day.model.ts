import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MessageCountByDay {
  @Field()
  ecosystem: string;

  @Field({ nullable: true })
  parachain?: string;

  @Field()
  date: string;

  @Field()
  messageCount: number;

  @Field()
  messageCountSuccess: number;

  @Field()
  messageCountFailed: number;
}
