export const API_URL = "http://localhost:3001";

export const ASSET_QUERIES = [
  "ASSETS_OBJECT",
  "ASSET_ID",
  "RELAYCHAIN_SYMBOL",
  "NATIVE_ASSETS",
  "OTHER_ASSETS",
  "ALL_SYMBOLS",
  "DECIMALS",
  "HAS_SUPPORT",
  "PARA_ID",
  "BALANCE_NATIVE",
  "BALANCE_FOREIGN",
] as const;

export const PALLETS_QUERIES = ["ALL_PALLETS", "DEFAULT_PALLET"] as const;
