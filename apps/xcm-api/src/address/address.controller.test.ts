import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { TNode } from '@paraspell/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AnalyticsService } from '../analytics/analytics.service.js';
import { mockRequestObject } from '../testUtils.js';
import { AddressController } from './address.controller.js';
import { AddressService } from './address.service.js';

describe('AddressController', () => {
  let controller: AddressController;
  let service: AddressService;
  const mockNode: TNode = 'Acala';
  const mockAddress = '5GrwvaEF...';
  const mockOutputAddress = '5GrwvaEF...';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AddressController],
      providers: [
        AddressService,
        {
          provide: AnalyticsService,
          useValue: { get: () => '', track: vi.fn() },
        },
      ],
    }).compile();

    controller = module.get<AddressController>(AddressController);
    service = module.get<AddressService>(AddressService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('convertSs58', () => {
    it('should return assets object for a valid node', () => {
      const spy = vi
        .spyOn(service, 'convertSs58')
        .mockReturnValue(mockOutputAddress);

      const result = controller.convertSs58(
        {
          address: mockAddress,
          node: mockNode,
        },
        mockRequestObject,
      );

      expect(result).toBe(mockOutputAddress);
      expect(spy).toHaveBeenCalledWith(mockAddress, mockNode);
    });
  });
});
