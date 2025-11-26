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

  afterAll(async () => {
    await app.close();
  });

  describe('Channels', () => {
    describe('findAll', () => {
      it('findAll channels in a specific ecosystem', () => {
        const ecosystem = 'kusama';

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
            query channels($ecosystem: String!) {
              channels(ecosystem: $ecosystem) {
                id
                sender
                recipient
                message_count
              }
            }
          `,
            variables: {
              ecosystem,
            },
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.data.channels).toBeInstanceOf(Array);
            expect(res.body.data.channels.length).toBeGreaterThan(0);
          });
      });

      it('findAll channels in a specific ecosystem with no expected data', () => {
        const ecosystem = 'wrong';


        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
            query channels($ecosystem: String!) {
              channels(ecosystem: $ecosystem) {
                id
                sender
                recipient
                message_count
              }
            }
          `,
            variables: {
              ecosystem
            },
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.data.channels).toEqual([]);
          });
      });
    });

    describe('channelsInInterval', () => {
      it('channelsInInterval within a specific time range', () => {
        const startTime = new Date('2022-01-01T00:00:00Z');
        const endTime = new Date('2026-01-02T00:00:00Z');
        const ecosystem = 'kusama';

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
            query channelsInInterval($ecosystem: String!, $startTime: Timestamp!, $endTime: Timestamp!) {
              channelsInInterval(ecosystem: $ecosystem,startTime: $startTime, endTime: $endTime) {
                id
                sender
                recipient
                message_count
              }
            }
          `,
            variables: {
              ecosystem,
              startTime: startTime.getTime() / 1000,
              endTime: endTime.getTime() / 1000,
            },
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.data.channelsInInterval).toBeInstanceOf(Array);
            expect(res.body.data.channelsInInterval.length).toBeGreaterThan(0);
          });
      });

      it('channelsInInterval within a time range with no expected data', () => {
        const startTime = new Date('2018-07-01T00:00:00Z');
        const endTime = new Date('2018-07-02T00:00:00Z');
        const ecosystem = 'kusama';

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
            query channelsInInterval($ecosystem: String!, $startTime: Timestamp!, $endTime: Timestamp!) {
              channelsInInterval(ecosystem: $ecosystem, startTime: $startTime, endTime: $endTime) {
                id
                sender
                recipient
                message_count
              }
            }
          `,
            variables: {
              ecosystem,
              startTime: startTime.getTime() / 1000,
              endTime: endTime.getTime() / 1000,
            },
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.data.channelsInInterval).toEqual([]);
          });
      });
    });

    describe('findOne', () => {
      it('findOne channel with a valid ID', () => {
        const sender = 2000;
        const recipient = 2090;
        const ecosystem = 'kusama';

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
              query GetChannel($ecosystem: String!, $sender: Int!, $recipient: Int!) {
                channel(ecosystem: $ecosystem, sender: $sender, recipient: $recipient) {
                  id
                  sender
                  recipient
                  message_count
                }
              }
            `,
            variables: {
              ecosystem,
              sender,
              recipient,
            },
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.data.channel).toEqual({
              id: expect.any(Number),
              sender: expect.any(Number),
              recipient: expect.any(Number),
              message_count: expect.any(Number),
            });
          });
      });

      it('findOne channel with an invalid ID', () => {
        const sender = 1;
        const recipient = 2;
        const ecosystem = 'kusama';

        return request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
              query GetChannel($ecosystem: String!, $sender: Int!, $recipient: Int!) {
                channel(ecosystem: $ecosystem, sender: $sender, recipient: $recipient) {
                  id
                  sender
                  recipient
                  message_count
                }
              }
            `,
            variables: {
              ecosystem,
              sender,
              recipient,
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
      it('messageCounts with valid parachains and time range', async () => {
        let parachains = ['AssetHubPolkadot', 'Acala'];
        const startTime = new Date('2018-01-20T00:00:00Z');
        const endTime = new Date('2025-02-10T23:59:59Z');
        const ecosystem = 'polkadot';

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
              query messageCounts($ecosystem: String, $parachains: [String!]!, $startTime: Timestamp!, $endTime: Timestamp!) {
                messageCounts(ecosystem: $ecosystem, parachains: $parachains, startTime: $startTime, endTime: $endTime) {
                  parachain
                  success
                  failed
                }
              }
          `,
            variables: {
              ecosystem,
              parachains: parachains,
              startTime: startTime.getTime() / 1000,
              endTime: endTime.getTime() / 1000,
            },
          })
          .expect(200);

        expect(response.body.data.messageCounts).toBeInstanceOf(Array);
        expect(response.body.data.messageCounts.length).toBeGreaterThan(0);
        response.body.data.messageCounts.forEach((count) => {
          expect(count).toMatchObject({
            parachain: expect.any(String),
            success: expect.any(Number),
            failed: expect.any(Number),
          });
        });
      });

      it('messageCounts with valid parachains and time range with no expected data', async () => {
        const parachains = ['AssetHubPolkadot', 'Acala'];
        const startTime = new Date('2017-07-01T00:00:00Z');
        const endTime = new Date('2017-07-31T23:59:59Z');
        const ecosystem = 'polkadot';

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
              query messageCounts($ecosystem: String, $parachains: [String!]!, $startTime: Timestamp!, $endTime: Timestamp!) {
                messageCounts(ecosystem: $ecosystem, parachains: $parachains, startTime: $startTime, endTime: $endTime) {
                  parachain
                  success
                  failed
                }
              }
          `,
            variables: {
              ecosystem,
              parachains,
              startTime: startTime.getTime() / 1000,
              endTime: endTime.getTime() / 1000,
            },
          })
          .expect(200);

        expect(response.body.data.messageCounts).toEqual([
          {
            parachain: 'AssetHubPolkadot',
            success: 0,
            failed: 0,
          },
          {
            parachain: 'Acala',
            success: 0,
            failed: 0,
          },
        ]);
      });
    });

    describe('messageCountsByDay', () => {
      it('messageCountsByDay with valid parachains and known time range', async () => {
        const parachains = ['AssetHubPolkadot', 'Acala'];
        const startTime = new Date('2023-01-01T00:00:00Z');
        const endTime = new Date('2023-01-07T23:59:59Z');
        const ecosystem = 'polkadot';

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
              query messageCountsByDay($ecosystem: String!, $parachains: [String!]!, $startTime: Timestamp!, $endTime: Timestamp!) {
                messageCountsByDay(ecosystem: $ecosystem, parachains: $parachains, startTime: $startTime, endTime: $endTime) {
                  parachain
                  date
                  messageCount
                  messageCountSuccess
                  messageCountFailed
                }
              }
          `,
            variables: {
              ecosystem,
              parachains,
              startTime: startTime.getTime() / 1000,
              endTime: endTime.getTime() / 1000,
            },
          })
          .expect(200);

        expect(response.body.data.messageCountsByDay).toBeInstanceOf(Array);
        expect(response.body.data.messageCountsByDay.length).toBeGreaterThan(0);
        response.body.data.messageCountsByDay.forEach((count) => {
          expect(count).toMatchObject({
            parachain: expect.any(String),
            date: expect.any(String),
            messageCount: expect.any(Number),
            messageCountSuccess: expect.any(Number),
            messageCountFailed: expect.any(Number),
          });
        });
      });

      it('messageCountsByDay with valid chains and time range with no expected data', async () => {
        const parachains = ['AssetHubPolkadot', 'Acala'];
        const startTime = new Date('2018-01-01T00:00:00Z');
        const endTime = new Date('2018-01-07T23:59:59Z');
        const ecosystem = 'polkadot';

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
              query messageCountsByDay($ecosystem: String!, $parachains: [String!]!, $startTime: Timestamp!, $endTime: Timestamp!) {
                messageCountsByDay(ecosystem: $ecosystem, parachains: $parachains, startTime: $startTime, endTime: $endTime) {
                  parachain
                  date
                  messageCount
                  messageCountSuccess
                  messageCountFailed
                }
              }
            `,
            variables: {
              ecosystem,
              parachains,
              startTime: startTime.getTime() / 1000,
              endTime: endTime.getTime() / 1000,
            },
          })
          .expect(200);

        expect(response.body.data.messageCountsByDay).toBeInstanceOf(Array);
        expect(response.body.data.messageCountsByDay.length).toBe(0);
      });
    });

    describe('assetCountsBySymbol', () => {
      it('assetCountsBySymbol with valid parachains and time range with expected data', async () => {
        const parachains = ['AssetHubPolkadot', 'Acala'];
        const startTime = new Date('2023-01-01T00:00:00Z');
        const endTime = new Date('2023-01-07T23:59:59Z');
        const ecosystem = 'polkadot';

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
              query assetCountsBySymbol($ecosystem: String!, $parachains: [String!]!, $startTime: Timestamp!, $endTime: Timestamp!) {
                assetCountsBySymbol(ecosystem: $ecosystem, parachains: $parachains, startTime: $startTime, endTime: $endTime) {
                  parachain
                  symbol
                  count
                }
              }
            `,
            variables: {
              ecosystem,
              parachains,
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
            parachain: expect.any(String),
            symbol: expect.any(String),
            count: expect.any(Number),
          });
        });
      });

      it('assetCountsBySymbol with valid parachains and time range with no expected data', async () => {
        const parachains = ['AssetHubPolkadot', 'Acala'];
        const startTime = new Date('2018-01-01T00:00:00Z');
        const endTime = new Date('2018-01-07T23:59:59Z');
        const ecosystem = 'polkadot';

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
              query assetCountsBySymbol($ecosystem: String!, $parachains: [String!]!, $startTime: Timestamp!, $endTime: Timestamp!) {
                assetCountsBySymbol(ecosystem: $ecosystem, parachains: $parachains, startTime: $startTime, endTime: $endTime) {
                  parachain
                  symbol
                  count
                }
              }
            `,
            variables: {
              ecosystem,
              parachains,
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
        const ecosystem = 'kusama';

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
              query accountCounts(
                $ecosystem: String!
                $threshold: Int!
                $paraIds: [Int!]
                $startTime: Timestamp!
                $endTime: Timestamp!
              ) {
                accountCounts(
                  ecosystem: $ecosystem
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
              ecosystem,
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
        const ecosystem = 'kusama';

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
              query accountCounts(
                $ecosystem: String!
                $threshold: Int!
                $paraIds: [Int!]
                $startTime: Timestamp!
                $endTime: Timestamp!
              ) {
                accountCounts(
                  ecosystem: $ecosystem
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
              ecosystem,
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
        const ecosystem = 'kusama';

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
              query totalMessageCounts($ecosystem: String!, $startTime: Timestamp!, $endTime: Timestamp!, $countBy: CountOption!) {
                totalMessageCounts(ecosystem: $ecosystem, startTime: $startTime, endTime: $endTime, countBy: $countBy) {
                  paraId
                  totalCount
                }
              }
            `,
            variables: {
              ecosystem,
              startTime: startTime.getTime() / 1000,
              endTime: endTime.getTime() / 1000,
              countBy: countBy,
            },
          })
          .expect(200);

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
        const startTime = new Date('2018-01-01T00:00:00Z');
        const endTime = new Date('2018-01-31T23:59:59Z');
        const countBy = 'ORIGIN';
        const ecosystem = 'kusama';

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: `
              query totalMessageCounts($ecosystem: String!, $startTime: Timestamp!, $endTime: Timestamp!, $countBy: CountOption!) {
                totalMessageCounts(ecosystem: $ecosystem, startTime: $startTime, endTime: $endTime, countBy: $countBy) {
                  paraId
                  totalCount
                }
              }
            `,
            variables: {
              ecosystem,
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
