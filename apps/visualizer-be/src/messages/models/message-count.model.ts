import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';

import { returnInt } from '../../utils/graphql.utils';
import { CountOption } from '../count-option';

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
