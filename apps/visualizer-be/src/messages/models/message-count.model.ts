import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';

import { CountOption } from '../../types.js';
import { returnInt } from '../../utils/graphqlUtils.js';

registerEnumType(CountOption, {
  name: 'CountOption',
  description: 'Option to count messages by origin, destination, or both',
});

@ObjectType()
export class MessageCount {
  @Field()
  ecosystem: string;

  @Field(returnInt)
  paraId: number;

  @Field(returnInt)
  totalCount: number;
}
