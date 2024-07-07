import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { CountOption } from '../count-option';

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
