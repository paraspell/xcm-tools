import { type ASSET_QUERIES, type PALLETS_QUERIES } from "./consts";

export type TAssetsQuery = (typeof ASSET_QUERIES)[number];

export type TPalletsQuery = (typeof PALLETS_QUERIES)[number];
