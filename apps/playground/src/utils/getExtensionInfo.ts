export const getExtensionInfo = (name?: string) => {
  switch (name) {
    case 'polkadot-js':
      return {
        name: 'Polkadot{.js}',
        icon: '/wallets/polkadotjs.svg',
      };
    case 'talisman':
      return {
        name: 'Talisman',
        icon: '/wallets/talisman.png',
      };
    case 'subwallet-js':
      return {
        name: 'SubWallet',
        icon: '/wallets/subwallet.svg',
      };
    case 'enkrypt':
      return {
        name: 'Enkrypt',
        icon: '/wallets/enkrypt.svg',
      };
    case 'fearless-wallet':
      return {
        name: 'Fearless Wallet',
        icon: '/wallets/fearless.svg',
      };
    case 'polkagate':
      return {
        name: 'Polkagate',
        icon: '/wallets/polkagate.png',
      };
    default:
      return {
        name: 'Unknown browser extension',
        icon: '',
      };
  }
};
