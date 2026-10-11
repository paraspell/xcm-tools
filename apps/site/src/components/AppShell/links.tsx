import {
  IconBrandGithub,
  IconBrandTelegram,
  IconBrandX,
} from "@tabler/icons-react";

export const GITHUB_URL = "https://github.com/paraspell/xcm-tools/";
export const DOCS_URL = "https://paraspell.github.io/docs/";

export const links = [
  {
    label: "XCM Tools",
    links: [
      { link: "/#xcm-sdk", label: "XCM SDK 🪄" },
      { link: "/#xcm-api", label: "XCM API ⚡️" },
      { link: "/#xcm-analyser", label: "XCM Analyser 🔎" },
      { link: "/#xcm-cli", label: "ParaSpell CLI 🧰" },
    ],
  },
  { link: "/#features", label: "Features" },
  { link: "/#try-it", label: "Try it" },
  { link: "/#research", label: "Research" },
  { link: "/#contact-us", label: "Contact us" },
];

export const socials = [
  { label: "GitHub", link: GITHUB_URL, icon: IconBrandGithub },
  { label: "X", link: "https://x.com/paraspell", icon: IconBrandX },
  {
    label: "Telegram",
    link: "https://t.me/paraspell",
    icon: IconBrandTelegram,
  },
];
