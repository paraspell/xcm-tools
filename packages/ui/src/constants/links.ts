import {
  IconBrandGithub,
  IconBrandTelegram,
  IconBrandX,
} from '@tabler/icons-react';

export const SITE_URL = 'https://paraspell.xyz/';
export const GITHUB_URL = 'https://github.com/paraspell/xcm-tools/';
export const DOCS_URL = 'https://paraspell.github.io/docs/';
export const X_URL = 'https://x.com/paraspell';

const gettingStarted = (tool: string) =>
  `${DOCS_URL}${tool}/getting-started.html`;

export const DOCS_LINKS = {
  xcmSdk: gettingStarted('xcm-sdk'),
  xcmApi: gettingStarted('xcm-api'),
  xcmAnalyser: gettingStarted('xcm-analyser'),
  cli: gettingStarted('paraspell-cli'),
};

export const SOCIALS = [
  { label: 'GitHub', link: GITHUB_URL, icon: IconBrandGithub },
  { label: 'X', link: X_URL, icon: IconBrandX },
  {
    label: 'Telegram',
    link: 'https://t.me/paraspell',
    icon: IconBrandTelegram,
  },
];
