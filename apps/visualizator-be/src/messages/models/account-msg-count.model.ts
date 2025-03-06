import { Field, ObjectType } from '@nestjs/graphql';

import { returnInt } from '../../utils/graphql.utils';

@ObjectType()
export class AccountXcmCountType {
  @Field()
  id: string;

  @Field(returnInt)
  count: number;
}
