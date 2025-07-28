import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import {
  convertMultilocationToUrl,
  convertXCMToUrls,
} from '@paraspell/xcm-analyser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { XcmAnalyserService } from './xcm-analyser.service.js';

vi.mock('@paraspell/xcm-analyser', () => ({
  convertMultilocationToUrl: vi.fn(),
  convertXCMToUrls: vi.fn(),
}));

describe('XcmAnalyserService', () => {
  let service: XcmAnalyserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [XcmAnalyserService],
    }).compile();

    service = module.get<XcmAnalyserService>(XcmAnalyserService);
  });

  it('throws BadRequestException when neither location nor xcm is provided', () => {
    expect(() =>
      service.getLocationPaths({
        location: undefined,
        xcm: undefined,
      }),
    ).toThrow(BadRequestException);
    expect(() =>
      service.getLocationPaths({
        location: undefined,
        xcm: undefined,
      }),
    ).toThrow(BadRequestException);
  });

  it('throws BadRequestException when both location and xcm are provided', () => {
    expect(() =>
      service.getLocationPaths({
        location: {
          parents: 1,
          interior: {
            X1: [
              {
                Parachain: 1,
              },
            ],
          },
        },
        xcm: [{ bla: 'bla' }],
      }),
    ).toThrow(BadRequestException);
  });

  it('returns the correct URL for location', () => {
    const location = {
      parents: 1,
      interior: {
        X1: {
          Parachain: 1,
        },
      },
    };
    const expectedUrl = '../Parachain(1)';
    vi.mocked(convertMultilocationToUrl).mockReturnValue(expectedUrl);

    const result = service.getLocationPaths({
      location,
      xcm: undefined,
    });

    expect(convertMultilocationToUrl).toHaveBeenCalledWith(location);
    expect(result).toEqual(`"${expectedUrl}"`);
  });

  it('returns the correct URLs for xcm', () => {
    const xcm = [
      {
        parents: 1,
        interior: {
          X1: {
            Parachain: 1,
          },
        },
      },
    ];
    const expectedUrls = ['http://example.com/xcm1', 'http://example.com/xcm2'];
    vi.mocked(convertXCMToUrls).mockReturnValue(expectedUrls);

    const result = service.getLocationPaths({
      location: undefined,
      xcm,
    });

    expect(convertXCMToUrls).toHaveBeenCalledWith(xcm);
    expect(result).toEqual(expectedUrls);
  });

  it('throws InternalServerErrorException when conversion fails', () => {
    const xcm = [
      {
        parents: 1,
        interior: {
          X1: {
            Parachain: 1,
          },
        },
      },
    ];
    vi.mocked(convertXCMToUrls).mockImplementation(() => {
      throw new Error('Conversion failed');
    });

    expect(() =>
      service.getLocationPaths({ location: undefined, xcm }),
    ).toThrow(InternalServerErrorException);
  });
});
