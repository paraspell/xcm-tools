import { Injectable } from '@nestjs/common';
import {
  getParaId,
  getRelayChainOf,
  getTChain,
  TRelaychain,
  TSubstrateChain,
} from '@paraspell/sdk';

import { PrismaService } from '../prisma/prisma.service.js';
import {
  AccountXcmCountResult,
  AssetCountResult,
  CountOption,
  ParaIdAssetCountResult,
} from '../types.js';
import {
  AccountXcmCountType,
  AssetCount,
  MessageCount,
  MessageCountByDay,
  MessageCountByStatus,
} from './models/index.js';

@Injectable()
export class MessageService {
  constructor(private readonly prisma: PrismaService) {}

  async countMessagesByStatus(
    ecosystem: string | undefined = undefined,
    parachains: TSubstrateChain[] = [],
    startTime: number,
    endTime: number,
  ): Promise<MessageCountByStatus[]> {
    if (parachains.length > 0) {
      const results = await Promise.all(
        parachains.map(async (parachain) => {
          const paraId = getParaId(parachain);
          const ecosystem = getRelayChainOf(parachain).toLowerCase();

          const successCount = await this.prisma.messages.count({
            where: {
              ecosystem: ecosystem,
              origin_para_id: paraId,
              status: 'success',
              origin_block_timestamp: { gte: startTime, lte: endTime },
            },
          });
          const failedCount = await this.prisma.messages.count({
            where: {
              ecosystem: ecosystem,
              origin_para_id: paraId,
              status: 'failed',
              origin_block_timestamp: { gte: startTime, lte: endTime },
            },
          });

          return {
            ecosystem: ecosystem,
            parachain,
            success: successCount,
            failed: failedCount,
          };
        }),
      );

      return results;
    }

    const successCount = await this.prisma.messages.count({
      where: {
        ecosystem: ecosystem,
        status: 'success',
        origin_block_timestamp: { gte: startTime, lte: endTime },
      },
    });
    const failedCount = await this.prisma.messages.count({
      where: {
        ecosystem: ecosystem,
        status: 'failed',
        origin_block_timestamp: { gte: startTime, lte: endTime },
      },
    });

    return [{ ecosystem, success: successCount, failed: failedCount }];
  }

