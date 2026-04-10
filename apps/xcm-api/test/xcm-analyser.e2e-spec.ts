import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, it } from 'vitest';

import { createTestApp } from './helpers/app';

describe('XCM Analyser controller (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Get location paths - No location or xcm provided - /xcm-analyser', () => {
    return request(app.getHttpServer()).post('/xcm-analyser').expect(400);
  });

  it('Get location paths - Invalid location provided - /xcm-analyser', () => {
    return request(app.getHttpServer())
      .post('/xcm-analyser')
      .send({
        location: {
          parents: '0',
          exterior: {
            X1: {
              Parachain: '2000',
            },
          },
        },
      })
      .expect(400);
  });

  it('Get location paths - XCM without any locations provided - /xcm-analyser', () => {
    return request(app.getHttpServer())
      .post('/xcm-analyser')
      .send({
        xcm: ['0x123'],
      })
      .expect(201)
      .expect('[]');
  });

  it('Get location paths - Valid location - /xcm-analyser', () => {
    return request(app.getHttpServer())
      .post('/xcm-analyser')
      .send({
        location: {
          parents: '0',
          interior: {
            X1: {
              Parachain: '2000',
            },
          },
        },
      })
      .expect(201)
      .expect('"./Parachain(2000)"');
  });

  it('Get location paths - Valid XCM - /xcm-analyser', () => {
    return request(app.getHttpServer())
      .post('/xcm-analyser')
      .send({
        xcm: ['0x123'],
      })
      .expect(201)
      .expect('[]');
  });
});
