import { Module } from '@nestjs/common';

import { XcmAnalyserController } from './xcm-analyser.controller.js';
import { XcmAnalyserService } from './xcm-analyser.service.js';

@Module({
  controllers: [XcmAnalyserController],
  providers: [XcmAnalyserService],
})
export class XcmAnalyserModule {}
