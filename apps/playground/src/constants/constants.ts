import {
  IconBoxAlignBottomRight,
  IconCoins,
  IconCurrencyEthereum,
  IconSend,
  IconSend2,
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
    label: 'Transfer Info',
    url: PageRoute.XCM_SDK.TRANSFER_INFO,
    Icon: IconSend2,
  },
  {
    label: 'Asset Claim',
    url: PageRoute.XCM_SDK.ASSET_CLAIM,
    Icon: IconWallet,
  },
];

export const DAPP_NAME = 'Paraspell';
