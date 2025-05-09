import type { TPapiApi } from '@paraspell/sdk';
import type { Extrinsic } from '@paraspell/sdk-pjs';
import { Binary } from 'polkadot-api';

export const convertTxToPapi = async (tx: Extrinsic, papiApi: TPapiApi) => {
  const pjsHex = tx.toHex();

  const stripHeaderBytes = (hex: string, byteCount: number) => '0x' + hex.slice(2 + byteCount * 2);

  const tryTxFromCallData = (hex: string) =>
    papiApi.getUnsafeApi().txFromCallData(Binary.fromHex(hex));

  try {
    const hex2 = stripHeaderBytes(pjsHex, 2);
    return await tryTxFromCallData(hex2);
  } catch (_err) {
    const hex3 = stripHeaderBytes(pjsHex, 3);
    // let any further error bubble up
    return await tryTxFromCallData(hex3);
  }
};
