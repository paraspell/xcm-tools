import { SelectedParachain } from '../context/SelectedParachain/SelectedParachainContext';
import { prodRelayPolkadot } from '@polkadot/apps-config/endpoints';

export const getParachainId = (parachain: SelectedParachain): number => {
  if (parachain === 'Polkadot') return 0;

  // Special case for Polkadex
  if (parachain === 'Polkadex') return 2040;

  const paraId = prodRelayPolkadot.linked?.find(node => node.text === parachain)?.paraId;
  if (!paraId) throw new Error(`Parachain ${parachain} not found`);
  return paraId;
};

export const getParachainById = (id: number): SelectedParachain | null => {
  if (id === 0) return 'Polkadot';
  const parachain = prodRelayPolkadot.linked?.find(node => node.paraId === id)?.text;
  if (!parachain) return null;
  return parachain;
};

export const getParachainColor = (parachain: SelectedParachain): string => {
  if (parachain === 'Polkadot') return 'blue.6';
  return prodRelayPolkadot.linked?.find(node => node.text === parachain)?.ui.color ?? 'gray.6';
};

export const getParachainLogo = (parachain: SelectedParachain): string | undefined => {
  return prodRelayPolkadot.linked?.find(node => node.text === parachain)?.ui.logo;
};
