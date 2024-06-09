import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType()
@Entity('channels')
export class Channel {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => Int)
  @Column()
  sender: number;

  @Field(() => Int)
  @Column()
  recipient: number;

  @Field()
  @Column()
  status: string;

  @Field(() => Int)
  @Column()
  transfer_count: number;

  @Field(() => Int)
  @Column()
  message_count: number;

  @Field(() => Int)
  @Column('bigint')
  active_at: number;

  @Field(() => Int)
  @Column()
  proposed_max_capacity: number;

  @Field(() => Int)
  @Column()
  proposed_max_message_size: number;
}
