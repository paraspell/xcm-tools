import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

export const returnID = () => ID;
export const returnAssetArray = () => [Asset];

@ObjectType()
export class Message {
  @Field(returnID)
  message_hash: string;

  @Field()
  ecosystem: string;

  @Field({ nullable: true })
  origin_event_index?: string;

  @Field({ nullable: true })
  from_account_id?: string;

  @Field(() => Int, { nullable: true })
  origin_para_id?: number;

  @Field(() => Int, { nullable: true })
  origin_block_timestamp?: number;

  @Field(() => Int, { nullable: true })
  relayed_block_timestamp?: number;

  @Field(() => Int, { nullable: true })
  block_num?: number;

  @Field({ nullable: true })
  status?: string;

  @Field({ nullable: true })
  relayed_event_index?: string;

  @Field({ nullable: true })
  dest_event_index?: string;

  @Field(() => Int, { nullable: true })
  dest_para_id?: number;

  @Field({ nullable: true })
  to_account_id?: string;

  @Field(() => Int, { nullable: true })
  confirm_block_timestamp?: number;

  @Field({ nullable: true })
  extrinsic_index?: string;

  @Field({ nullable: true })
  relayed_extrinsic_index?: string;

  @Field({ nullable: true })
  dest_extrinsic_index?: string;

  @Field(() => Int, { nullable: true })
  child_para_id?: number;

  @Field({ nullable: true })
  child_dest?: string;

  @Field({ nullable: true })
  protocol?: string;

  @Field({ nullable: true })
  message_type?: string;

  @Field({ nullable: true })
  unique_id?: string;

  @Field(() => Int, { nullable: true })
  xcm_version?: number;

  @Field(() => [Asset], { nullable: true })
  assets?: Asset[];
}

@ObjectType()
export class Asset {
  @Field({ nullable: true })
  enum_key?: string;

  @Field({ nullable: true })
  asset_module?: string;

  @Field({ nullable: true })
  amount?: string;

  @Field(() => Int, { nullable: true })
  decimals?: number;

  @Field({ nullable: true })
  symbol?: string;
}
