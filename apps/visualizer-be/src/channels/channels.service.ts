import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { ChannelResult } from '../types.js';

@Injectable()
export class ChannelService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(ecosystem: string) {
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

    const results = await this.prisma.$queryRawUnsafe<ChannelResult[]>(
      query,
      ecosystem,
    );

    return results.map(
      ({
        id,
        ecosystem,
        senderId,
        recipientId,
        transferCount,
        totalCount,
      }) => ({
        id: Number(id),
        ecosystem,
        sender: Number(senderId),
        recipient: Number(recipientId),
        transfer_count: Number(transferCount),
        message_count: Number(totalCount),
        status: 'accepted',
      }),
    );
  }

  async findAllInInterval(
    ecosystem: string,
    startTime: number,
    endTime: number,
  ) {
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

    const results = await this.prisma.$queryRawUnsafe<ChannelResult[]>(
      query,
      ecosystem,
      startTime,
      endTime,
    );

    return results.map(
      ({ id, ecosystem, senderId, recipientId, totalCount }) => ({
        id: Number(id),
        ecosystem,
        sender: Number(senderId),
        recipient: Number(recipientId),
        message_count: Number(totalCount),
      }),
    );
  }

  async findOne(ecosystem: string, sender: number, recipient: number) {
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
        messages msg
          ON msg.origin_para_id = ch.sender
         AND msg.dest_para_id = ch.recipient
      WHERE
        ch.ecosystem = $1
        AND ch.status = 'accepted'
        AND ch.sender = $2
        AND ch.recipient = $3
      GROUP BY
        ch.sender, ch.recipient, ch.id, ch.status;
    `;

    const result = await this.prisma.$queryRawUnsafe<
      {
        id: string;
        senderId: string;
        recipientId: string;
        totalCount: string;
        active_at: string;
        status: string;
      }[]
    >(query, ecosystem, sender, recipient);

    if (!result.length) {
      throw new Error(
        `No channel found with sender ${sender}, recipient ${recipient}, ecosystem ${ecosystem}`,
      );
    }

    const row = result[0];

    return {
      id: Number(row.id),
      ecosystem,
      sender: Number(row.senderId),
      recipient: Number(row.recipientId),
      message_count: Number(row.totalCount),
      active_at: Number(row.active_at),
      status: row.status,
    };
  }
}
