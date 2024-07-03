import { MultiLocation } from '../src/types';
import { convertMultilocationToUrl, convertXCMToUrls } from '../src/converter/convert';

const multilocation: MultiLocation = {
  parents: '1',
  interior: {
    X2: [{ PalletInstance: '50' }, { GeneralIndex: '1984' }],
  },
};

const url = convertMultilocationToUrl(multilocation);

console.log();
console.log(`URL: ${url}`);

// ParaToPara - Basilisk -> BifrostKusama xTokens.transfer arguments
const xcmCallArguments = [
  '1', // currency_id for KSM
  '100000000000', // amount - 0.1 KSM
  {
    // dest
    V3: {
      parents: '1',
      interior: {
        X2: [
          {
            Parachain: '2001', // BifrostKusama paraId
          },
          {
            AccountId32: {
              network: null,
              id: '0x84fc49ce30071ea611731838cc7736113c1ec68fbc47119be8a0805066df9b2b',
            },
          },
        ],
      },
    },
  },
  'Unlimited', // dest_weight_limit
];

const urls = convertXCMToUrls(xcmCallArguments);
console.log(`URLs: ${urls.toString()}`);
