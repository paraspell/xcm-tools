import { Field, ObjectType } from '@nestjs/graphql';

import { returnInt } from '../../utils/graphql.utils';

@ObjectType()
export class MessageCountByStatus {
  @Field(returnInt, { nullable: true })
  paraId?: number;

  @Field(returnInt)
  success: number;

  @Field(returnInt)
  failed: number;
}