  async countMessagesByDay(
    ecosystem: string,
    parachains: TSubstrateChain[],
    startTime: number,
    endTime: number,
  ): Promise<MessageCountByDay[]> {
    if (!ecosystem) return [];

    if (!parachains?.length) {
      const query = `
      SELECT
        TO_CHAR(TO_TIMESTAMP(origin_block_timestamp), 'YYYY-MM-DD') AS date,
        COUNT(*) AS message_count,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS message_count_success,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS message_count_failed
      FROM messages
      WHERE ecosystem = $1
        AND origin_block_timestamp BETWEEN $2 AND $3
      GROUP BY date
      ORDER BY date ASC;
    `;

      const rows: {
        date: string;
        message_count: string;
        message_count_success: string;
        message_count_failed: string;
      }[] = await this.prisma.$queryRawUnsafe(
        query,
        ecosystem.toLowerCase(),
        startTime,
        endTime,
      );

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
      ecoToParaIds.get(eco)?.push(id);
      keyToName.set(`${eco}:${id}`, name);
    }

    const out: MessageCountByDay[] = [];

    for (const [eco, idsRaw] of ecoToParaIds.entries()) {
      const paraIds = Array.from(new Set(idsRaw));

      const query = `
      SELECT
        origin_para_id AS "paraId",
        TO_CHAR(TO_TIMESTAMP(origin_block_timestamp), 'YYYY-MM-DD') AS date,
        COUNT(*) AS message_count,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS message_count_success,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS message_count_failed
      FROM messages
      WHERE ecosystem = $1
        AND origin_para_id = ANY($2::int[])
        AND origin_block_timestamp BETWEEN $3 AND $4
      GROUP BY origin_para_id, date
      ORDER BY origin_para_id ASC, date ASC;
    `;

      const rows: {
        paraId: string;
        date: string;
        message_count: string;
        message_count_success: string;
        message_count_failed: string;
      }[] = await this.prisma.$queryRawUnsafe(
        query,
        eco,
        paraIds,
        startTime,
        endTime,
      );

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
      const query = `
      SELECT para_id, SUM(total_count) AS total_count FROM (
        SELECT origin_para_id AS para_id, COUNT(*) AS total_count
        FROM messages
        WHERE ecosystem = $1
          AND origin_block_timestamp BETWEEN $2 AND $3
        GROUP BY origin_para_id

        UNION ALL

        SELECT dest_para_id AS para_id, COUNT(*) AS total_count
        FROM messages
        WHERE ecosystem = $1
          AND origin_block_timestamp BETWEEN $2 AND $3
        GROUP BY dest_para_id
      ) AS combined
      GROUP BY para_id;
    `;

      const results: { para_id: string; total_count: string }[] =
        await this.prisma.$queryRawUnsafe(query, ecosystem, startTime, endTime);

      return results.map((r) => ({
        ecosystem,
        paraId: parseInt(r.para_id, 10),
        totalCount: parseInt(r.total_count, 10),
      }));
    }

    const column =
      countBy === CountOption.ORIGIN ? 'origin_para_id' : 'dest_para_id';

    const countObj =
      countBy === CountOption.ORIGIN
        ? { origin_para_id: true as const }
        : { dest_para_id: true as const };

    const results = await this.prisma.messages.groupBy({
      by: [column],
      where: {
        ecosystem,
        origin_block_timestamp: { gte: startTime, lte: endTime },
      },
      _count: countObj,
    });

    return results
      .filter((r) => r[column] !== null)
      .map((r) => ({
        ecosystem,
        paraId: r[column] as number,
        totalCount:
          countBy === CountOption.ORIGIN
            ? Number(r._count.origin_para_id)
            : Number(r._count.dest_para_id),
      }));
  }

  async countAssetsBySymbol(
    ecosystem: string,
    parachains: TSubstrateChain[],
    startTime: number,
    endTime: number,
  ): Promise<AssetCount[]> {
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

      const results: ParaIdAssetCountResult[] =
        await this.prisma.$queryRawUnsafe(
          query,
          paraIds,
          ecosystems,
          startTime,
          endTime,
        );

      return results.map((r) => {
        const paraId = r.origin_para_id;
        const eco = r.ecosystem;
        return {
          ecosystem: eco,
          parachain: getTChain(
            paraId,
            (eco[0].toUpperCase() + eco.slice(1)) as TRelaychain,
          ) as string,
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

    const results: AssetCountResult[] = await this.prisma.$queryRawUnsafe(
      query,
      ecosystem,
      startTime,
      endTime,
    );

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
    const whereConditions: string[] = [
      'ecosystem = $1',
      'origin_block_timestamp BETWEEN $2 AND $3',
      "from_account_id <> ''",
    ];

    const parameters: (string | number)[] = [ecosystem, startTime, endTime];

    if (paraIds.length > 0) {
      const inClause = paraIds
        .map((_, idx) => `$${idx + 4}`) // $4, $5, ...
        .join(', ');
      whereConditions.push(`origin_para_id IN (${inClause})`);
      parameters.push(...paraIds);
    }
    parameters.push(threshold);

    const query = `
    SELECT from_account_id, COUNT(*) as message_count
    FROM messages
    WHERE ${whereConditions.join(' AND ')}
    GROUP BY from_account_id
    HAVING COUNT(*) > $${parameters.length}
    ORDER BY message_count DESC;
  `;
    const results: AccountXcmCountResult[] = await this.prisma.$queryRawUnsafe(
      query,
      ...parameters,
    );

    return results.map((r) => ({
      ecosystem,
      id: r.from_account_id,
      count: parseInt(r.message_count, 10),
    }));
  }
}
