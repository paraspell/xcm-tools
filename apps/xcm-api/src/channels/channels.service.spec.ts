import { vi, describe, beforeEach, it, expect } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ChannelsService } from './channels.service.js';
import { BadRequestException } from '@nestjs/common';
import * as paraspellSdk from '@paraspell/sdk';
import { TNode } from '@paraspell/sdk';

const builderMock = {
  from: vi.fn().mockReturnThis(),
  to: vi.fn().mockReturnThis(),
  openChannel: vi.fn().mockReturnThis(),
  maxSize: vi.fn().mockReturnThis(),
  maxMessageSize: vi.fn().mockReturnThis(),
  buildSerializedApiCall: vi.fn().mockReturnValue('serialized-api-call'),
};

vi.mock('@paraspell/sdk', async () => {
  const actual = await vi.importActual('@paraspell/sdk');
  return {
    ...actual,
    Builder: vi.fn().mockImplementation(() => builderMock),
  };
});

describe('ChannelsService', () => {
  let service: ChannelsService;
  const maxSize = '512';
  const maxMessageSize = '512';
  const inbound = '50';
  const outbound = '40';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChannelsService],
    }).compile();

    service = module.get<ChannelsService>(ChannelsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('openChannel', () => {
    it('should open a channel with valid parameters', () => {
      const from: TNode = 'Acala';
      const to: TNode = 'Basilisk';

      const mockOpenChannelDto = {
        from,
        to,
        maxSize,
        maxMessageSize,
      };

      const builderSpy = vi.spyOn(paraspellSdk, 'Builder');

      const result = service.openChannel(mockOpenChannelDto);

      expect(result).toBe('serialized-api-call');
      expect(builderSpy).toHaveBeenCalledWith(null);
      expect(builderMock.from).toHaveBeenCalledWith(from);
      expect(builderMock.to).toHaveBeenCalledWith(to);
      expect(builderMock.maxSize).toHaveBeenCalledWith(Number(maxSize));
      expect(builderMock.maxMessageSize).toHaveBeenCalledWith(
        Number(maxMessageSize),
      );
    });

    it('should throw BadRequestException for invalid from node', () => {
      const from = 'InvalidNode';
      const to: TNode = 'Basilisk';
      const mockOpenChannelDto = {
        from,
        to,
        maxSize,
        maxMessageSize,
      };

      expect(() => service.openChannel(mockOpenChannelDto)).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid to node', () => {
      const from: TNode = 'Basilisk';
      const to = 'InvalidNode';
      const mockOpenChannelDto = {
        from,
        to,
        maxSize,
        maxMessageSize,
      };

      expect(() => service.openChannel(mockOpenChannelDto)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('closeChannel', () => {
    it('should close a channel with valid parameters', () => {
      const from: TNode = 'Acala';

      const mockCloseChannelDto = {
        from,
        inbound,
        outbound,
      };

      // Redefine builderMock for this test
      const builderMock = {
        from: vi.fn().mockReturnThis(),
        closeChannel: vi.fn().mockReturnThis(),
        inbound: vi.fn().mockReturnThis(),
        outbound: vi.fn().mockReturnThis(),
        buildSerializedApiCall: vi.fn().mockReturnValue('serialized-api-call'),
      };

      // Mock Builder with the new mock object
      const builderSpy = vi
        .spyOn(paraspellSdk, 'Builder')
        .mockImplementation(() => builderMock as any);

      const result = service.closeChannel(mockCloseChannelDto);

      expect(result).toBe('serialized-api-call');
      expect(builderSpy).toHaveBeenCalledWith(null);
      expect(builderMock.from).toHaveBeenCalledWith(from);
      expect(builderMock.inbound).toHaveBeenCalledWith(Number(inbound));
      expect(builderMock.outbound).toHaveBeenCalledWith(Number(outbound));
      expect(builderMock.buildSerializedApiCall).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid nodes', () => {
      const from = 'InvalidNode';
      const mockCloseChannelDto = {
        from,
        inbound,
        outbound,
      };

      expect(() => service.closeChannel(mockCloseChannelDto)).toThrow(
        BadRequestException,
      );
    });
  });
});
