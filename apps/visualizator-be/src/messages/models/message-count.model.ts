import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import { CountOption } from '../count-option';
import { returnInt } from '../../utils/graphql.utils';

registerEnumType(CountOption, {
  name: 'CountOption',
  description: 'Option to count messages by origin, destination, or both',
});

@ObjectType()
export class MessageCount {
  @Field(returnInt)
  paraId: number;

  @Field(returnInt)
  totalCount: number;
}
