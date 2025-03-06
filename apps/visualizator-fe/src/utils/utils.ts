import {
  prodRelayKusama,
  prodRelayPolkadot,
  testRelayWestend
} from '@polkadot/apps-config/endpoints';

import type { SelectedParachain } from '../context/SelectedParachain/SelectedParachainContext';
import { Ecosystem } from '../types/types';

export const getParachainId = (parachain: SelectedParachain, ecosystem: Ecosystem): number => {
  if (parachain === 'Polkadot' || parachain === 'Kusama') return 0;

  const paraId = findEndpointOption(ecosystem, parachain)?.paraId;

  if (!paraId) throw new Error(`Parachain ${parachain} not found in ecosystem ${ecosystem}`);

  return paraId;
};

export const getParachainById = (id: number, ecosystem: Ecosystem): SelectedParachain | null => {
  if (id === 0) return ecosystem === Ecosystem.POLKADOT ? 'Polkadot' : 'Kusama';
  const parachain = getFilteredEndpointOptions(ecosystem)?.find(node => node.paraId === id)?.text;
  if (!parachain) return null;
  return parachain;
};

export const getParachainColor = (parachain: SelectedParachain, ecosystem: Ecosystem): string => {
  if (parachain === 'Polkadot' || parachain === 'Kusama') return 'blue.6';
  return findEndpointOption(ecosystem, parachain)?.ui.color ?? 'gray.6';
};

export const getParachainLogo = (
  parachain: SelectedParachain,
  ecosystem: Ecosystem
): string | undefined => {
  return getFilteredEndpointOptions(ecosystem)?.find(node => node.text === parachain)?.ui.logo;
};

export const getNodesByEcosystem = (ecosystem: Ecosystem) =>
  getFilteredEndpointOptions(ecosystem)?.map(option => option.text) ?? [];

const findEndpointOption = (ecosystem: Ecosystem, parachain: SelectedParachain) => {
  return getFilteredEndpointOptions(ecosystem)?.find(node => node.text === parachain);
};

export const getFilteredEndpointOptions = (ecosystem: Ecosystem) => {
  return getEndpointOptions(ecosystem)?.filter(({ providers, isUnreachable }) => {
    const hasProviders = Object.keys(providers).length !== 0;
    return hasProviders && !isUnreachable;
  });
};

const getEndpointOptions = (ecosystem: Ecosystem) => {
  switch (ecosystem) {
    case Ecosystem.POLKADOT:
      return prodRelayPolkadot.linked;
    case Ecosystem.KUSAMA:
      return prodRelayKusama.linked;
    case Ecosystem.WESTEND:
      return testRelayWestend.linked;
  }
};
