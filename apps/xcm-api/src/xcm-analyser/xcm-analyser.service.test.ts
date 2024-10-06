import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

import { Test, type TestingModule } from '@nestjs/testing';
import { XcmAnalyserService } from './xcm-analyser.service.js';
import {
  convertMultilocationToUrl,
  convertXCMToUrls,
} from '@paraspell/xcm-analyser';

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

  it('throws BadRequestException when neither multilocation nor xcm is provided', () => {
    expect(() =>
      service.getMultiLocationPaths({
        multilocation: undefined,
        xcm: undefined,
      }),
    ).toThrow(BadRequestException);
    expect(() =>
      service.getMultiLocationPaths({ multilocation: null, xcm: null }),
    ).toThrow(BadRequestException);
  });

  it('throws BadRequestException when both multilocation and xcm are provided', () => {
    expect(() =>
      service.getMultiLocationPaths({
        multilocation: {
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

  it('returns the correct URL for multilocation', () => {
    const multilocation = {
      parents: 1,
      interior: {
        X1: {
          Parachain: 1,
        },
      },
    };
    const expectedUrl = '../Parachain(1)';
    vi.mocked(convertMultilocationToUrl).mockReturnValue(expectedUrl);

    const result = service.getMultiLocationPaths({
      multilocation,
      xcm: undefined,
    });

    expect(convertMultilocationToUrl).toHaveBeenCalledWith(multilocation);
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

    const result = service.getMultiLocationPaths({
      multilocation: undefined,
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
      service.getMultiLocationPaths({ multilocation: undefined, xcm }),
    ).toThrow(InternalServerErrorException);
  });
});
