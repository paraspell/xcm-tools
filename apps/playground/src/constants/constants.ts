import {
  IconBoxAlignBottomRight,
  IconCoins,
  IconCurrencyEthereum,
  IconPackages,
  IconSend,
  IconWallet,
} from '@tabler/icons-react';

import { PageRoute } from '../components/PageRoute';
import type { TNavItem } from '../types';

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
