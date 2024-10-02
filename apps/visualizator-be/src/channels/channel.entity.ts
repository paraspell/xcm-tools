import { ObjectType, Field } from '@nestjs/graphql';
import { returnInt } from '../utils/graphql.utils';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType()
@Entity('channels')
export class Channel {
  @Field(returnInt)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(returnInt)
  @Column()
  sender: number;

  @Field(returnInt)
  @Column()
  recipient: number;

  @Field()
  @Column()
  status: string;

  @Field(returnInt)
  @Column()
  transfer_count: number;

  @Field(returnInt)
  @Column()
  message_count: number;

  @Field(returnInt)
  @Column('bigint')
  active_at: number;

  @Field(returnInt)
  @Column()
  proposed_max_capacity: number;

  @Field(returnInt)
  @Column()
  proposed_max_message_size: number;
}
