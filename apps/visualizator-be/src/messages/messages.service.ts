import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Message } from './message.entity';
import { MessageCountByDay } from './models/message-count-by-day.model';
import { MessageCountByStatus } from './models/message-count-by-status.model';
import { AssetCount } from './models/asset-count.model';
import { MessageCount } from './models/message-count.model';

enum CountOption {
  ORIGIN = 'origin_para_id',
  DESTINATION = 'dest_para_id',
  BOTH = 'both',
}

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
  ) {}

  async findAll(): Promise<Message[]> {
    return this.messagesRepository.find();
  }

  async findOne(messageHash: string): Promise<Message> {
    return this.messagesRepository.findOneBy({ message_hash: messageHash });
  }

  async updateMessage(
    messageHash: string,
    updateMessageDto: any,
  ): Promise<Message> {
    const message = await this.messagesRepository.preload({
      message_hash: messageHash,
      ...updateMessageDto,
    });
    if (!message) {
      throw new Error(`Message ${messageHash} not found`);
    }
    return this.messagesRepository.save(message);
  }

  async remove(messageHash: string): Promise<void> {
    const message = await this.findOne(messageHash);
    await this.messagesRepository.remove(message);
  }

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
    // Start constructing the query
    const queryBuilder = this.messagesRepository
      .createQueryBuilder('message')
      .select(
        "TO_CHAR(TO_TIMESTAMP(message.origin_block_timestamp), 'YYYY-MM-DD')",
        'date',
      )
      .addSelect('COUNT(*)', 'message_count') // Total message count
      .addSelect(
        "SUM(CASE WHEN message.status = 'success' THEN 1 ELSE 0 END)",
        'message_count_success',
      )
      .addSelect(
        "SUM(CASE WHEN message.status = 'failed' THEN 1 ELSE 0 END)",
        'message_count_failed',
      );

    // Apply initial filter for the date range first
    queryBuilder.where(
      'message.origin_block_timestamp BETWEEN :startTime AND :endTime',
      {
        startTime,
        endTime,
      },
    );

    // Only apply the paraId filter and additional select/group if paraIds are provided
    if (paraIds.length > 0) {
      console.log(paraIds); // Good for debugging
      queryBuilder
        .andWhere('message.origin_para_id IN (:...paraIds)', { paraIds }) // Filter by paraIds
        .addSelect('message.origin_para_id', 'paraId') // Need paraId for grouping and output
        .groupBy(
          "message.origin_para_id, TO_CHAR(TO_TIMESTAMP(message.origin_block_timestamp), 'YYYY-MM-DD')",
        );
    } else {
      // When no paraIds are provided, group only by date
      queryBuilder.groupBy(
        "TO_CHAR(TO_TIMESTAMP(message.origin_block_timestamp), 'YYYY-MM-DD')",
      );
    }

    // Apply order based on whether paraIds are provided
    queryBuilder.orderBy(
      paraIds.length > 0 ? 'message.origin_para_id, date' : 'date',
    );

    // Log the final SQL query and parameters to verify correctness
    const queryAndParameters = queryBuilder.getQueryAndParameters();
    console.log(queryAndParameters);

    const data = await queryBuilder.getRawMany();
    return data.map((d) => ({
      paraId: d.paraId ? parseInt(d.paraId, 10) : undefined, // Handle absence of paraId when paraIds is empty
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
      // Define separate queries for origin and destination
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

      // Execute both queries
      const originResults = await originQuery.getRawMany();
      const destinationResults = await destinationQuery.getRawMany();

      // Aggregate counts for each paraId
      const totalCounts = new Map();
      [...originResults, ...destinationResults].forEach((result) => {
        const count = totalCounts.get(result.paraId) || 0;
        totalCounts.set(result.paraId, count + parseInt(result.totalCount, 10));
      });

      // Convert the Map to an array of objects
      return Array.from(totalCounts.entries()).map(([paraId, totalCount]) => ({
        paraId: parseInt(paraId, 10),
        totalCount,
      }));
    } else {
      const queryBuilder =
        this.messagesRepository.createQueryBuilder('message');

      // Apply where clause first to narrow down the results right away
      queryBuilder.where(
        'message.origin_block_timestamp BETWEEN :startTime AND :endTime',
        {
          startTime,
          endTime,
        },
      );

      // Depending on the count option, select and group by the appropriate paraId
      if (countBy === CountOption.ORIGIN) {
        queryBuilder
          .select('message.origin_para_id', 'paraId') // Select with alias
          .addGroupBy('message.origin_para_id'); // Group by actual field
      } else if (countBy === CountOption.DESTINATION) {
        queryBuilder
          .select('message.dest_para_id', 'paraId') // Select with alias
          .addGroupBy('message.dest_para_id'); // Group by actual field
      }

      // Add select for count after setting up primary select to ensure it is not overridden
      queryBuilder.addSelect('COUNT(*)', 'totalCount');

      // Execute the query and return results
      const results = await queryBuilder.getRawMany();
      return results.map((result) => ({
        paraId: result.paraId,
        totalCount: parseInt(result.totalCount, 10), // Ensure the totalCount is parsed to int
      }));
    }
  }

  async countAssetsBySymbol(
    paraIds: number[],
    startTime: number,
    endTime: number,
  ): Promise<AssetCount[]> {
    let query = '';
    const queryParameters: any[] = [startTime, endTime];

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
        ORDER BY origin_para_id, count DESC;
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

    const result = await this.messagesRepository.query(query, queryParameters);

    const transformedResult = result.map((r) => {
      return paraIds.length > 0
        ? {
            paraId: r.origin_para_id,
            symbol: r.symbol,
            count: parseInt(r.count),
          }
        : {
            symbol: r.symbol,
            count: parseInt(r.count),
          };
    });

    return transformedResult;
  }

  async getAccountXcmCounts(
    paraIds: number[],
    threshold: number,
    startTime: number,
    endTime: number,
  ): Promise<any> {
    const whereConditions = [];
    const parameters = [];

    // Adding time range filters
    whereConditions.push('origin_block_timestamp BETWEEN $1 AND $2');
    parameters.push(startTime, endTime);

    // Handling paraId filtering
    if (paraIds.length > 0) {
      whereConditions.push(
        `origin_para_id IN (${paraIds.map((_, index) => `$${index + 3}`).join(', ')})`,
      );
      parameters.push(...paraIds);
    }

    const query = `
      SELECT from_account_id, COUNT(*) as message_count
      FROM messages
      ${whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : ''}
      GROUP BY from_account_id
      HAVING COUNT(*) > $${parameters.length + 1}
      ORDER BY message_count DESC;
    `;

    parameters.push(threshold); // Add threshold as the last parameter

    const result = await this.messagesRepository.query(query, parameters);

    return result.map((account) => ({
      id: account.from_account_id,
      count: parseInt(account.message_count, 10),
    }));
  }
}
