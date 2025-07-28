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
  getLocationPaths({ location, xcm }: XcmAnalyserDto) {
    if (!location && !xcm) {
      throw new BadRequestException('Either location or xcm must be provided');
    }

    if (location && xcm) {
      throw new BadRequestException(
        'Only one of location or xcm must be provided',
      );
    }

    try {
      if (location) {
        return `"${convertMultilocationToUrl(location)}"`;
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
