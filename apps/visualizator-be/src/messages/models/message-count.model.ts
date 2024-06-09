import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';

export enum CountOption {
  ORIGIN = 'origin_para_id',
  DESTINATION = 'dest_para_id',
  BOTH = 'both',
}

registerEnumType(CountOption, {
  name: 'CountOption',
  description: 'Option to count messages by origin, destination, or both',
});

@ObjectType()
export class MessageCount {
  @Field(() => Int)
  paraId: number;

  @Field(() => Int)
  totalCount: number;
}
