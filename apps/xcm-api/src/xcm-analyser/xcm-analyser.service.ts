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
        return JSON.stringify(convertMultilocationToUrl(multilocation));
      } else {
        return JSON.stringify(convertXCMToUrls(xcm));
      }
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw new InternalServerErrorException(e.message);
    }
  }
}
