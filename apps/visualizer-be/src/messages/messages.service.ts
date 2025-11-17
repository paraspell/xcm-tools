import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  getParaId,
  getRelayChainOf,
  getTChain,
  TRelaychain,
  TSubstrateChain,
} from '@paraspell/sdk';
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
    ecosystem: string = null,
    parachains: TSubstrateChain[] = [],
    startTime: number,
    endTime: number,
  ): Promise<MessageCountByStatus[]> {
    if (parachains.length > 0) {
      const results = await Promise.all(
        parachains.map(async (parachain) => {
          const paraId = getParaId(parachain);
          const ecosystem = getRelayChainOf(parachain).toLowerCase();

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
            parachain,
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
    parachains: TSubstrateChain[],
    startTime: number,
    endTime: number,
  ): Promise<MessageCountByDay[]> {
    const base = () =>
      this.messagesRepository
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
        )
        .where(
          'message.origin_block_timestamp BETWEEN :startTime AND :endTime',
          { startTime, endTime },
        );

    if (!parachains?.length) {
      if (!ecosystem) return [];

      const qb = base()
        .andWhere('message.ecosystem = :ecosystem', {
          ecosystem: ecosystem.toLowerCase(),
        })
        .groupBy(
          "TO_CHAR(TO_TIMESTAMP(message.origin_block_timestamp), 'YYYY-MM-DD')",
        )
        .orderBy('date', 'ASC');

      const rows: {
        date: string;
        message_count: string;
        message_count_success: string;
        message_count_failed: string;
      }[] = await qb.getRawMany();

      return rows.map((r) => ({
        ecosystem: ecosystem.toLowerCase(),
        parachain: undefined,
        date: r.date,
        messageCount: parseInt(r.message_count, 10),
        messageCountSuccess: parseInt(r.message_count_success, 10),
        messageCountFailed: parseInt(r.message_count_failed, 10),
      }));
    }

    const ecoToParaIds = new Map<string, number[]>();
    const keyToName = new Map<string, string>();

    for (const name of new Set(parachains)) {
      const eco = getRelayChainOf(name).toLowerCase();
      const id = getParaId(name);
      if (!ecoToParaIds.has(eco)) ecoToParaIds.set(eco, []);
      ecoToParaIds.get(eco).push(id);
      keyToName.set(`${eco}:${id}`, name);
    }

    const out: MessageCountByDay[] = [];

    for (const [eco, idsRaw] of ecoToParaIds.entries()) {
      const paraIds = Array.from(new Set(idsRaw));

      const qb = base()
        .andWhere('message.ecosystem = :ecosystem', { ecosystem: eco })
        .andWhere('message.origin_para_id IN (:...paraIds)', { paraIds })
        .addSelect('message.origin_para_id', 'paraId')
        .groupBy(
          "message.origin_para_id, TO_CHAR(TO_TIMESTAMP(message.origin_block_timestamp), 'YYYY-MM-DD')",
        )
        .orderBy('message.origin_para_id', 'ASC')
        .addOrderBy('date', 'ASC');

      const rows: {
        paraId: string;
        date: string;
        message_count: string;
        message_count_success: string;
        message_count_failed: string;
      }[] = await qb.getRawMany();

      for (const r of rows) {
        const id = parseInt(r.paraId, 10);
        out.push({
          ecosystem: eco,
          parachain: keyToName.get(`${eco}:${id}`),
          date: r.date,
          messageCount: parseInt(r.message_count, 10),
          messageCountSuccess: parseInt(r.message_count_success, 10),
          messageCountFailed: parseInt(r.message_count_failed, 10),
        });
      }
    }

    return out;
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
    parachains: TSubstrateChain[],
    startTime: number,
    endTime: number,
  ): Promise<AssetCount[]> {
    const baseParams: (string | number | number[])[] = [
      ecosystem,
      startTime,
      endTime,
    ];

    if (parachains.length > 0) {
      const paraIds = parachains.map((p) => getParaId(p));
      const ecosystems = parachains.map((p) =>
        getRelayChainOf(p).toLowerCase(),
      );

      const query = `
      WITH selected_paras AS (
        SELECT UNNEST($1::int[])  AS para_id,
               UNNEST($2::text[]) AS ecosystem
      ),
      asset_rows AS (
        SELECT
          m.ecosystem,
          m.origin_para_id,
          (a.elem->>'symbol')                   AS symbol,
          NULLIF(a.elem->>'decimals','')::int   AS decimals,
          NULLIF(a.elem->>'amount','')::numeric AS amount_num
        FROM messages m
        JOIN selected_paras sp
          ON sp.para_id   = m.origin_para_id
         AND sp.ecosystem = m.ecosystem
        CROSS JOIN LATERAL jsonb_array_elements(COALESCE(m.assets, '[]'::jsonb)) AS a(elem)
        WHERE
          m.origin_block_timestamp BETWEEN $3 AND $4
      )
      SELECT
        ecosystem,
        origin_para_id,
        symbol,
        MAX(decimals)                                           AS decimals,
        COUNT(*)                                                AS count,
        SUM(amount_num) / POWER(10::numeric, MAX(decimals))     AS amount
      FROM asset_rows
      WHERE
        symbol IS NOT NULL AND symbol <> ''
        AND decimals IS NOT NULL
        AND amount_num IS NOT NULL
      GROUP BY ecosystem, origin_para_id, symbol
      ORDER BY count DESC, origin_para_id;
    `;

      const results = await this.messagesRepository.query<
        ParaIdAssetCountResult[]
      >(query, [paraIds, ecosystems, startTime, endTime]);

      return results.map((r) => {
        const paraId = r.origin_para_id;
        const ecosystem = r.ecosystem;
        return {
          ecosystem: ecosystem,
          parachain: getTChain(
            paraId,
            (ecosystem[0].toUpperCase() + ecosystem.slice(1)) as TRelaychain,
          ),
          symbol: r.symbol,
          count: parseInt(r.count, 10),
          amount: r.amount,
        };
      });
    }

    const query = `
    WITH asset_rows AS (
      SELECT
        m.origin_para_id,
        (a.elem->>'symbol')                   AS symbol,
        NULLIF(a.elem->>'decimals','')::int   AS decimals,
        NULLIF(a.elem->>'amount','')::numeric AS amount_num
      FROM messages m
      CROSS JOIN LATERAL jsonb_array_elements(COALESCE(m.assets, '[]'::jsonb)) AS a(elem)
      WHERE
        m.ecosystem = $1
        AND m.origin_block_timestamp BETWEEN $2 AND $3
    )
    SELECT
      symbol,
      MAX(decimals)                                           AS decimals,
      COUNT(*)                                                AS count,
      SUM(amount_num) / POWER(10::numeric, MAX(decimals))     AS amount
    FROM asset_rows
    WHERE
      symbol IS NOT NULL AND symbol <> ''
      AND decimals IS NOT NULL
      AND amount_num IS NOT NULL
    GROUP BY symbol
    ORDER BY count DESC;
  `;

    const results = await this.messagesRepository.query<
      (ParaIdAssetCountResult | AssetCountResult)[]
    >(query, baseParams);

    return results.map((r) => ({
      ecosystem,
      symbol: r.symbol,
      count: parseInt(r.count, 10),
      amount: r.amount,
    }));
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
    whereConditions.push("from_account_id <> ''");
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

    return results.map((a) => ({
      ecosystem,
      id: a.from_account_id,
      count: parseInt(a.message_count, 10),
    }));
  }
}
