import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChannelResult } from 'src/types/types';
import { Repository } from 'typeorm';

import { Channel } from './channel.entity';

@Injectable()
export class ChannelService {
  constructor(
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
  ) {}

  async findAll(ecosystem: string): Promise<Partial<Channel>[]> {
    const query = `
      WITH norm AS (
        SELECT
          LEAST(sender, recipient)   AS s,
          GREATEST(sender, recipient) AS r,
          id, ecosystem, status, transfer_count, message_count
        FROM channels
        WHERE ecosystem = $1 AND status = 'accepted'
      )
      SELECT
        s AS "senderId",
        r AS "recipientId",
        MIN(id)                      AS "id",
        $1::text                     AS "ecosystem",
        SUM(transfer_count)::bigint  AS "transferCount",
        SUM(message_count)::bigint   AS "totalCount",
        'accepted'::text             AS "status"
      FROM norm
      GROUP BY s, r
      ORDER BY "senderId", "recipientId";
    `;

    const results = await this.channelRepository.query<ChannelResult[]>(query, [
      ecosystem,
    ]);

    return results.map(
      ({
        id,
        ecosystem,
        senderId,
        recipientId,
        transferCount,
        totalCount,
      }) => ({
        id: parseInt(id, 10),
        ecosystem: ecosystem,
        sender: parseInt(senderId, 10),
        recipient: parseInt(recipientId, 10),
        transfer_count: parseInt(transferCount, 10),
        message_count: parseInt(totalCount, 10),
      }),
    );
  }

  async findAllInInterval(
    ecosystem: string,
    startTime: number,
    endTime: number,
  ): Promise<Partial<Channel>[]> {
    const query = `
      SELECT
        LEAST(ch.sender, ch.recipient) AS "senderId",
        GREATEST(ch.sender, ch.recipient) AS "recipientId",
        COUNT(msg.message_hash)       AS "totalCount",
        MIN(ch.id)                    AS "id",
        $1::text                      AS "ecosystem"
      FROM channels ch
      JOIN messages msg ON
        msg.ecosystem = $1 AND
        (
          (msg.origin_para_id = ch.sender AND msg.dest_para_id = ch.recipient) OR
          (msg.origin_para_id = ch.recipient AND msg.dest_para_id = ch.sender)
        )
        AND msg.origin_block_timestamp >= $2
        AND msg.origin_block_timestamp <= $3
      WHERE
        ch.ecosystem = $1
        AND ch.status = 'accepted'
        AND ch.active_at <= $3
      GROUP BY
        LEAST(ch.sender, ch.recipient),
        GREATEST(ch.sender, ch.recipient),
        $1::text
      ORDER BY "totalCount" DESC;
    `;

    const results = await this.channelRepository.query<ChannelResult[]>(query, [
      ecosystem,
      startTime,
      endTime,
    ]);

    return results.map(
      ({ id, ecosystem, senderId, recipientId, totalCount }) => ({
        id: parseInt(id, 10),
        ecosystem: ecosystem,
        sender: parseInt(senderId, 10),
        recipient: parseInt(recipientId, 10),
        message_count: parseInt(totalCount, 10),
      }),
    );
  }

  async findOne(
    ecosystem: string,
    sender: number,
    recipient: number,
  ): Promise<Partial<Channel>> {
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
        ch.ecosystem = $1
        AND ch.status = 'accepted'
        AND (ch.sender = $2 AND ch.recipient = $3)
      GROUP BY
        ch.sender, ch.recipient, ch.id, ch.status, ch.active_at;
    `;

    const result = await this.channelRepository.query<
      {
        id: string;
        senderId: string;
        recipientId: string;
        totalCount: string;
        active_at: string;
        status: string;
      }[]
    >(query, [ecosystem, sender, recipient]);

    if (result.length === 0) {
      throw new Error(
        `No channel found with sender ID ${sender} or recipient ID ${recipient} in ecosystem ${ecosystem}.`,
      );
    }

    return {
      id: parseInt(result[0].id, 10),
      ecosystem: ecosystem,
      sender: parseInt(result[0].senderId, 10),
      recipient: parseInt(result[0].recipientId, 10),
      message_count: parseInt(result[0].totalCount, 10),
      active_at: parseInt(result[0].active_at, 10),
      status: result[0].status,
    };
  }
}
