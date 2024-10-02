import { Field, ObjectType } from '@nestjs/graphql';
import { returnInt } from '../../utils/graphql.utils';

@ObjectType()
export class MessageCountByDay {
  @Field(returnInt, { nullable: true })
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
