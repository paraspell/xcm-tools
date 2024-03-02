import { vi, describe, beforeEach, it, expect } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ChannelsController } from './channels.controller.js';
import { ChannelsService } from './channels.service.js';
import { OpenChannelDto } from './dto/open-channel.dto.js';
import { CloseChannelDto } from './dto/close-channel.dto.js';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { mockRequestObject } from '../testUtils.js';

// Integration tests to ensure controller and service are working together
describe('ChannelsController', () => {
  let controller: ChannelsController;
  let channelsService: ChannelsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChannelsController],
      providers: [
        ChannelsService,
        {
          provide: AnalyticsService,
          useValue: { get: () => '', track: vi.fn() },
        },
      ],
    }).compile();

    controller = module.get<ChannelsController>(ChannelsController);
    channelsService = module.get<ChannelsService>(ChannelsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('openChannel', () => {
    it('should open a channel and return the result', async () => {
      const openChannelDto: OpenChannelDto = {
        from: 'Acala',
        to: 'Basilisk',
        maxSize: '512',
        maxMessageSize: '256',
      };
      const mockResult = 'serialized-api-call';
      vi.spyOn(channelsService, 'openChannel' as any).mockResolvedValue(
        mockResult,
      );

      const result = await controller.openChannel(
        openChannelDto,
        mockRequestObject,
      );

      expect(result).toBe(mockResult);
      expect(channelsService.openChannel).toHaveBeenCalledWith(openChannelDto);
    });
  });

  describe('closeChannel', () => {
    it('should close a channel and return the result', async () => {
      const closeChannelDto: CloseChannelDto = {
        from: 'Acala',
        inbound: '1',
        outbound: '2',
      };
      const mockResult = 'serialized-api-call';
      vi.spyOn(channelsService, 'closeChannel' as any).mockResolvedValue(
        mockResult,
      );

      const result = await controller.closeChannel(
        closeChannelDto,
        mockRequestObject,
      );

      expect(result).toBe(mockResult);
      expect(channelsService.closeChannel).toHaveBeenCalledWith(
        closeChannelDto,
      );
    });
  });
});
