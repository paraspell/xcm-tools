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
    // Construct a query using positional parameters
    const query = `
      SELECT 
        ch.sender AS "senderId",
        ch.recipient AS "recipientId",
        COUNT(msg.message_hash) AS "totalCount",
        ch.id AS "id"
      FROM 
        channels ch
      LEFT JOIN 
        messages msg ON (msg.origin_para_id = ch.sender AND msg.dest_para_id = ch.recipient)
      WHERE 
        ch.status = 'accepted'
        AND ch.active_at <= $2
        AND msg.origin_block_timestamp <= $2
        AND msg.origin_block_timestamp >= $1
      GROUP BY 
        ch.sender, ch.recipient, ch.id
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

  async findOne(channelId: number): Promise<Channel> {
    // Construct a query using positional parameters
    const query = `
      SELECT 
        ch.sender AS "senderId",
        ch.recipient AS "recipientId",
        COUNT(msg.message_hash) AS "totalCount",
        ch.id AS "id",
        ch.status AS "status"
      FROM 
        channels ch
      LEFT JOIN 
        messages msg ON (msg.origin_para_id = ch.sender AND msg.dest_para_id = ch.recipient)
      WHERE 
        ch.id = $1
        AND ch.status = 'accepted'
      GROUP BY 
        ch.sender, ch.recipient, ch.id, ch.status;
    `;

    // Execute the query with channelId as the parameter
    const result = await this.channelRepository.query(query, [channelId]);

    if (result.length === 0) {
      throw new Error(`Channel with ID ${channelId} not found.`);
    }

    return {
      id: parseInt(result[0].id, 10),
      sender: parseInt(result[0].senderId, 10),
      recipient: parseInt(result[0].recipientId, 10),
      message_count: parseInt(result[0].totalCount, 10),
      status: result[0].status,
    } as any;
  }
}
