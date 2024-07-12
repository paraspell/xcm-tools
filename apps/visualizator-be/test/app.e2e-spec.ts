import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app/app.module';
import * as request from 'supertest';

describe('XCM API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('Channels', () => {
    describe('findAll', () => {
      it('findAll channels within a specific time range', () => {
        const startTime = new Date('2022-01-01T00:00:00Z');
        const endTime = new Date('2023-01-02T00:00:00Z');

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
            query channels($startTime: Timestamp!, $endTime: Timestamp!) {
              channels(startTime: $startTime, endTime: $endTime) {
                id
                sender
                recipient
                message_count
              }
            }
          `,
            variables: {
              startTime: startTime.getTime() / 1000,
              endTime: endTime.getTime() / 1000,
            },
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.data.channels).toBeInstanceOf(Array);
            expect(res.body.data.channels.length).toBeGreaterThan(0);
          });
      });

      it('findAll channels within a time range with no expected data', () => {
        const startTime = new Date('2024-07-01T00:00:00Z');
        const endTime = new Date('2024-07-02T00:00:00Z');

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
            query channels($startTime: Timestamp!, $endTime: Timestamp!) {
              channels(startTime: $startTime, endTime: $endTime) {
                id
                sender
                recipient
                message_count
              }
            }
          `,
            variables: {
              startTime: startTime.getTime() / 1000,
              endTime: endTime.getTime() / 1000,
            },
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.data.channels).toEqual([]);
          });
      });
    });

    describe('findOne', () => {
      it('findOne channel with a valid ID', () => {
        const channelId = 1;
        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
              query GetChannel($id: Int!) {
                channel(id: $id) {
                  id
                  sender
                  recipient
                  message_count
                }
              }
            `,
            variables: {
              id: channelId,
            },
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.data.channel).toEqual({
              id: channelId,
              sender: expect.any(Number),
              recipient: expect.any(Number),
              message_count: expect.any(Number),
            });
          });
      });

      it('findOne channel with an invalid ID', () => {
        const invalidChannelId = 9999;
        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
              query GetChannel($id: Int!) {
                channel(id: $id) {
                  id
                  sender
                  recipient
                  message_count
                }
              }
            `,
            variables: {
              id: invalidChannelId,
            },
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.errors).toBeInstanceOf(Array);
            expect(res.body.data).toBeNull();
          });
      });
    });
  });

  describe('Messages', () => {
    describe('messageCounts', () => {
      it('messageCounts with valid paraIds and time range', async () => {
        const paraIds = [2012, 2004];
        const startTime = new Date('2023-01-01T00:00:00Z');
        const endTime = new Date('2023-01-31T23:59:59Z');

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
              query messageCounts($paraIds: [Int!], $startTime: Timestamp!, $endTime: Timestamp!) {
                messageCounts(paraIds: $paraIds, startTime: $startTime, endTime: $endTime) {
                  paraId
                  success
                  failed
                }
              }
          `,
            variables: {
              paraIds: paraIds,
              startTime: startTime.getTime() / 1000,
              endTime: endTime.getTime() / 1000,
            },
          })
          .expect(200);

        expect(response.body.data.messageCounts).toBeInstanceOf(Array);
        expect(response.body.data.messageCounts.length).toBeGreaterThan(0);
        response.body.data.messageCounts.forEach((count) => {
          expect(count).toMatchObject({
            paraId: expect.any(Number),
            success: expect.any(Number),
            failed: expect.any(Number),
          });
        });
      });

      it('messageCounts with valid paraIds and no data expected in the time range', async () => {
        const paraIds = [2012, 2004];
        const startTime = new Date('2025-07-01T00:00:00Z');
        const endTime = new Date('2025-07-31T23:59:59Z');

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
              query messageCounts($paraIds: [Int!], $startTime: Timestamp!, $endTime: Timestamp!) {
                messageCounts(paraIds: $paraIds, startTime: $startTime, endTime: $endTime) {
                  paraId
                  success
                  failed
                }
              }
          `,
            variables: {
              paraIds: paraIds,
              startTime: startTime.getTime() / 1000,
              endTime: endTime.getTime() / 1000,
            },
          })
          .expect(200);

        expect(response.body.data.messageCounts).toEqual([
          {
            paraId: 2012,
            success: 0,
            failed: 0,
          },
          {
            paraId: 2004,
            success: 0,
            failed: 0,
          },
        ]);
      });
    });

    describe('messageCountsByDay', () => {
      it('messageCountsByDay with valid paraIds and known time range', async () => {
        const paraIds = [2012, 2004];
        const startTime = new Date('2023-01-01T00:00:00Z');
        const endTime = new Date('2023-01-07T23:59:59Z');

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
              query messageCountsByDay($paraIds: [Int!], $startTime: Timestamp!, $endTime: Timestamp!) {
                messageCountsByDay(paraIds: $paraIds, startTime: $startTime, endTime: $endTime) {
                  paraId
                  date
                  messageCount
                  messageCountSuccess
                  messageCountFailed
                }
              }
          `,
            variables: {
              paraIds: paraIds,
              startTime: startTime.getTime() / 1000,
              endTime: endTime.getTime() / 1000,
            },
          })
          .expect(200);

        expect(response.body.data.messageCountsByDay).toBeInstanceOf(Array);
        expect(response.body.data.messageCountsByDay.length).toBeGreaterThan(0);
        response.body.data.messageCountsByDay.forEach((count) => {
          expect(count).toMatchObject({
            paraId: expect.any(Number),
            date: expect.any(String),
            messageCount: expect.any(Number),
            messageCountSuccess: expect.any(Number),
            messageCountFailed: expect.any(Number),
          });
        });
      });

      it('messageCountsByDay with valid paraIds and known time range', async () => {
        const paraIds = [2012, 2004];
        const startTime = new Date('2023-01-01T00:00:00Z');
        const endTime = new Date('2023-01-07T23:59:59Z');

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
              query messageCountsByDay($paraIds: [Int!], $startTime: Timestamp!, $endTime: Timestamp!) {
                messageCountsByDay(paraIds: $paraIds, startTime: $startTime, endTime: $endTime) {
                  paraId
                  date
                  messageCount
                  messageCountSuccess
                  messageCountFailed
                }
              }
            `,
            variables: {
              paraIds: paraIds,
              startTime: startTime.getTime() / 1000,
              endTime: endTime.getTime() / 1000,
            },
          })
          .expect(200);

        expect(response.body.data.messageCountsByDay).toBeInstanceOf(Array);
        expect(response.body.data.messageCountsByDay.length).toBeGreaterThan(0);
        response.body.data.messageCountsByDay.forEach((count) => {
          expect(count).toMatchObject({
            paraId: expect.any(Number),
            date: expect.any(String),
            messageCount: expect.any(Number),
            messageCountSuccess: expect.any(Number),
            messageCountFailed: expect.any(Number),
          });
        });
      });
    });

    describe('assetCountsBySymbol', () => {
      it('assetCountsBySymbol with valid paraIds and time range with expected data', async () => {
        const paraIds = [2012, 2004];
        const startTime = new Date('2023-01-01T00:00:00Z');
        const endTime = new Date('2023-01-07T23:59:59Z');

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
              query assetCountsBySymbol($paraIds: [Int!], $startTime: Timestamp!, $endTime: Timestamp!) {
                assetCountsBySymbol(paraIds: $paraIds, startTime: $startTime, endTime: $endTime) {
                  paraId
                  symbol
                  count
                }
              }
            `,
            variables: {
              paraIds: paraIds,
              startTime: startTime.getTime() / 1000,
              endTime: endTime.getTime() / 1000,
            },
          })
          .expect(200);

        expect(response.body.data.assetCountsBySymbol).toBeInstanceOf(Array);
        expect(response.body.data.assetCountsBySymbol.length).toBeGreaterThan(
          0,
        );
        response.body.data.assetCountsBySymbol.forEach((count) => {
          expect(count).toMatchObject({
            paraId: expect.any(Number),
            symbol: expect.any(String),
            count: expect.any(Number),
          });
        });
      });

      it('assetCountsBySymbol with valid paraIds and time range with no expected data', async () => {
        const paraIds = [2012, 2004];
        const startTime = new Date('2025-01-01T00:00:00Z');
        const endTime = new Date('2025-01-07T23:59:59Z');

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
              query assetCountsBySymbol($paraIds: [Int!], $startTime: Timestamp!, $endTime: Timestamp!) {
                assetCountsBySymbol(paraIds: $paraIds, startTime: $startTime, endTime: $endTime) {
                  paraId
                  symbol
                  count
                }
              }
            `,
            variables: {
              paraIds: paraIds,
              startTime: startTime.getTime() / 1000,
              endTime: endTime.getTime() / 1000,
            },
          })
          .expect(200);

        expect(response.body.data.assetCountsBySymbol).toEqual([]);
      });
    });

    describe('accountCounts', () => {
      it('accountCounts with accounts exceeding the specified threshold', async () => {
        const threshold = 10;
        const paraIds = [2012, 2004];
        const startTime = new Date('2023-01-01T00:00:00Z');
        const endTime = new Date('2023-01-31T23:59:59Z');

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
              query accountCounts(
                $threshold: Int!
                $paraIds: [Int!]
                $startTime: Timestamp!
                $endTime: Timestamp!
              ) {
                accountCounts(
                  threshold: $threshold
                  paraIds: $paraIds
                  startTime: $startTime
                  endTime: $endTime
                ) {
                  id
                  count
                }
              }
            `,
            variables: {
              threshold: threshold,
              paraIds: paraIds,
              startTime: startTime.getTime() / 1000,
              endTime: endTime.getTime() / 1000,
            },
          })
          .expect(200);

        expect(response.body.data.accountCounts).toBeInstanceOf(Array);
        expect(response.body.data.accountCounts.length).toBeGreaterThan(0);
        response.body.data.accountCounts.forEach((account) => {
          expect(account).toMatchObject({
            id: expect.any(String),
            count: expect.any(Number),
          });
          expect(account.count).toBeGreaterThan(threshold);
        });
      });

      it('accountCounts with no accounts exceeding the specified threshold', async () => {
        const threshold = 100;
        const paraIds = [2012, 2004];
        const startTime = new Date('2023-01-01T00:00:00Z');
        const endTime = new Date('2023-01-02T23:59:59Z');

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
              query accountCounts(
                $threshold: Int!
                $paraIds: [Int!]
                $startTime: Timestamp!
                $endTime: Timestamp!
              ) {
                accountCounts(
                  threshold: $threshold
                  paraIds: $paraIds
                  startTime: $startTime
                  endTime: $endTime
                ) {
                  id
                  count
                }
              }
            `,
            variables: {
              threshold: threshold,
              paraIds: paraIds,
              startTime: startTime.getTime() / 1000,
              endTime: endTime.getTime() / 1000,
            },
          })
          .expect(200);

        expect(response.body.data.accountCounts).toEqual([]);
      });
    });

    describe('totalMessageCounts', () => {
      it('totalMessageCounts over a specified period with data', async () => {
        const startTime = new Date('2023-01-01T00:00:00Z');
        const endTime = new Date('2023-01-31T23:59:59Z');
        const countBy = 'ORIGIN';

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
              query totalMessageCounts($startTime: Timestamp!, $endTime: Timestamp!, $countBy: CountOption!) {
                totalMessageCounts(startTime: $startTime, endTime: $endTime, countBy: $countBy) {
                  paraId
                  totalCount
                }
              }
            `,
            variables: {
              startTime: startTime.getTime() / 1000,
              endTime: endTime.getTime() / 1000,
              countBy: countBy,
            },
          })
          .expect(200);

        console.log(response.body);

        expect(response.body.data.totalMessageCounts).toBeInstanceOf(Array);
        expect(response.body.data.totalMessageCounts.length).toBeGreaterThan(0);
        response.body.data.totalMessageCounts.forEach((count) => {
          expect(count).toMatchObject({
            paraId: expect.any(Number),
            totalCount: expect.any(Number),
          });
          expect(count.totalCount).toBeGreaterThan(0);
        });
      });

      it('totalMessageCounts over a specified period with no expected data', async () => {
        const startTime = new Date('2025-01-01T00:00:00Z');
        const endTime = new Date('2025-01-31T23:59:59Z');
        const countBy = 'ORIGIN';

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
              query totalMessageCounts($startTime: Timestamp!, $endTime: Timestamp!, $countBy: CountOption!) {
                totalMessageCounts(startTime: $startTime, endTime: $endTime, countBy: $countBy) {
                  paraId
                  totalCount
                }
              }
            `,
            variables: {
              startTime: startTime.getTime() / 1000,
              endTime: endTime.getTime() / 1000,
              countBy: countBy,
            },
          })
          .expect(200);

        expect(response.body.data.totalMessageCounts).toEqual([]);
      });
    });
  });
});
