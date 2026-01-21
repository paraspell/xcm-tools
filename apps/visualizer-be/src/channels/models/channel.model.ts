import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Channel {
  @Field(() => Int)
  id: number;

  @Field()
  ecosystem: string;

  @Field(() => Int)
  sender: number;

  @Field(() => Int)
  recipient: number;

  @Field(() => Int, { nullable: true })
  transfer_count?: number;

  @Field(() => Int, { nullable: true })
  message_count?: number;

  @Field(() => Int, { nullable: true })
  active_at?: number;

  @Field({ nullable: true })
  status?: string;
}
