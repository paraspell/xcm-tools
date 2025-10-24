import { Field, ObjectType } from '@nestjs/graphql';

import { returnInt } from '../../utils/graphql.utils';

@ObjectType()
export class MessageCountByStatus {
  @Field({ nullable: true })
  ecosystem?: string;

  @Field({ nullable: true })
  parachain?: string;

  @Field(returnInt)
  success: number;

  @Field(returnInt)
  failed: number;
}
