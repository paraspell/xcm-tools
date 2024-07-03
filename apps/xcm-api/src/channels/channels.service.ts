import { BadRequestException, Injectable } from '@nestjs/common';
import { OpenChannelDto } from './dto/open-channel.dto.js';
import { CloseChannelDto } from './dto/close-channel.dto.js';
import { Builder, NODE_NAMES, TNode } from '@paraspell/sdk';

@Injectable()
export class ChannelsService {
  openChannel({ from, to, maxSize, maxMessageSize }: OpenChannelDto) {
    if (!NODE_NAMES.includes(from as TNode)) {
      throw new BadRequestException(
        `From node ${from} is not valid. Check docs for valid nodes.`,
      );
    }

    if (!NODE_NAMES.includes(to as TNode)) {
      throw new BadRequestException(
        `To node ${to} is not valid. Check docs for valid nodes.`,
      );
    }

    return Builder(null)
      .from(from as TNode)
      .to(to as TNode)
      .openChannel()
      .maxSize(Number(maxSize))
      .maxMessageSize(Number(maxMessageSize))
      .buildSerializedApiCall();
  }

  closeChannel({ from, inbound, outbound }: CloseChannelDto) {
    if (!NODE_NAMES.includes(from as TNode)) {
      throw new BadRequestException(
        `From node ${from} is not valid. Check docs for valid nodes.`,
      );
    }

    return Builder(null)
      .from(from as TNode)
      .closeChannel()
      .inbound(Number(inbound))
      .outbound(Number(outbound))
      .buildSerializedApiCall();
  }
}
