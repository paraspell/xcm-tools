import { ObjectType, Field, ID } from '@nestjs/graphql';
import { returnInt } from '../utils/graphql.utils';
import { Entity, Column, PrimaryColumn } from 'typeorm';

export const returnID = () => ID;
export const returnAssetArray = () => [Asset];

@ObjectType()
@Entity('messages')
export class Message {
  @Field(returnID)
  @PrimaryColumn()
  message_hash: string;

  @Field()
  @Column()
  origin_event_index: string;

  @Field()
  @Column()
  from_account_id: string;

  @Field(returnInt)
  @Column()
  origin_para_id: number;

  @Field(returnInt)
  @Column('bigint')
  origin_block_timestamp: number;

  @Field(returnInt)
  @Column('bigint')
  relayed_block_timestamp: number;

  @Field(returnInt)
  @Column('bigint')
  block_num: number;

  @Field()
  @Column()
  status: string;

  @Field()
  @Column()
  relayed_event_index: string;

  @Field()
  @Column()
  dest_event_index: string;

  @Field(returnInt)
  @Column()
  dest_para_id: number;

  @Field()
  @Column()
  to_account_id: string;

  @Field(returnInt)
  @Column('bigint')
  confirm_block_timestamp: number;

  @Field()
  @Column()
  extrinsic_index: string;

  @Field()
  @Column()
  relayed_extrinsic_index: string;

  @Field()
  @Column()
  dest_extrinsic_index: string;

  @Field(returnInt)
  @Column()
  child_para_id: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  child_dest?: string;

  @Field()
  @Column()
  protocol: string;

  @Field()
  @Column()
  message_type: string;

  @Field()
  @Column()
  unique_id: string;

  @Field(returnInt)
  @Column()
  xcm_version: number;

  @Field(returnAssetArray)
  @Column('jsonb')
  assets: Asset[];
}

@ObjectType()
export class Asset {
  @Field()
  enum_key: string;

  @Field()
  asset_module: string;

  @Field()
  amount: string;

  @Field(returnInt)
  decimals: number;

  @Field()
  symbol: string;
}
