import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Message } from './message.entity';
import { MessageCountByDay } from './models/message-count-by-day.model';
import { MessageCountByStatus } from './models/message-count-by-status.model';
import { AssetCount } from './models/asset-count.model';
import { MessageCount } from './models/message-count.model';
import { CountOption } from './count-option';
import { AccountXcmCountType } from './models/account-msg-count.model';
import {
  AccountXcmCountResult,
  AssetCountResult,
  ParaIdAssetCountResult,
} from 'src/types/types';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
  ) {}

  async countMessagesByStatus(
    paraIds: number[] = [],
    startTime: number,
    endTime: number,
  ): Promise<MessageCountByStatus[]> {
    if (paraIds.length > 0) {
      const results = await Promise.all(
        paraIds.map(async (paraId) => {
          const successCount = await this.messagesRepository.count({
            where: {
              origin_para_id: paraId,
              status: 'success',
              origin_block_timestamp: Between(startTime, endTime),
            },
          });

          const failedCount = await this.messagesRepository.count({
            where: {
              origin_para_id: paraId,
              status: 'failed',
              origin_block_timestamp: Between(startTime, endTime),
            },
          });

          return { paraId, success: successCount, failed: failedCount };
        }),
      );

      return results;
    } else {
      const successCount = await this.messagesRepository.count({
        where: {
          status: 'success',
          origin_block_timestamp: Between(startTime, endTime),
        },
      });

      const failedCount = await this.messagesRepository.count({
        where: {
          status: 'failed',
          origin_block_timestamp: Between(startTime, endTime),
        },
      });

      return [{ success: successCount, failed: failedCount }];
    }
  }

  async countMessagesByDay(
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
    startTime: number,
    endTime: number,
    countBy: CountOption,
  ): Promise<MessageCount[]> {
    if (countBy === CountOption.BOTH) {
      const originQuery = this.messagesRepository
        .createQueryBuilder('message')
        .select('message.origin_para_id', 'paraId')
        .addSelect('COUNT(*)', 'totalCount')
        .where(
          'message.origin_block_timestamp BETWEEN :startTime AND :endTime',
          { startTime, endTime },
        )
        .groupBy('message.origin_para_id');

      const destinationQuery = this.messagesRepository
        .createQueryBuilder('message')
        .select('message.dest_para_id', 'paraId')
        .addSelect('COUNT(*)', 'totalCount')
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
        paraId: parseInt(paraId, 10),
        totalCount: totalCount,
      }));
    } else {
      const queryBuilder =
        this.messagesRepository.createQueryBuilder('message');

      queryBuilder.where(
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
        paraId: result.paraId,
        totalCount: parseInt(result.totalCount, 10),
      }));
    }
  }

  async countAssetsBySymbol(
    paraIds: number[],
    startTime: number,
    endTime: number,
  ): Promise<AssetCount[]> {
    let query = '';
    const queryParameters: (number | number[])[] = [startTime, endTime];

    if (paraIds.length > 0) {
      query = `
        SELECT origin_para_id, symbol, COUNT(symbol) as count
        FROM (
          SELECT origin_para_id, (jsonb_array_elements(assets)->>'symbol') AS symbol
          FROM messages
          WHERE origin_block_timestamp BETWEEN $1 AND $2
            AND origin_para_id = ANY($3)
        ) as assets_symbols
        WHERE symbol IS NOT NULL
          AND symbol <> ''
        GROUP BY origin_para_id, symbol
        ORDER BY count DESC, origin_para_id;
      `;
      queryParameters.push(paraIds);
    } else {
      query = `
        SELECT symbol, COUNT(symbol) as count
        FROM (
          SELECT (jsonb_array_elements(assets)->>'symbol') AS symbol
          FROM messages
          WHERE origin_block_timestamp BETWEEN $1 AND $2
        ) as assets_symbols
        WHERE symbol IS NOT NULL
          AND symbol <> ''
        GROUP BY symbol
        ORDER BY count DESC;
      `;
    }

    const results = (await this.messagesRepository.query(
      query,
      queryParameters,
    )) as (ParaIdAssetCountResult | AssetCountResult)[];

    return results.map((result) =>
      'origin_para_id' in result
        ? {
            paraId: result.origin_para_id,
            symbol: result.symbol,
            count: parseInt(result.count),
          }
        : {
            symbol: result.symbol,
            count: parseInt(result.count),
          },
    );
  }

  async getAccountXcmCounts(
    paraIds: number[],
    threshold: number,
    startTime: number,
    endTime: number,
  ): Promise<AccountXcmCountType[]> {
    const whereConditions = [];
    const parameters = [];

    whereConditions.push('origin_block_timestamp BETWEEN $1 AND $2');
    parameters.push(startTime, endTime);

    if (paraIds.length > 0) {
      whereConditions.push(
        `origin_para_id IN (${paraIds.map((_, index) => `$${index + 3}`).join(', ')})`,
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

    const results = (await this.messagesRepository.query(
      query,
      parameters,
    )) as AccountXcmCountResult[];

    return results.map((account) => ({
      id: account.from_account_id,
      count: parseInt(account.message_count, 10),
    }));
  }
}
