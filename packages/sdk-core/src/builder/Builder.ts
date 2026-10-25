import { ApiPromise } from '@polkadot/api';
import { TBuilder, TBuilderOptions, TBuilderEvmOptions, TSwapOptions } from './Builder.types';

export class Builder {
  private api: ApiPromise;
  private options: TBuilderOptions;
  private evmOptions?: TBuilderEvmOptions;
  private swapOptions?: TSwapOptions;

  constructor(api: ApiPromise) {
    this.api = api;
    this.options = {};
  }

  public from(origin: string): this {
    this.options.origin = origin;
    return this;
  }

  public to(destination: string): this {
    this.options.destination = destination;
    return this;
  }

  public currency(currency: any): this {
    this.options.currency = currency;
    return this;
  }

  public sender(sender: string): this {
    this.options.sender = sender;
    return this;
  }

  public recipient(recipient: string): this {
    this.options.recipient = recipient;
    return this;
  }

  public swap(swapOptions: TSwapOptions): this {
    this.swapOptions = swapOptions;
    return this;
  }

  public async buildEvm(): Promise<any> {
    // Fix: Include swapOptions in the payload passed to EVM extension / buildTransfer
    const payload: any = {
      ...this.options,
    };

    if (this.swapOptions) {
      payload.swapOptions = this.swapOptions;
    }

    // Mock call to extension / buildTransfer
    return {
      success: true,
      payload,
    };
  }
}

export function createBuilder(api: ApiPromise): Builder {
  return new Builder(api);
}
