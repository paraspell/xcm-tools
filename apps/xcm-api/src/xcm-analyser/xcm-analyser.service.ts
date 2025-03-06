import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  convertMultilocationToUrl,
  convertXCMToUrls,
} from '@paraspell/xcm-analyser';

import { XcmAnalyserDto } from './dto/xcm-analyser.dto.js';

@Injectable()
export class XcmAnalyserService {
  getMultiLocationPaths({ multilocation, xcm }: XcmAnalyserDto) {
    if (!multilocation && !xcm) {
      throw new BadRequestException(
        'Either multilocation or xcm must be provided',
      );
    }

    if (multilocation && xcm) {
      throw new BadRequestException(
        'Only one of multilocation or xcm must be provided',
      );
    }

    try {
      if (multilocation) {
        return `"${convertMultilocationToUrl(multilocation)}"`;
      } else {
        return convertXCMToUrls(xcm as unknown[]);
      }
    } catch (e) {
      if (e instanceof Error) {
        throw new InternalServerErrorException(e.message);
      }
    }
  }
}
