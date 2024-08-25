/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from './channel.entity';

@Injectable()
export class ChannelService {
  constructor(
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
  ) {}

  async findAll(startTime: number, endTime: number): Promise<Channel[]> {
    const query = `
      SELECT 
        LEAST(ch.sender, ch.recipient) AS "senderId",
        GREATEST(ch.sender, ch.recipient) AS "recipientId",
        COUNT(msg.message_hash) AS "totalCount",
        MIN(ch.id) AS "id"
      FROM 
        channels ch
      LEFT JOIN 
        messages msg ON (
          (msg.origin_para_id = ch.sender AND msg.dest_para_id = ch.recipient) OR 
          (msg.origin_para_id = ch.recipient AND msg.dest_para_id = ch.sender)
        )
      WHERE 
        ch.status = 'accepted'
        AND ch.active_at <= $2
        AND msg.origin_block_timestamp <= $2
        AND msg.origin_block_timestamp >= $1
      GROUP BY 
        LEAST(ch.sender, ch.recipient), GREATEST(ch.sender, ch.recipient)
      HAVING 
        COUNT(msg.message_hash) > 0
      ORDER BY 
        "totalCount" DESC;
    `;

    const results = await this.channelRepository.query(query, [
      startTime,
      endTime,
    ]);

    return results.map((result) => ({
      id: parseInt(result.id, 10),
      sender: parseInt(result.senderId, 10),
      recipient: parseInt(result.recipientId, 10),
      message_count: parseInt(result.totalCount, 10),
    }));
  }

  async findOne(sender: number, recipient: number): Promise<Channel> {
    const query = `
      SELECT 
        ch.sender AS "senderId",
        ch.recipient AS "recipientId",
        ch.active_at AS "active_at",
        COUNT(msg.message_hash) AS "totalCount",
        ch.id AS "id",
        ch.status AS "status"
      FROM 
        channels ch
      LEFT JOIN 
        messages msg ON (msg.origin_para_id = ch.sender AND msg.dest_para_id = ch.recipient)
      WHERE 
        (ch.sender = $1 AND ch.recipient = $2)
        AND ch.status = 'accepted'
      GROUP BY 
        ch.sender, ch.recipient, ch.id, ch.status;
    `;

    const result = await this.channelRepository.query(query, [
      sender,
      recipient,
    ]);

    if (result.length === 0) {
      throw new Error(
        `No channel found with sender ID ${sender} or recipient ID ${recipient}.`,
      );
    }

    return {
      id: parseInt(result[0].id, 10),
      sender: parseInt(result[0].senderId, 10),
      recipient: parseInt(result[0].recipientId, 10),
      message_count: parseInt(result[0].totalCount, 10),
      active_at: parseInt(result[0].active_at, 10),
      status: result[0].status,
    } as any;
  }
}
