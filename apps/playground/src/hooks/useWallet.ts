import { useContext } from 'react';

import { WalletContext } from '../providers/WalletContext';

export const useWallet = () => useContext(WalletContext);
