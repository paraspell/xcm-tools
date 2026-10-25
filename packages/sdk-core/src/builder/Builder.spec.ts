import { Builder } from './Builder';

describe('Builder EVM Swap integration', () => {
  it('should include swapOptions in buildEvm payload', async () => {
    const mockApi = {} as any;
    const builder = new Builder(mockApi);

    const result = await builder
      .from('Ethereum')
      .to('AssetHubPolkadot')
      .currency({ symbol: 'USDC', amount: 1 })
      .sender('0x1234')
      .recipient('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY')
      .swap({ currencyTo: { symbol: 'DOT' }, exchange: 'AssetHubPolkadot' })
      .buildEvm();

    expect(result.payload).toHaveProperty('swapOptions');
    expect(result.payload.swapOptions).toEqual({
      currencyTo: { symbol: 'DOT' },
      exchange: 'AssetHubPolkadot',
    });
  });
});
