import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { Entity, Column, PrimaryColumn } from 'typeorm';

@ObjectType()
@Entity('messages')
export class Message {
  @Field(() => ID)
  @PrimaryColumn()
  message_hash: string;

  @Field()
  @Column()
  origin_event_index: string;

  @Field()
  @Column()
  from_account_id: string;

  @Field(() => Int)
  @Column()
  origin_para_id: number;

  @Field(() => Int)
  @Column('bigint')
  origin_block_timestamp: number;

  @Field(() => Int)
  @Column('bigint')
  relayed_block_timestamp: number;

  @Field(() => Int)
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

  @Field(() => Int)
  @Column()
  dest_para_id: number;

  @Field()
  @Column()
  to_account_id: string;

  @Field(() => Int)
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

  @Field(() => Int)
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

  @Field(() => Int)
  @Column()
  xcm_version: number;

  @Field(() => [Asset])
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

  @Field(() => Int)
  decimals: number;

  @Field()
  symbol: string;
}
