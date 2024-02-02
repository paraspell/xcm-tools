import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service.js';
import { ConfigService } from '@nestjs/config';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: ConfigService, useValue: { get: () => '' } },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
