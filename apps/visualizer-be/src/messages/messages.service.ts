import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AccountXcmCountResult,
  AssetCountResult,
  ParaIdAssetCountResult,
} from 'src/types/types';
import { Between, Repository } from 'typeorm';

import { CountOption } from './count-option';
import { Message } from './message.entity';
import { AccountXcmCountType } from './models/account-msg-count.model';
import { AssetCount } from './models/asset-count.model';
import { MessageCount } from './models/message-count.model';
import { MessageCountByDay } from './models/message-count-by-day.model';
import { MessageCountByStatus } from './models/message-count-by-status.model';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
  ) {}

  async countMessagesByStatus(
    ecosystem: string,
    paraIds: number[] = [],
    startTime: number,
    endTime: number,
  ): Promise<MessageCountByStatus[]> {
    if (paraIds.length > 0) {
      const results = await Promise.all(
        paraIds.map(async (paraId) => {
          const successCount = await this.messagesRepository.count({
            where: {
              ecosystem: ecosystem,
              origin_para_id: paraId,
              status: 'success',
              origin_block_timestamp: Between(startTime, endTime),
            },
          });

          const failedCount = await this.messagesRepository.count({
            where: {
              ecosystem: ecosystem,
              origin_para_id: paraId,
              status: 'failed',
              origin_block_timestamp: Between(startTime, endTime),
            },
          });

          return {
            ecosystem,
            paraId,
            success: successCount,
            failed: failedCount,
          };
        }),
      );

      return results;
    } else {
      const successCount = await this.messagesRepository.count({
        where: {
          ecosystem: ecosystem,
          status: 'success',
          origin_block_timestamp: Between(startTime, endTime),
        },
      });

      const failedCount = await this.messagesRepository.count({
        where: {
          ecosystem: ecosystem,
          status: 'failed',
          origin_block_timestamp: Between(startTime, endTime),
        },
      });

      return [{ ecosystem, success: successCount, failed: failedCount }];
    }
  }

  async countMessagesByDay(
    ecosystem: string,
    paraIds: number[],
    startTime: number,
    endTime: number,
  ): Promise<MessageCountByDay[]> {
    const queryBuilder = this.messagesRepository
      .createQueryBuilder('message')
      .select(
        "TO_CHAR(TO_TIMESTAMP(message.origin_block_timestamp), 'YYYY-MM-DD')",
        'date',
      )
      .addSelect('COUNT(*)', 'message_count')
      .addSelect(
        "SUM(CASE WHEN message.status = 'success' THEN 1 ELSE 0 END)",
        'message_count_success',
      )
      .addSelect(
        "SUM(CASE WHEN message.status = 'failed' THEN 1 ELSE 0 END)",
        'message_count_failed',
      );

    queryBuilder.where('message.ecosystem = :ecosystem', { ecosystem });

    queryBuilder.where(
      'message.origin_block_timestamp BETWEEN :startTime AND :endTime',
      {
        startTime,
        endTime,
      },
    );

    if (paraIds.length > 0) {
      queryBuilder
        .andWhere('message.origin_para_id IN (:...paraIds)', { paraIds })
        .addSelect('message.origin_para_id', 'paraId')
        .groupBy(
          "message.origin_para_id, TO_CHAR(TO_TIMESTAMP(message.origin_block_timestamp), 'YYYY-MM-DD')",
        );
    } else {
      queryBuilder.groupBy(
        "TO_CHAR(TO_TIMESTAMP(message.origin_block_timestamp), 'YYYY-MM-DD')",
      );
    }

    queryBuilder.orderBy(
      paraIds.length > 0 ? 'message.origin_para_id, date' : 'date',
    );

    const data: {
      paraId: string;
      date: string;
      message_count_success: string;
      message_count_failed: string;
    }[] = await queryBuilder.getRawMany();
    return data.map((d) => ({
      ecosystem,
      paraId: d.paraId ? parseInt(d.paraId, 10) : undefined,
      date: d.date,
      messageCount:
        parseInt(d.message_count_success, 10) +
        parseInt(d.message_count_failed, 10),
      messageCountSuccess: parseInt(d.message_count_success, 10),
      messageCountFailed: parseInt(d.message_count_failed, 10),
    }));
  }

  async getTotalMessageCounts(
    ecosystem: string,
    startTime: number,
    endTime: number,
    countBy: CountOption,
  ): Promise<MessageCount[]> {
    if (countBy === CountOption.BOTH) {
      const originQuery = this.messagesRepository
        .createQueryBuilder('message')
        .select('message.origin_para_id', 'paraId')
        .addSelect('COUNT(*)', 'totalCount')
        .where('message.ecosystem = :ecosystem', { ecosystem })
        .where(
          'message.origin_block_timestamp BETWEEN :startTime AND :endTime',
          { startTime, endTime },
        )
        .groupBy('message.origin_para_id');

      const destinationQuery = this.messagesRepository
        .createQueryBuilder('message')
        .select('message.dest_para_id', 'paraId')
        .addSelect('COUNT(*)', 'totalCount')
        .where('message.ecosystem = :ecosystem', { ecosystem })
        .where(
          'message.origin_block_timestamp BETWEEN :startTime AND :endTime',
          { startTime, endTime },
        )
        .groupBy('message.dest_para_id');

      const originResults: {
        paraId: string;
        totalCount: string;
      }[] = await originQuery.getRawMany();
      const destinationResults: {
        paraId: string;
        totalCount: string;
      }[] = await destinationQuery.getRawMany();

      const totalCounts = new Map<string, number>();
      [...originResults, ...destinationResults].forEach((result) => {
        const count = totalCounts.get(result.paraId) || 0;
        totalCounts.set(result.paraId, count + parseInt(result.totalCount, 10));
      });

      return Array.from(totalCounts.entries()).map(([paraId, totalCount]) => ({
        ecosystem,
        paraId: parseInt(paraId, 10),
        totalCount: totalCount,
      }));
    } else {
      const queryBuilder =
        this.messagesRepository.createQueryBuilder('message');

      queryBuilder
        .where('message.ecosystem = :ecosystem', { ecosystem })
        .where(
          'message.origin_block_timestamp BETWEEN :startTime AND :endTime',
          {
            startTime,
            endTime,
          },
        );

      if (countBy === CountOption.ORIGIN) {
        queryBuilder
          .select('message.origin_para_id', 'paraId')
          .addGroupBy('message.origin_para_id');
      } else if (countBy === CountOption.DESTINATION) {
        queryBuilder
          .select('message.dest_para_id', 'paraId')
          .addGroupBy('message.dest_para_id');
      }

      queryBuilder.addSelect('COUNT(*)', 'totalCount');

      const results: {
        paraId: number;
        totalCount: string;
      }[] = await queryBuilder.getRawMany();
      return results.map((result) => ({
        ecosystem,
        paraId: result.paraId,
        totalCount: parseInt(result.totalCount, 10),
      }));
    }
  }

  async countAssetsBySymbol(
    ecosystem: string,
    paraIds: number[],
    startTime: number,
    endTime: number,
  ): Promise<AssetCount[]> {
    let query = '';
    const queryParameters: (number | number[] | string)[] = [
      ecosystem,
      startTime,
      endTime,
    ];

    if (paraIds.length > 0) {
      query = `
        WITH asset_rows AS (
          SELECT
            m.origin_para_id,
            (a.elem->>'symbol')                    AS symbol,
            NULLIF(a.elem->>'decimals','')::int    AS decimals,
            NULLIF(a.elem->>'amount','')::numeric  AS amount_num
          FROM messages m
          CROSS JOIN LATERAL jsonb_array_elements(COALESCE(m.assets, '[]'::jsonb)) AS a(elem)
          WHERE
            m.ecosystem = $1
            AND m.origin_block_timestamp BETWEEN $2 AND $3
            AND m.origin_para_id = ANY($4)
        )
        SELECT
          origin_para_id,
          symbol,
          MAX(decimals)                                            AS decimals,
          COUNT(*)                                                 AS count,
          SUM(amount_num) / POWER(10::numeric, MAX(decimals))      AS amount
        FROM asset_rows
        WHERE
          symbol IS NOT NULL AND symbol <> ''
          AND decimals IS NOT NULL
          AND amount_num IS NOT NULL
        GROUP BY origin_para_id, symbol
        ORDER BY count DESC, origin_para_id;
      `;
      queryParameters.push(paraIds);
    } else {
      query = `
        WITH asset_rows AS (
          SELECT
            m.origin_para_id,
            (a.elem->>'symbol')                    AS symbol,
            NULLIF(a.elem->>'decimals','')::int    AS decimals,
            NULLIF(a.elem->>'amount','')::numeric  AS amount_num
          FROM messages m
          CROSS JOIN LATERAL jsonb_array_elements(COALESCE(m.assets, '[]'::jsonb)) AS a(elem)
          WHERE
            m.ecosystem = $1
            AND m.origin_block_timestamp BETWEEN $2 AND $3
        )
        SELECT
          symbol,
          MAX(decimals)                                            AS decimals,
          COUNT(*)                                                 AS count,
          SUM(amount_num) / POWER(10::numeric, MAX(decimals))      AS amount
        FROM asset_rows
        WHERE
          symbol IS NOT NULL AND symbol <> ''
          AND decimals IS NOT NULL
          AND amount_num IS NOT NULL
        GROUP BY symbol
        ORDER BY count DESC;
      `;
    }

    const results = await this.messagesRepository.query<
      (ParaIdAssetCountResult | AssetCountResult)[]
    >(query, queryParameters);

    return results.map((result) =>
      'origin_para_id' in result
        ? {
            ecosystem,
            paraId: result.origin_para_id,
            symbol: result.symbol,
            count: parseInt(result.count),
            amount: result.amount,
          }
        : {
            ecosystem,
            symbol: result.symbol,
            count: parseInt(result.count),
            amount: result.amount,
          },
    );
  }

  async getAccountXcmCounts(
    ecosystem: string,
    paraIds: number[],
    threshold: number,
    startTime: number,
    endTime: number,
  ): Promise<AccountXcmCountType[]> {
    const whereConditions = [];
    const parameters = [];

    whereConditions.push('ecosystem = $1');
    whereConditions.push('origin_block_timestamp BETWEEN $2 AND $3');
    parameters.push(ecosystem, startTime, endTime);

    if (paraIds.length > 0) {
      whereConditions.push(
        `origin_para_id IN (${paraIds.map((_, index) => `$${index + 1 + 3}`).join(', ')})`,
      );
      parameters.push(...paraIds);
    }

    const query = `
      SELECT from_account_id, COUNT(*) as message_count
      FROM messages
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY from_account_id
      HAVING COUNT(*) > $${parameters.length + 1}
      ORDER BY message_count DESC;
    `;

    parameters.push(threshold);

    const results = await this.messagesRepository.query<
      AccountXcmCountResult[]
    >(query, parameters);

    return results.map((account) => ({
      ecosystem,
      id: account.from_account_id,
      count: parseInt(account.message_count, 10),
    }));
  }
}
