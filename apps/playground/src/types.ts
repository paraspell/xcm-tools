import { ASSET_QUERIES, CHANNELS_QUERIES, PALLETS_QUERIES } from './consts';

export type TAssetsQuery = (typeof ASSET_QUERIES)[number];

export type TPalletsQuery = (typeof PALLETS_QUERIES)[number];

export type TChannelsQuery = (typeof CHANNELS_QUERIES)[number];
