import {
  IconBoxAlignBottomRight,
  IconCoins,
  IconCurrencyEthereum,
  IconPackages,
  IconSend,
  IconWallet,
} from '@tabler/icons-react';

import { PageRoute } from '../components/PageRoute';
import type { TNavItem, TTransactFields } from '../types';

export const NAVIGATION_ITEMS: TNavItem[] = [
  {
    label: 'XCM Transfer',
    url: PageRoute.XCM_SDK.XCM_TRANSFER,
    Icon: IconSend,
  },
  {
    label: 'EVM Transfer',
    url: PageRoute.XCM_SDK.EVM_TRANSFER,
    Icon: IconCurrencyEthereum,
  },
  {
    label: 'XCM Utils',
    url: PageRoute.XCM_SDK.XCM_UTILS,
    Icon: IconPackages,
  },
  {
    label: 'Assets',
    url: PageRoute.XCM_SDK.ASSETS,
    Icon: IconCoins,
  },
  {
    label: 'Pallets',
    url: PageRoute.XCM_SDK.PALLETS,
    Icon: IconBoxAlignBottomRight,
  },
  {
    label: 'Asset Claim',
    url: PageRoute.XCM_SDK.ASSET_CLAIM,
    Icon: IconWallet,
  },
];

export const DAPP_NAME = 'Paraspell';

export const DEFAULT_ADDRESS =
  '5FNDaod3wYTvg48s73H1zSB3gVoKNg2okr6UsbyTuLutTXFz';

export const MAIN_FORM_NAME = 'form';

export const LOCAL_ACCOUNTS = [
  'Alice',
  'Bob',
  'Charlie',
  'Dave',
  'Eve',
  'Ferdie',
];

export const DEFAULT_TRANSACT_OPTIONS: TTransactFields['transactOptions'] = {
  call: '',
  originKind: 'SovereignAccount',
};

export const API_URL = import.meta.env.VITE_API_URL as string;

export const ASSET_QUERIES = [
  'ASSETS_OBJECT',
  'ASSET_ID',
  'ASSET_LOCATION',
  'ASSET_INFO',
  'RELAYCHAIN_SYMBOL',
  'NATIVE_ASSETS',
  'OTHER_ASSETS',
  'SUPPORTED_ASSETS',
  'FEE_ASSETS',
  'ALL_SYMBOLS',
  'DECIMALS',
  'HAS_SUPPORT',
  'PARA_ID',
  'CONVERT_SS58',
  'ASSET_BALANCE',
  'EXISTENTIAL_DEPOSIT',
  'HAS_DRY_RUN_SUPPORT',
  'ETHEREUM_BRIDGE_STATUS',
  'PARA_ETH_FEES',
  'SUPPORTED_DESTINATIONS',
] as const;

export const PALLETS_QUERIES = [
  'ALL_PALLETS',
  'DEFAULT_PALLET',
  'PALLET_INDEX',
  'NATIVE_ASSETS_PALLET',
  'OTHER_ASSETS_PALLETS',
] as const;
